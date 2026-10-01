import React, { useState } from 'react';
import {
  History,
  Star,
  Trash2,
  Download,
  Search,
  Filter,
  Mic,
  Wand2,
  Calendar,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';
import { HistoryItem } from '../types';
import { storageService } from '../services/storage';
import { AudioPlayer } from './AudioPlayer';

interface HistoryTabProps {
  items: HistoryItem[];
  onItemsChange: (items: HistoryItem[]) => void;
  onNavigateTab: (tab: 'clone' | 'design') => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  items,
  onItemsChange,
  onNavigateTab,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'clone' | 'design' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlayId, setActivePlayId] = useState<string | null>(null);

  const handleToggleFavorite = (id: string) => {
    const updated = storageService.toggleFavorite(id);
    onItemsChange(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus rekaman ini dari riwayat?')) {
      const updated = storageService.deleteItem(id);
      onItemsChange(updated);
    }
  };

  const handleClearAll = () => {
    if (confirm('Yakin ingin menghapus seluruh riwayat suara yang tersimpan?')) {
      storageService.clearAll();
      onItemsChange([]);
    }
  };

  // Filter items
  const filtered = items.filter((item) => {
    if (filterType === 'clone' && item.type !== 'clone') return false;
    if (filterType === 'design' && item.type !== 'design') return false;
    if (filterType === 'favorites' && !item.isFavorite) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q) ||
        (item.parameters.instruct && item.parameters.instruct.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>Koleksi & Riwayat Suara</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tersimpan secara lokal di browser dan tetap bisa diputar saat offline
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-rose-500/20 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 text-xs transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Semua</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari naskah atau suara..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-400 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${
              filterType === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            onClick={() => setFilterType('favorites')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1 ${
              filterType === 'favorites'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3 h-3 fill-current" />
            <span>Favorit ({items.filter((i) => i.isFavorite).length})</span>
          </button>
          <button
            onClick={() => setFilterType('clone')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${
              filterType === 'clone'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Voice Clone
          </button>
          <button
            onClick={() => setFilterType('design')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${
              filterType === 'design'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Voice Design
          </button>
        </div>
      </div>

      {/* Item List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 mx-auto flex items-center justify-center text-slate-400">
            <History className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Tidak Ada Riwayat Ditemukan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || filterType !== 'all'
                ? 'Tidak ada hasil yang cocok dengan kata kunci atau filter saat ini.'
                : 'Suara yang Anda buat di tab Voice Clone atau Voice Design akan otomatis tersimpan di sini.'}
            </p>
          </div>
          {items.length === 0 && (
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => onNavigateTab('clone')}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
              >
                Mulai Kloning Suara
              </button>
              <button
                onClick={() => onNavigateTab('design')}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700 transition"
              >
                Racik Karakter Suara
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 p-4 sm:p-5 transition shadow-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      item.type === 'clone'
                        ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.type === 'clone' ? (
                      <>
                        <Mic className="w-3 h-3" />
                        Voice Clone
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3" />
                        Voice Design
                      </>
                    )}
                  </span>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {item.parameters.language} &middot; {formatDate(item.timestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <button
                    onClick={() => handleToggleFavorite(item.id)}
                    className={`p-2 rounded-xl transition ${
                      item.isFavorite
                        ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={item.isFavorite ? 'Hapus dari favorit' : 'Tandai favorit'}
                  >
                    <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Hapus rekaman ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Naskah Teks */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 text-xs text-slate-200 leading-relaxed">
                &ldquo;{item.text}&rdquo;
              </div>

              {/* Audio Player embedded */}
              <AudioPlayer
                src={item.audioUrl}
                title={item.title}
                fileName={`vonigen_${item.type}_${item.id}`}
                format={item.format}
                engineUsed={item.engineUsed}
                duration={item.duration}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
