import React from 'react';
import {
  Mic,
  Wand2,
  History,
  Cpu,
  Sparkles,
  KeyRound,
  Download,
  Share2,
} from 'lucide-react';
import { TabType, ColabNotebookInfo } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeNotebook: ColabNotebookInfo | null;
  onOpenAccessModal: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  activeNotebook,
  onOpenAccessModal,
  historyCount,
}) => {
  return (
    <>
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('clone')}>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
              <img
                src="/pwa-192x192.png"
                alt="VEOCLONE ANIKI App Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
                  VEO<span className="text-emerald-400">CLONE</span>
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                  ANIKI
                </span>
                <span className="hidden sm:inline-block text-[9px] font-semibold uppercase px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  PWA
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 hidden sm:block">
                AI Voice Cloning & Voice Studio &middot; OmniVoice
              </p>
            </div>
          </div>

          {/* Desktop Tab Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => onTabChange('clone')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'clone'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Clone</span>
            </button>

            <button
              onClick={() => onTabChange('design')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'design'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Voice Design</span>
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'history'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat</span>
              {historyCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  currentTab === 'history' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  {historyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('guide')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'guide'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Petunjuk Colab</span>
            </button>
          </nav>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-2">
            {/* Colab Connection Indicator */}
            <button
              onClick={onOpenAccessModal}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                activeNotebook
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Status Google Colab"
            >
              <span className={`relative flex h-2 w-2`}>
                {activeNotebook && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    activeNotebook ? 'bg-emerald-500' : 'bg-slate-500'
                  }`}
                ></span>
              </span>
              <span className="hidden sm:inline">
                {activeNotebook ? activeNotebook.gpu || 'GPU Online' : 'Hubungkan Colab'}
              </span>
              {activeNotebook && (
                <span className="text-[10px] font-mono text-emerald-300 hidden md:inline">
                  [{activeNotebook.code}]
                </span>
              )}
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Essential for PWA mobile experience) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 safe-bottom">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => onTabChange('clone')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              currentTab === 'clone'
                ? 'text-emerald-400 font-bold bg-emerald-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Clone</span>
          </button>

          <button
            onClick={() => onTabChange('design')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              currentTab === 'design'
                ? 'text-emerald-400 font-bold bg-emerald-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Design</span>
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition relative ${
              currentTab === 'history'
                ? 'text-emerald-400 font-bold bg-emerald-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Riwayat</span>
            {historyCount > 0 && (
              <span className="absolute top-1 right-5 flex h-2 w-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => onTabChange('guide')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              currentTab === 'guide'
                ? 'text-emerald-400 font-bold bg-emerald-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Colab</span>
          </button>
        </div>
      </div>
    </>
  );
};
