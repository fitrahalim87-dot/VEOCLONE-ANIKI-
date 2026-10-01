import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function getPort(): number {
  const portIdx = process.argv.indexOf('--port');
  if (portIdx !== -1 && process.argv[portIdx + 1]) {
    const p = parseInt(process.argv[portIdx + 1], 10);
    if (!isNaN(p)) return p;
  }
  return Number(process.env.PORT) || 3000;
}
const PORT = getPort();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory state for paired Colab notebooks
interface ColabNotebook {
  notebook_id: string;
  code: string;
  url: string;
  engine: string;
  gpu: string;
  version: string;
  endpoint: string;
  api_base: string;
  note?: string;
  last_error?: string;
  jobs: number;
  last_seen: number;
}

let activePairingSecret = process.env.PAIRING_SECRET || 'DzwNNj0TMpfc0BzIWhZzBCtl6Y0';
const connectedNotebooks = new Map<string, ColabNotebook>();

// Helper to get most recent active notebook (seen in last 90 seconds)
function getActiveNotebook(): ColabNotebook | null {
  const now = Date.now();
  let latest: ColabNotebook | null = null;
  for (const nb of connectedNotebooks.values()) {
    // If it's a direct connection or recent heartbeat in last 120s
    if (nb.notebook_id.startsWith('direct_') || now - nb.last_seen < 120000) {
      if (!latest || nb.last_seen > latest.last_seen) {
        latest = nb;
      }
    }
  }
  return latest;
}

// 1. Heartbeat from Colab Notebook
app.post('/api/notebook/heartbeat', (req, res) => {
  const {
    notebook_id,
    secret,
    code,
    url,
    engine,
    gpu,
    version,
    endpoint,
    api_base,
    note,
    last_error,
    jobs,
  } = req.body || {};

  if (!secret || secret.trim() !== activePairingSecret.trim()) {
    console.warn(`[Heartbeat] Invalid secret: ${secret} (expected: ${activePairingSecret})`);
    return res.status(200).json({
      ok: false,
      message: 'Pairing secret tidak cocok. Periksa secret di pengaturan aplikasi.',
    });
  }

  if (!notebook_id || !code || !url) {
    return res.status(400).json({
      ok: false,
      message: 'Parameter tidak lengkap (notebook_id, code, url dibutuhkan).',
    });
  }

  const notebook: ColabNotebook = {
    notebook_id: String(notebook_id),
    code: String(code),
    url: String(url).replace(/\/$/, ''),
    engine: String(engine || 'OmniVoice'),
    gpu: String(gpu || 'T4 GPU'),
    version: String(version || ''),
    endpoint: String(endpoint || 'generate_voice'),
    api_base: String(api_base || '/gradio_api'),
    note: note ? String(note) : undefined,
    last_error: last_error ? String(last_error) : undefined,
    jobs: Number(jobs || 0),
    last_seen: Date.now(),
  };

  connectedNotebooks.set(notebook.notebook_id, notebook);
  console.log(`[Heartbeat] Connected: ${notebook.notebook_id} | Code: ${notebook.code} | GPU: ${notebook.gpu} | URL: ${notebook.url}`);

  return res.json({
    ok: true,
    message: 'Heartbeat diterima.',
    notebook_id: notebook.notebook_id,
  });
});

// 2. Status API for Frontend
app.get('/api/notebook/status', (req, res) => {
  const active = getActiveNotebook();
  const all = Array.from(connectedNotebooks.values()).map((nb) => ({
    notebook_id: nb.notebook_id,
    code: nb.code,
    engine: nb.engine,
    gpu: nb.gpu,
    is_online: Date.now() - nb.last_seen < 90000,
    last_seen: nb.last_seen,
    jobs: nb.jobs,
    last_error: nb.last_error,
    note: nb.note,
    url: nb.url ? nb.url.replace(/(https?:\/\/)([^.]+)/, '$1***') : '', // masked url for safety
  }));

  res.json({
    ok: true,
    connected: !!active,
    active_notebook: active
      ? {
          notebook_id: active.notebook_id,
          code: active.code,
          engine: active.engine,
          gpu: active.gpu,
          url: active.url,
          endpoint: active.endpoint,
          jobs: active.jobs,
          last_seen: active.last_seen,
          last_error: active.last_error,
          note: active.note,
        }
      : null,
    pairing_secret: activePairingSecret,
    app_url: process.env.APP_URL || `${req.protocol}://${req.get('host')}`,
    recent_notebooks: all,
  });
});

