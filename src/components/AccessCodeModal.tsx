import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Link,
  Cpu,
  X,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { ColabNotebookInfo } from '../types';

interface AccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (code: string) => void;
  activeNotebook: ColabNotebookInfo | null;
  currentCode: string | null;
}

export const AccessCodeModal: React.FC<AccessCodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  activeNotebook,
  currentCode,
}) => {
  const [connectMode, setConnectMode] = useState<'code' | 'tunnel'>('code');
  const [code, setCode] = useState(currentCode || '');
  const [tunnelUrl, setTunnelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);
  const [serverAppUrl, setServerAppUrl] = useState(window.location.origin);

  // Fetch actual app_url from backend
  useEffect(() => {
    fetch('/api/notebook/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.app_url) setServerAppUrl(data.app_url);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeNotebook?.code && !code) {
      setCode(activeNotebook.code);
    }
  }, [activeNotebook]);

  if (!isOpen) return null;

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(serverAppUrl);
    setCopiedAppUrl(true);
    setTimeout(() => setCopiedAppUrl(false), 2000);
  };

  // Submit via 6-digit code (Heartbeat based)
  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setError('Masukkan 6 digit kode akses dari Google Colab.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/notebook/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || 'Kode akses tidak sesuai atau notebook belum aktif.');
        setLoading(false);
        return;
      }

      onSuccess(code.trim());
      onClose();
    } catch {
      setError('Gagal menghubungi server aplikasi.');
    } finally {
      setLoading(false);
    }
  };

  // Submit via direct tunnel URL (Instant connect)
  const handleDirectConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tunnelUrl.trim()) {
      setError('Tempel URL tunnel Google Colab (contoh: https://xxx.trycloudflare.com).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/notebook/direct-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: tunnelUrl.trim(),
          code: code.trim() || '120202',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || 'Gagal tersambung ke URL Colab tersebut.');
        setLoading(false);
        return;
      }

      onSuccess(data.notebook?.code || code.trim() || '120202');
      onClose();
    } catch (err: any) {
      setError(`Gagal menghubungi server: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickConnect = () => {
    if (activeNotebook?.code) {
      setCode(activeNotebook.code);
      onSuccess(activeNotebook.code);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <KeyRound className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Hubungkan Colab Engine</h3>
            <p className="text-xs text-slate-400">Pilih metode sambungan ke GPU Google Colab Anda</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => {
              setConnectMode('code');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              connectMode === 'code'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Kode Akses 6-Digit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setConnectMode('tunnel');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              connectMode === 'tunnel'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Link Tunnel Colab (Instan)</span>
          </button>
        </div>

        {/* Active Notebook Detected Banner */}
        {activeNotebook && (
          <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Engine Colab Terdeteksi Online</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">{activeNotebook.gpu}</span>
            </div>

            <p className="text-[11px] text-slate-300 mt-1">
              Notebook aktif ditemukan dengan kode:{' '}
              <strong className="text-emerald-300 font-mono tracking-widest">{activeNotebook.code}</strong>
            </p>

            <button
              onClick={handleQuickConnect}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 py-1.5 text-xs font-bold text-slate-950 transition shadow-sm"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Gunakan Kode Terdeteksi ({activeNotebook.code})</span>
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 p-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-200">{error}</p>
              {connectMode === 'code' && (
                <p className="text-[11px] text-rose-300/80">
                  Tip: Coba tab <strong className="text-white">"Link Tunnel Colab (Instan)"</strong> di atas untuk menyambungkan langsung tanpa perlu mengatur APP_URL di Colab.
                </p>
              )}
            </div>
          </div>
        )}

        {/* MODE 1: 6-Digit Code */}
        {connectMode === 'code' ? (
          <form onSubmit={handleSubmitCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Masukkan 6 Digit Kode Akses
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 120202"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-emerald-400 px-4 py-2.5 outline-none transition"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 text-center mt-1.5">
                Ditemukan di banner hijau sel 7 (Kode Akses) pada Google Colab
              </p>
            </div>

            {/* Helper box explaining APP_URL */}
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-200">Colab gagal kirim heartbeat?</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pastikan variabel <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">APP_URL</code> di sel 1 Colab diisi URL Cloud Run ini:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAppUrl}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] shrink-0 font-medium transition"
                >
                  {copiedAppUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAppUrl ? 'Tersalin' : 'Salin URL'}</span>
                </button>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-emerald-400 truncate">
                {serverAppUrl}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 text-xs font-medium transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 py-2.5 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-98 transition"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Verifikasi Kode</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* MODE 2: Direct Tunnel URL (Instant) */
          <form onSubmit={handleDirectConnect} className="space-y-4">
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Sambungan Langsung Tanpa Heartbeat</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Di sel nomor 6 atau 7 Google Colab, terdapat baris <strong className="text-white">URL : https://...trycloudflare.com</strong> (atau link gradio). Salin dan tempel di bawah:
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                URL Tunnel Colab
              </label>
              <div className="relative">
                <Link className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={tunnelUrl}
                  onChange={(e) => setTunnelUrl(e.target.value)}
                  placeholder="https://xxx-xxx.trycloudflare.com"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-xs text-emerald-300 font-mono pl-9 pr-3 py-2.5 outline-none transition"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kode Akses (Opsional)
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="120202"
                className="w-full tracking-widest text-sm font-mono font-bold rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-400 text-emerald-400 px-3 py-2 outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 text-xs font-medium transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !tunnelUrl.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 py-2.5 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-98 transition"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Sambungkan Langsung</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
