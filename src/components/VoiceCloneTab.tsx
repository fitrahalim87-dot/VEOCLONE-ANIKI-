import React, { useState } from 'react';
import {
  Mic,
  Upload,
  Sparkles,
  Sliders,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Volume2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { LANGUAGES, HistoryItem, ColabNotebookInfo } from '../types';
import { AudioRecorder } from './AudioRecorder';
import { AudioPlayer } from './AudioPlayer';

interface VoiceCloneTabProps {
  onGenerated: (item: HistoryItem) => void;
  activeNotebook: ColabNotebookInfo | null;
  onOpenAccessModal: () => void;
}

const SAMPLE_TEXTS = [
  'Halo semuanya, selamat datang di VEOCLONE ANIKI. Suara ini adalah hasil kloning teknologi OmniVoice.',
  'Promo spesial diskon hingga 50 persen hari ini! Jangan lewatkan kesempatan langka ini.',
  'Pemberitahuan penting: silakan periksa kelengkapan dokumen Anda sebelum menuju ke ruang rapat utama.',
  'Hari yang cerah untuk memulai hal baru. Percayalah pada potensimu dan teruslah melangkah maju.',
];

export const VoiceCloneTab: React.FC<VoiceCloneTabProps> = ({
  onGenerated,
  activeNotebook,
  onOpenAccessModal,
}) => {
  const [text, setText] = useState('');
  const [refAudioBase64, setRefAudioBase64] = useState<string | null>(null);
  const [refAudioMime, setRefAudioMime] = useState('audio/wav');
  const [refAudioName, setRefAudioName] = useState<string | null>(null);
  const [refAudioDuration, setRefAudioDuration] = useState<number>(0);
  const [refText, setRefText] = useState('');
  const [language, setLanguage] = useState('Indonesian');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced options
  const [steps, setSteps] = useState(32);
  const [cfg, setCfg] = useState(2.0);
  const [speed, setSpeed] = useState(1.0);
  const [duration, setDuration] = useState(0);
  const [denoise, setDenoise] = useState(true);
  const [preprocessPrompt, setPreprocessPrompt] = useState(true);
  const [postprocessOutput, setPostprocessOutput] = useState(true);
  const [format, setFormat] = useState<'wav' | 'mp3'>('wav');
  const [normalizeNumbers, setNormalizeNumbers] = useState(true);

  // Generation state
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<{
    audioUrl: string;
    info: string;
    duration: number;
    sizeKb: number;
    format: 'wav' | 'mp3';
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 15MB.');
      return;
    }

    setRefAudioName(file.name);
    setRefAudioMime(file.type || 'audio/wav');

    // Read duration
    const tempUrl = URL.createObjectURL(file);
    const audio = new Audio(tempUrl);
    audio.onloadedmetadata = () => {
      setRefAudioDuration(Math.round(audio.duration));
      URL.revokeObjectURL(tempUrl);
    };

    const reader = new FileReader();
    reader.onloadend = () => {
      setRefAudioBase64(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRecorderReady = (base64: string, mime: string, durationSec: number) => {
    setRefAudioBase64(base64);
    setRefAudioMime(mime);
    setRefAudioName('Rekaman Mikrofon');
    setRefAudioDuration(durationSec);
    setErrorMsg(null);
  };

  const handleClearRef = () => {
    setRefAudioBase64(null);
    setRefAudioName(null);
    setRefAudioDuration(0);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setErrorMsg('Ketik naskah teks terlebih dahulu.');
      return;
    }
    if (!refAudioBase64) {
      setErrorMsg('Unggah file audio atau rekam suara referensi (3-10 detik).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setProgressMsg('Menghubungi engine OmniVoice di Colab...');

    try {
      const response = await fetch('/api/voice/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          audio_base64: refAudioBase64,
          audio_mime: refAudioMime,
          ref_text: refText.trim(),
          language,
          steps,
          cfg,
          speed,
          duration,
          denoise,
          preprocess_prompt: preprocessPrompt,
          postprocess_output: postprocessOutput,
          format,
          normalize_numbers: normalizeNumbers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Gagal memproses kloning suara (HTTP ${response.status})`);
      }

      const statusHeader = response.headers.get('X-Voice-Status');
      const statusInfo = statusHeader ? decodeURIComponent(statusHeader) : 'Selesai';

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const sizeKb = Math.round(audioBlob.size / 1024);

      // Estimate duration from audio
      const audioObj = new Audio(audioUrl);
      audioObj.onloadedmetadata = () => {
        const dur = Math.round(audioObj.duration * 10) / 10 || 4;

        const newResult = {
          audioUrl,
          info: statusInfo,
          duration: dur,
          sizeKb,
          format,
        };
        setCurrentResult(newResult);

        // Save to history
        const historyItem: HistoryItem = {
          id: `clone_${Date.now()}`,
          title: text.slice(0, 38) + (text.length > 38 ? '...' : ''),
          type: 'clone',
          text,
          audioUrl,
          duration: dur,
          fileSizeKb: sizeKb,
          format,
          timestamp: Date.now(),
          isFavorite: false,
          statusInfo,
          engineUsed: activeNotebook?.engine || 'OmniVoice',
          parameters: {
            language,
            speed,
            steps,
            cfg,
            refAudioName: refAudioName || 'Audio Referensi',
          },
        };
        onGenerated(historyItem);
      };
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses audio.');
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner if Colab Offline */}
      {!activeNotebook && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">Google Colab Engine Belum Terhubung</p>
              <p className="text-[11px] text-amber-300/80">
                Aplikasi ini membutuhkan GPU Google Colab untuk membuat suara asli secara gratis.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAccessModal}
            className="shrink-0 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-1.5 transition active:scale-95"
          >
            Hubungkan Colab
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card: Text Script */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>Naskah Teks (Script)</span>
                <span className="text-rose-400">*</span>
              </label>
              <div className="text-[11px] text-slate-400 font-mono">
                {text.length} karakter &middot; {text.trim() ? text.trim().split(/\s+/).length : 0} kata
              </div>
            </div>

            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ketik teks yang ingin diucapkan dengan suara kloning di sini... Contoh: Selamat pagi semuanya, selamat beraktivitas!"
              className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition resize-none leading-relaxed"
            />

            {/* Quick Sample Text Chips */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Contoh Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_TEXTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setText(sample)}
                    className="text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 transition truncate max-w-xs text-left"
                    title={sample}
                  >
                    &ldquo;{sample.slice(0, 30)}...&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Audio Reference (Record or Upload) */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileAudio className="w-4 h-4 text-emerald-400" />
                <span>Audio Referensi Suara (3–10 Detik)</span>
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-emerald-400/90 font-medium">Zero-Shot Cloning</span>
            </div>

            {/* Record directly */}
            <AudioRecorder
              onAudioReady={handleRecorderReady}
              onClear={handleClearRef}
              existingAudio={refAudioName === 'Rekaman Mikrofon' ? refAudioBase64 : null}
            />

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] font-semibold text-slate-500 uppercase">
                Atau Unggah File Audio
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* File Upload Zone */}
            <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950/40 hover:bg-slate-950/70 p-4 cursor-pointer transition group">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition mb-1.5" />
              <span className="text-xs font-medium text-slate-300 group-hover:text-white transition">
                {refAudioName && refAudioName !== 'Rekaman Mikrofon'
                  ? `Terpilih: ${refAudioName} (${refAudioDuration}s)`
                  : 'Klik untuk memilih file WAV / MP3 / M4A / OGG'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Disarankan audio jernih tanpa backsound, durasi 3–10 detik
              </span>
            </label>
          </div>

          {/* Card: Language & Basic Options */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-4 shadow-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bahasa Pengucapan
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 p-2.5 outline-none focus:border-emerald-400 transition"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Format Output
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('wav')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      format === 'wav'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                        : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    WAV (Studio HD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('mp3')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      format === 'mp3'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                        : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    MP3 (Ringan)
                  </button>
                </div>
              </div>
            </div>

            {/* Optional transcript of reference */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Transkrip Audio Referensi (Opsional)
              </label>
              <input
                type="text"
                value={refText}
                onChange={(e) => setRefText(e.target.value)}
                placeholder="Isi jika Anda tahu kata persis yang diucapkan pada audio referensi (meningkatkan akurasi)"
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 outline-none transition"
              />
            </div>

            {/* Advanced Toggle */}
            <div className="border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showAdvanced ? 'Tutup Pengaturan Lanjutan' : 'Buka Pengaturan Lanjutan (Steps, CFG, Speed)'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 rounded-xl bg-slate-950/60 p-4 border border-slate-800 text-xs">
                  {/* Speed & CFG Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Kecepatan Bicara</span>
                        <span className="font-mono text-emerald-400 font-bold">{speed.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={1.5}
                        step={0.05}
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Guidance Scale (CFG)</span>
                        <span className="font-mono text-emerald-400 font-bold">{cfg.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={4.0}
                        step={0.1}
                        value={cfg}
                        onChange={(e) => setCfg(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Steps & Durasi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Inference Steps (Kualitas)</span>
                        <span className="font-mono text-emerald-400 font-bold">{steps}</span>
                      </div>
                      <input
                        type="range"
                        min={8}
                        max={64}
                        step={2}
                        value={steps}
                        onChange={(e) => setSteps(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Target Durasi (0 = otomatis)</label>
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={duration}
                        onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Checkbox Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={normalizeNumbers}
                        onChange={(e) => setNormalizeNumbers(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
                      />
                      <span>Normalisasi Angka & Rupiah</span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={denoise}
                        onChange={(e) => setDenoise(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
                      />
                      <span>Denoise Audio Referensi</span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preprocessPrompt}
                        onChange={(e) => setPreprocessPrompt(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
                      />
                      <span>Preprocess Prompt</span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={postprocessOutput}
                        onChange={(e) => setPostprocessOutput(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
                      />
                      <span>Potong Hening Akhir</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-extrabold text-sm py-3.5 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>{progressMsg || 'Memproses Kloning Suara di GPU Colab...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current stroke-[2]" />
                <span>Generate Voice Clone Sekarang</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Audio Output & Preview */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-lg sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Hasil Kloning Suara</h3>
              </div>
              {currentResult && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentResult.sizeKb} KB
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                  <Sparkles className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Mensintesis Suara Referensi...</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    GPU Colab sedang memproses prompt OmniVoice. Waktu rata-rata 3–15 detik.
                  </p>
                </div>
              </div>
            ) : currentResult ? (
              <div className="space-y-4">
                <AudioPlayer
                  src={currentResult.audioUrl}
                  title={text.slice(0, 45) + (text.length > 45 ? '...' : '')}
                  fileName={`veoclone_clone_${language}`}
                  format={currentResult.format}
                  engineUsed={activeNotebook?.engine || 'OmniVoice'}
                  duration={currentResult.duration}
                  autoPlay={true}
                />

                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status Engine:</span>
                    <span className="text-emerald-400 font-medium truncate max-w-[200px]">
                      {currentResult.info}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bahasa:</span>
                    <span className="font-semibold text-white">{language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kecepatan & CFG:</span>
                    <span className="font-mono text-slate-300">{speed}x | CFG {cfg}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-14 flex flex-col items-center justify-center text-center space-y-3 text-slate-500">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
                  <FileAudio className="w-7 h-7 stroke-[1.5]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-300">Belum Ada Audio Dihasilkan</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                    Isi naskah teks dan sertakan audio referensi 3-10 detik, lalu klik tombol generate.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