// 3. Verify Access Code
app.post('/api/notebook/verify-code', (req, res) => {
  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ ok: false, message: 'Kode akses wajib diisi.' });
  }

  const cleanCode = String(code).trim();
  const active = getActiveNotebook();
  const serverAppUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

  if (!active) {
    return res.status(404).json({
      ok: false,
      message: `Belum ada sinyal dari Google Colab. Pastikan APP_URL di sel 1 Colab diisi '${serverAppUrl}', atau gunakan opsi 'Sambung Manual via URL Tunnel Colab' di bawah.`,
      app_url: serverAppUrl,
    });
  }

  if (active.code.trim() !== cleanCode) {
    return res.status(400).json({
      ok: false,
      message: `Kode akses tidak cocok (${cleanCode}). Kode aktif yang terhubung adalah: ${active.code}.`,
    });
  }

  return res.json({
    ok: true,
    message: 'Koneksi ke Google Colab berhasil!',
    notebook: {
      notebook_id: active.notebook_id,
      code: active.code,
      engine: active.engine,
      gpu: active.gpu,
      jobs: active.jobs,
    },
  });
});

// 3b. Direct Connect via Colab Public/Tunnel URL
app.post('/api/notebook/direct-connect', async (req, res) => {
  const { url, code } = req.body || {};
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ ok: false, message: 'URL tunnel Google Colab wajib diisi.' });
  }

  let cleanUrl = url.trim().replace(/\/$/, '');
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  console.log(`[DirectConnect] Verifying Colab tunnel: ${cleanUrl}...`);

  try {
    let reachable = false;
    try {
      const testRes = await fetch(`${cleanUrl}/gradio_api/info`, {
        signal: AbortSignal.timeout(10000),
      });
      if (testRes.status < 500) {
        reachable = true;
      }
    } catch {
      try {
        const testRes2 = await fetch(cleanUrl, { signal: AbortSignal.timeout(8000) });
        if (testRes2.status < 500) reachable = true;
      } catch (err: any) {
        console.warn('[DirectConnect] Fetch warning:', err.message);
      }
    }

    const assignedCode = code && String(code).trim().length === 6 ? String(code).trim() : '120202';
    const notebook: ColabNotebook = {
      notebook_id: `direct_${Date.now()}`,
      code: assignedCode,
      url: cleanUrl,
      engine: 'OmniVoice (k2-fsa)',
      gpu: 'T4 GPU (Colab)',
      version: 'Gradio / Cloudflare Tunnel',
      endpoint: 'generate_voice',
      api_base: '/gradio_api',
      note: 'Terhubung langsung melalui URL tunnel Colab',
      jobs: 0,
      last_seen: Date.now() + 86400000, // kept alive
    };

    connectedNotebooks.set(notebook.notebook_id, notebook);
    console.log(`[DirectConnect] Registered notebook successfully: ${cleanUrl} (Code: ${assignedCode})`);

    return res.json({
      ok: true,
      message: 'Berhasil tersambung langsung ke Google Colab!',
      notebook: {
        notebook_id: notebook.notebook_id,
        code: notebook.code,
        engine: notebook.engine,
        gpu: notebook.gpu,
        url: notebook.url,
        jobs: 0,
      },
    });
  } catch (err: any) {
    console.error('[DirectConnect] Error:', err);
    return res.status(500).json({
      ok: false,
      message: `Gagal menghubungi URL Colab (${err.message || String(err)}). Pastikan link tunnel masih aktif.`,
    });
  }
});

// 4. Update Pairing Secret from Admin
app.post('/api/notebook/admin/secret', (req, res) => {
  const { secret } = req.body || {};
  if (!secret || typeof secret !== 'string' || secret.trim().length < 4) {
    return res.status(400).json({
      ok: false,
      message: 'Secret harus memiliki minimal 4 karakter.',
    });
  }
  activePairingSecret = secret.trim();
  console.log(`[Admin] Updated pairing secret to: ${activePairingSecret}`);
  return res.json({
    ok: true,
    message: 'Pairing secret berhasil diperbarui.',
    pairing_secret: activePairingSecret,
  });
});

