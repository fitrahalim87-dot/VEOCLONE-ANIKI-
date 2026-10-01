import React, { useState } from 'react';
import {
  Cpu,
  Download,
  Copy,
  Check,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  PlayCircle,
  HelpCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ColabNotebookInfo } from '../types';

interface ColabGuideTabProps {
  activeNotebook: ColabNotebookInfo | null;
  pairingSecret: string;
  onUpdateSecret: (newSecret: string) => Promise<boolean>;
  onOpenAccessModal: () => void;
}

export const ColabGuideTab: React.FC<ColabGuideTabProps> = ({
  activeNotebook,
  pairingSecret,
  onUpdateSecret,
  onOpenAccessModal,
}) => {
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [editingSecret, setEditingSecret] = useState(false);
  const [secretInput, setSecretInput] = useState(pairingSecret);
  const [savingSecret, setSavingSecret] = useState(false);
  const [secretMsg, setSecretMsg] = useState<string | null>(null);
  const [serverAppUrl, setServerAppUrl] = useState(window.location.origin);

  React.useEffect(() => {
    fetch('/api/notebook/status')
      .then((r) => r.json())
      .then((d) => {
        if (d.app_url) setServerAppUrl(d.app_url);
      })
      .catch(() => {});
  }, []);

  const currentAppUrl = serverAppUrl;

  const copyToClipboard = (text: string, type: 'url' | 'secret' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedAppUrl(true);
      setTimeout(() => setCopiedAppUrl(false), 2000);
    } else if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSaveSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim() || secretInput.trim().length < 4) {
      setSecretMsg('Secret minimal 4 karakter.');
      return;
    }
    setSavingSecret(true);
    setSecretMsg(null);
    const ok = await onUpdateSecret(secretInput.trim());
    setSavingSecret(false);
    if (ok) {
      setEditingSecret(false);
      setSecretMsg('Pairing secret berhasil diperbarui!');
      setTimeout(() => setSecretMsg(null), 3000);
    } else {
      setSecretMsg('Gagal memperbarui secret.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Engine Status Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                activeNotebook
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border border-slate-700 text-slate-400'
              }`}
            >
              <Cpu className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Status Colab Engine</h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    activeNotebook
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeNotebook ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <span>{activeNotebook ? 'Terhubung (Online)' : 'Belum Terhubung'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeNotebook
                  ? `Engine aktif: ${activeNotebook.engine} di ${activeNotebook.gpu}`
                  : 'Jalankan notebook di Google Colab untuk mengaktifkan GPU'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/vonigen_engine.ipynb"
              download="vonigen_engine.ipynb"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Unduh .ipynb</span>
            </a>

            <a
              href="https://colab.research.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Google Colab</span>
            </a>
          </div>
        </div>

        {/* Active Notebook Details */}
        {activeNotebook ? (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">KODE AKSES</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-base font-bold font-mono text-emerald-400 tracking-wider">
                  {activeNotebook.code}
                </span>
                <button
                  onClick={() => copyToClipboard(activeNotebook.code, 'code')}
                  className="p-1 text-slate-400 hover:text-white transition"
                  title="Salin kode"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">GPU TERPAKAI</span>
              <span className="text-xs font-bold text-white mt-1 block truncate">
                {activeNotebook.gpu}
              </span>
            </div>

            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">ENGINE MODEL</span>
              <span className="text-xs font-bold text-slate-200 mt-1 block truncate">
                {activeNotebook.engine}
              </span>
            </div>

            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">AUDIO DIPROSES</span>
              <span className="text-xs font-bold font-mono text-emerald-300 mt-1 block">
                {activeNotebook.jobs} tugas
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Notebook gratis dijalankan di Google Colab. Kode akses 6-digit akan muncul di sel output setelah proses unduh selesai.
              </span>
            </div>
            <button
              onClick={onOpenAccessModal}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs shrink-0"
            >
              Masukkan Kode
            </button>
          </div>
        )}
      </div>

      {/* Guide Steps */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-lg space-y-5">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-emerald-400" />
            <span>Panduan Menjalankan Notebook OmniVoice di Colab</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cukup 5 langkah mudah untuk menghubungkan GPU gratis Google Colab ke aplikasi VEOCLONE ANIKI Anda.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Step 1 */}
          <div className="flex items-start gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
              1
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-white">Unduh & Buka Notebook di Google Colab</h4>
              <p className="text-slate-400">
                Klik tombol <strong className="text-white">Unduh .ipynb</strong> di atas untuk menyimpan file{' '}
                <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300">vonigen_engine.ipynb</code>. Buka{' '}
                <a
                  href="https://colab.research.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  colab.research.google.com
                </a>
                , lalu klik menu <strong className="text-white">File &gt; Upload notebook</strong> dan pilih file tersebut.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
              2
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-white">Ubah Runtime ke T4 GPU (Gratis)</h4>
              <p className="text-slate-400">
                Di Google Colab, klik menu <strong className="text-white">Runtime &gt; Change runtime type</strong>, lalu pilih{' '}
                <strong className="text-emerald-400">T4 GPU</strong> dan klik <strong className="text-white">Save</strong>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
              3
            </div>
            <div className="space-y-2 flex-1">
              <h4 className="font-bold text-white">Isi Sel 1 (Pengaturan)</h4>
              <p className="text-slate-400">
                Buka sel <strong className="text-white">⚙️ 1. Pengaturan</strong> pada notebook dan pastikan dua variabel ini terisi:
              </p>

              <div className="space-y-2 pt-1">
                {/* Copy App URL */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-700/80">
                  <div className="truncate">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">APP_URL:</span>
                    <span className="font-mono text-emerald-400 truncate block text-[11px]">
                      {currentAppUrl}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(currentAppUrl, 'url')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs shrink-0 self-start sm:self-auto transition"
                  >
                    {copiedAppUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAppUrl ? 'Tersalin' : 'Salin APP_URL'}</span>
                  </button>
                </div>

                {/* Copy Pairing Secret */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-700/80">
                  <div className="truncate">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">PAIRING_SECRET:</span>
                    <span className="font-mono text-emerald-400 truncate block text-[11px]">
                      {pairingSecret}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(pairingSecret, 'secret')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs shrink-0 self-start sm:self-auto transition"
                  >
                    {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSecret ? 'Tersalin' : 'Salin Secret'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
              4
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-white">Jalankan Semua Sel (Run All)</h4>
              <p className="text-slate-400">
                Klik menu <strong className="text-white">Runtime &gt; Run All</strong> (atau tekan Ctrl+F9 di laptop).
                Tunggu 3–5 menit untuk instalasi dependensi dan download bobot model OmniVoice.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-start gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
              5
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-white">Salin 6 Digit Kode Akses ke Aplikasi</h4>
              <p className="text-slate-400">
                Akan muncul banner hijau bertuliskan <strong className="text-white">KODE AKSES ANDA</strong> di sel nomor 7.
                Masukkan kode tersebut ke modal login aplikasi atau klik banner deteksi otomatis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Settings: Pairing Secret */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Pengaturan Keamanan & Pairing Secret</h3>
          </div>
          <button
            onClick={() => setEditingSecret(!editingSecret)}
            className="text-xs font-semibold text-emerald-400 hover:underline"
          >
            {editingSecret ? 'Batal' : 'Ubah Secret'}
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Pairing Secret mencegah pihak lain mengirimkan heartbeat ke aplikasi Anda. Nilai ini harus sama dengan yang Anda tulis di sel Pengaturan Colab.
        </p>

        {editingSecret ? (
          <form onSubmit={handleSaveSecret} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kunci Rahasia Baru (Pairing Secret)
              </label>
              <input
                type="text"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white font-mono outline-none focus:border-emerald-400 transition"
              />
            </div>

            {secretMsg && <p className="text-xs text-amber-400">{secretMsg}</p>}

            <button
              type="submit"
              disabled={savingSecret}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
            >
              {savingSecret ? 'Menyimpan...' : 'Simpan Secret Baru'}
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono">Secret Aktif:</span>
              <span className="font-mono text-emerald-300 font-bold tracking-wider">{pairingSecret}</span>
            </div>
            <button
              onClick={() => copyToClipboard(pairingSecret, 'secret')}
              className="p-1.5 text-slate-400 hover:text-white transition"
              title="Salin secret"
            >
              {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
