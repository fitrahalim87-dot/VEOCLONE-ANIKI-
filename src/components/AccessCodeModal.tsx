import React, { useState, useEffect } from 'react';
import { KeyRound, CheckCircle, AlertCircle, Sparkles, ExternalLink, Cpu, X } from 'lucide-react';
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
  const [code, setCode] = useState(currentCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeNotebook?.code && !code) {
      setCode(activeNotebook.code);
    }
  }, [activeNotebook]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setError('Gagal menghubungi server aplikasi.');
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
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl text-slate-100 relative">
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
            <h3 className="text-base font-bold text-white">Kode Akses Colab Engine</h3>
            <p className="text-xs text-slate-400">Hubungkan browser ke GPU Google Colab Anda</p>
          </div>
        </div>

        {/* Live Detected Colab notification if available */}
        {activeNotebook ? (
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
        ) : (
          <div className="mb-4 rounded-xl bg-slate-800/80 border border-slate-700/60 p-3 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Belum menjalankan Google Colab?</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Buka tab Petunjuk Colab untuk menjalankan notebook dan mendapatkan kode akses 6 digit.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Masukkan 6 Digit Kode Akses
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Contoh: 781920"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-emerald-400 px-4 py-2.5 outline-none transition"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 text-center mt-1.5">
              Ditemukan di banner hijau sel output Colab setelah sel dijalankan
            </p>
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
                  <span>Sambungkan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