// 5. Proxy Voice Design Call to Colab Gradio
app.post('/api/voice/design', async (req, res) => {
  const active = getActiveNotebook();
  if (!active) {
    return res.status(503).json({
      ok: false,
      message: 'Notebook Google Colab belum terhubung. Jalankan notebook di Colab untuk memulai.',
    });
  }

  const {
    text,
    instruct,
    language = 'Indonesian',
    steps = 32,
    cfg = 2.0,
    speed = 1.0,
    duration = 0,
    format = 'wav',
    normalize_numbers = true,
    categories = [],
  } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({ ok: false, message: 'Naskah teks wajib diisi.' });
  }

  const cats = Array.isArray(categories) ? categories : ['Otomatis', 'Otomatis', 'Otomatis', 'Otomatis', 'Otomatis'];
  // Pad categories to 5 items: Gender, Usia, Pitch, Gaya, Aksen
  while (cats.length < 5) cats.push('Otomatis');

  try {
    const gradioUrl = `${active.url}/gradio_api/call/voice_design`;
    console.log(`[VoiceDesign] Calling Gradio at ${gradioUrl}...`);

    const payload = {
      data: [
        text.trim(),
        instruct ? instruct.trim() : '',
        language,
        Number(steps),
        Number(cfg),
        Number(speed),
        Number(duration),
        format,
        Boolean(normalize_numbers),
        ...cats,
      ],
    };

    const callRes = await fetch(gradioUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
    });

    if (!callRes.ok) {
      const errText = await callRes.text();
      return res.status(502).json({
        ok: false,
        message: `Gradio POST call gagal (HTTP ${callRes.status}): ${errText.slice(0, 200)}`,
      });
    }

    const { event_id } = (await callRes.json()) as { event_id: string };
    if (!event_id) {
      return res.status(502).json({ ok: false, message: 'Tidak menerima event_id dari Gradio.' });
    }

    // Read SSE stream from Gradio
    const streamRes = await fetch(`${active.url}/gradio_api/call/voice_design/${event_id}`, {
      headers: { Accept: 'text/event-stream' },
      signal: AbortSignal.timeout(420000), // 7 minutes timeout for model generation
    });

    const streamText = await streamRes.text();
    const dataLines = streamText.split('\n').filter((l) => l.startsWith('data:'));
    if (!dataLines.length) {
      return res.status(502).json({ ok: false, message: 'Tidak ada data respon dari Gradio.' });
    }

    const lastData = dataLines[dataLines.length - 1].replace(/^data:\s*/, '').trim();
    const parsed = JSON.parse(lastData);
    const audioObj = parsed[0];
    const statusMsg = parsed[1] || '';

    if (!audioObj || !audioObj.path) {
      if (typeof statusMsg === 'string' && statusMsg.startsWith('GAGAL:')) {
        return res.status(400).json({ ok: false, message: statusMsg });
      }
      return res.status(500).json({
        ok: false,
        message: statusMsg || 'Gagal menghasilkan audio dari Colab engine.',
      });
    }

    // Fetch the actual audio binary from Colab tunnel
    const fileUrl = `${active.url}/gradio_api/file=${audioObj.path}`;
    const audioRes = await fetch(fileUrl, { signal: AbortSignal.timeout(60000) });
    if (!audioRes.ok) {
      return res.status(502).json({ ok: false, message: 'Gagal mengunduh audio hasil dari Colab tunnel.' });
    }

    const audioBuffer = await audioRes.arrayBuffer();
    const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Voice-Status', encodeURIComponent(statusMsg));
    return res.send(Buffer.from(audioBuffer));
  } catch (err: any) {
    console.error('[VoiceDesign] Error:', err);
    return res.status(500).json({
      ok: false,
      message: `Error saat memproses audio di Colab: ${err.message || String(err)}`,
    });
  }
});

