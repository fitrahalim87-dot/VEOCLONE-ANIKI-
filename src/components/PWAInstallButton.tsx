import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, X, Smartphone, CheckCircle } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>PWA Aktif</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
    }
  };

  // Chromium / Android / Desktop prompt
  if (isInstallable) {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all duration-150"
          title="Pasang aplikasi ke layar utama / desktop"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
          <span>Install Aplikasi</span>
          <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-900/20 font-mono">PWA</span>
        </button>

        {installSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
            <CheckCircle className="w-4 h-4" />
            VEOCLONE ANIKI berhasil diinstall ke perangkat Anda!
          </div>
        )}
      </>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
          title="Petunjuk pasang di iOS Safari"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pasang di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Pasang di iPhone / iPad</h3>
                    <p className="text-[11px] text-slate-400">Jadikan aplikasi layar utama</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    1
                  </div>
                  <p>
                    Ketuk tombol <strong className="text-white">Bagikan (Share)</strong>{' '}
                    <Share className="inline w-3.5 h-3.5 mx-1 text-emerald-400" /> di bilah alat Safari bawah atau atas.
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    2
                  </div>
                  <p>
                    Gulir menu dan pilih <strong className="text-white">Tambah ke Layar Utama (Add to Home Screen)</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    3
                  </div>
                  <p>
                    Ketuk <strong className="text-white">Tambah (Add)</strong> di pojok kanan atas untuk menyelesaikan.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 active:scale-98 transition shadow-lg shadow-emerald-500/20"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback button showing PWA capability info
  return (
    <button
      onClick={() => {
        alert('Untuk memasang PWA: Di browser Chrome/Edge klik ikon pasang di address bar (kanan atas) atau menu browser > "Install VEOCLONE ANIKI".');
      }}
      className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors"
      title="Aplikasi ini siap dipasang sebagai PWA"
    >
      <Download className="w-3.5 h-3.5 text-emerald-400" />
      <span>Install PWA</span>
    </button>
  );
};
