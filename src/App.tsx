/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TabType, HistoryItem, ColabNotebookInfo, ColabStatusResponse } from './types';
import { storageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { VoiceCloneTab } from './components/VoiceCloneTab';
import { VoiceDesignTab } from './components/VoiceDesignTab';
import { HistoryTab } from './components/HistoryTab';
import { ColabGuideTab } from './components/ColabGuideTab';
import { AccessCodeModal } from './components/AccessCodeModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Sparkles, Cpu, Shield, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('clone');
  const [activeNotebook, setActiveNotebook] = useState<ColabNotebookInfo | null>(null);
  const [pairingSecret, setPairingSecret] = useState<string>('DzwNNj0TMpfc0BzIWhZzBCtl6Y0');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [currentAccessCode, setCurrentAccessCode] = useState<string | null>(null);

  // Load local history & saved access code on mount
  useEffect(() => {
    const saved = storageService.getHistory();
    setHistoryItems(saved);

    const savedCode = storageService.getSavedAccessCode();
    if (savedCode) {
      setCurrentAccessCode(savedCode);
    }
  }, []);

  // Poll Colab notebook status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/notebook/status');
      if (res.ok) {
        const data: ColabStatusResponse = await res.json();
        setActiveNotebook(data.active_notebook || null);
        if (data.pairing_secret) {
          setPairingSecret(data.pairing_secret);
        }
      }
    } catch {
      // Ignore network errors when offline
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 12000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleGenerated = (newItem: HistoryItem) => {
    storageService.saveItem(newItem);
    setHistoryItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
  };

  const handleAccessCodeSuccess = (code: string) => {
    setCurrentAccessCode(code);
    storageService.saveAccessCode(code);
    fetchStatus();
  };

  const handleUpdateSecret = async (newSecret: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/notebook/admin/secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: newSecret }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPairingSecret(newSecret);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300 pb-20 md:pb-12">
      {/* PWA Offline Banner */}
      <OfflineIndicator />

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeNotebook={activeNotebook}
        onOpenAccessModal={() => setIsAccessModalOpen(true)}
        historyCount={historyItems.length}
      />

      {/* Access Code PIN Modal */}
      <AccessCodeModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        onSuccess={handleAccessCodeSuccess}
        activeNotebook={activeNotebook}
        currentCode={currentAccessCode}
      />

      {/* Sub-Header Banner with Engine Info */}
      <div className="border-b border-slate-800/60 bg-slate-950/40 py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>
              Engine: <strong className="text-white">OmniVoice (k2-fsa)</strong> &middot; Dukungan Bahasa Indonesia
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            {activeNotebook ? (
              <span className="text-emerald-300 font-mono">
                GPU: {activeNotebook.gpu} &middot; Kode: {activeNotebook.code}
              </span>
            ) : (
              <button
                onClick={() => setCurrentTab('guide')}
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
              >
                <span>Cara Menjalankan Colab</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main App Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'clone' && (
          <VoiceCloneTab
            onGenerated={handleGenerated}
            activeNotebook={activeNotebook}
            onOpenAccessModal={() => setIsAccessModalOpen(true)}
          />
        )}

        {currentTab === 'design' && (
          <VoiceDesignTab
            onGenerated={handleGenerated}
            activeNotebook={activeNotebook}
            onOpenAccessModal={() => setIsAccessModalOpen(true)}
          />
        )}

        {currentTab === 'history' && (
          <HistoryTab
            items={historyItems}
            onItemsChange={setHistoryItems}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'guide' && (
          <ColabGuideTab
            activeNotebook={activeNotebook}
            pairingSecret={pairingSecret}
            onUpdateSecret={handleUpdateSecret}
            onOpenAccessModal={() => setIsAccessModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            &copy; 2026 <strong>VEOCLONE ANIKI</strong> &mdash; Progressive Web App (PWA) AI Voice Studio.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <button onClick={() => setCurrentTab('guide')} className="hover:text-emerald-400 transition">
              Petunjuk Colab
            </button>
            <button onClick={() => setIsAccessModalOpen(true)} className="hover:text-emerald-400 transition">
              Kode Akses
            </button>
            <a
              href="/vonigen_engine.ipynb"
              download="vonigen_engine.ipynb"
              className="hover:text-emerald-400 transition"
            >
              Unduh Notebook
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