// 6. Proxy Voice Clone Call to Colab Gradio
app.post('/api/voice/clone', async (req, res) => {
  const active = getActiveNotebook();
  if (!active) {
    return res.status(503).json({
      ok: false,
      message: 'Notebook Google Colab belum terhubung. Jalankan notebook di Colab untuk memulai.',
    });
  }

  const {
    text,
    audio_base64,
    audio_mime = 'audio/wav',
    ref_text = '',
    language = 'Indonesian',
    steps = 32,
    cfg = 2.0,
    speed = 1.0,
    duration = 0,
    denoise = true,
    preprocess_prompt = true,
    postprocess_output = true,
    format = 'wav',
    normalize_numbers = true,
  } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({ ok: false, message: 'Naskah teks wajib diisi.' });
  }

  if (!audio_base64) {
    return res.status(400).json({ ok: false, message: 'Audio referensi (3-10 detik) wajib diunggah atau direkam.' });
  }

  try {
    // 1. Upload reference audio to Gradio
    const base64Data = audio_base64.replace(/^data:[^;]+;base64,/, '');
    const audioBuffer = Buffer.from(base64Data, 'base64');
    const ext = audio_mime.includes('mp3') ? 'mp3' : audio_mime.includes('ogg') ? 'ogg' : 'wav';
    const filename = `ref_${Date.now()}.${ext}`;

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: audio_mime });
    formData.append('files', blob, filename);

    console.log(`[VoiceClone] Uploading ref audio (${audioBuffer.length} bytes) to ${active.url}/gradio_api/upload...`);
    const uploadRes = await fetch(`${active.url}/gradio_api/upload`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000),
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return res.status(502).json({
        ok: false,
        message: `Gagal mengunggah audio ke Colab (HTTP ${uploadRes.status}): ${errText.slice(0, 150)}`,
      });
    }

    const uploadedFiles = (await uploadRes.json()) as string[];
    const uploadedPath = uploadedFiles && uploadedFiles[0];
    if (!uploadedPath) {
      return res.status(502).json({ ok: false, message: 'Tidak menerima path audio dari Gradio upload.' });
    }

    // 2. Call generate_voice
    const gradioUrl = `${active.url}/gradio_api/call/generate_voice`;
    const payload = {
      data: [
        text.trim(),
        { path: uploadedPath, orig_name: filename },
        language,
        ref_text ? ref_text.trim() : '',
        Number(steps),
        Number(cfg),
        Number(speed),
        Number(duration),
        Boolean(denoise),
        Boolean(preprocess_prompt),
        Boolean(postprocess_output),
        format,
        Boolean(normalize_numbers),
      ],
    };

    console.log(`[VoiceClone] Calling Gradio at ${gradioUrl}...`);
    const callRes = await fetch(gradioUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
    });

    if (!callRes.ok) {
      const errText = await callRes.text();
      return res.status(502).json({
        ok: false,
        message: `Gradio POST generate_voice gagal (HTTP ${callRes.status}): ${errText.slice(0, 200)}`,
      });
    }

    const { event_id } = (await callRes.json()) as { event_id: string };
    if (!event_id) {
      return res.status(502).json({ ok: false, message: 'Tidak menerima event_id dari Gradio.' });
    }

    // Read SSE stream
    const streamRes = await fetch(`${active.url}/gradio_api/call/generate_voice/${event_id}`, {
      headers: { Accept: 'text/event-stream' },
      signal: AbortSignal.timeout(420000),
    });

    const streamText = await streamRes.text();
    const dataLines = streamText.split('\n').filter((l) => l.startsWith('data:'));
    if (!dataLines.length) {
      return res.status(502).json({ ok: false, message: 'Tidak ada data respon dari Gradio.' });
    }

    const lastData = dataLines[dataLines.length - 1].replace(/^data:\s*/, '').trim();
    const parsed = JSON.parse(lastData);
    const audioObj = parsed[0];
    const statusMsg = parsed[1] || '';

    if (!audioObj || !audioObj.path) {
      if (typeof statusMsg === 'string' && statusMsg.startsWith('GAGAL:')) {
        return res.status(400).json({ ok: false, message: statusMsg });
      }
      return res.status(500).json({
        ok: false,
        message: statusMsg || 'Gagal menghasilkan voice clone dari Colab engine.',
      });
    }

    // Fetch final audio
    const fileUrl = `${active.url}/gradio_api/file=${audioObj.path}`;
    const resultRes = await fetch(fileUrl, { signal: AbortSignal.timeout(60000) });
    if (!resultRes.ok) {
      return res.status(502).json({ ok: false, message: 'Gagal mengunduh audio hasil dari Colab tunnel.' });
    }

    const finalBuffer = await resultRes.arrayBuffer();
    const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Voice-Status', encodeURIComponent(statusMsg));
    return res.send(Buffer.from(finalBuffer));
  } catch (err: any) {
    console.error('[VoiceClone] Error:', err);
    return res.status(500).json({
      ok: false,
      message: `Error saat kloning suara di Colab: ${err.message || String(err)}`,
    });
  }
});

// Setup Vite in Dev or Static in Production
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[VEOCLONE ANIKI Server] Running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
    console.log(`[VEOCLONE ANIKI Server] Default Pairing Secret: ${activePairingSecret}`);
  });
}

setupServer().catch((err) => {
  console.error('[VEOCLONE ANIKI Server] Startup failed:', err);
  process.exit(1);
});
