import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  Sliders,
  Volume2,
  AlertCircle,
  Tag,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  LANGUAGES,
  CATEGORIES,
  INSTRUCT_MAP,
  VOICE_PRESETS,
  VoicePreset,
  HistoryItem,
  ColabNotebookInfo,
} from '../types';
import { AudioPlayer } from './AudioPlayer';

interface VoiceDesignTabProps {
  onGenerated: (item: HistoryItem) => void;
  activeNotebook: ColabNotebookInfo | null;
  onOpenAccessModal: () => void;
}

export const VoiceDesignTab: React.FC<VoiceDesignTabProps> = ({
  onGenerated,
  activeNotebook,
  onOpenAccessModal,
}) => {
  const [text, setText] = useState('');
  const [customInstruct, setCustomInstruct] = useState('male, calm tone, moderate pitch');
  const [language, setLanguage] = useState('Indonesian');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('narator-profesional');

  // Category selections
  const [categories, setCategories] = useState<{
    Gender: string;
    Usia: string;
    Pitch: string;
    Gaya: string;
    Aksen: string;
  }>({
    Gender: 'Pria',
    Usia: 'Dewasa',
    Pitch: 'Sedang',
    Gaya: 'Narator',
    Aksen: 'Otomatis',
  });

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [steps, setSteps] = useState(32);
  const [cfg, setCfg] = useState(2.0);
  const [speed, setSpeed] = useState(1.0);
  const [duration, setDuration] = useState(0);
  const [format, setFormat] = useState<'wav' | 'mp3'>('wav');
  const [normalizeNumbers, setNormalizeNumbers] = useState(true);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<{
    audioUrl: string;
    info: string;
    duration: number;
    sizeKb: number;
    format: 'wav' | 'mp3';
  } | null>(null);

  // Update instruction prompt when categories change
  const handleCategoryChange = (key: keyof typeof categories, val: string) => {
    const updated = { ...categories, [key]: val };
    setCategories(updated);
    setSelectedPresetId(null);

    // Rebuild prompt tags
    const picked: string[] = [];
    Object.values(updated).forEach((choice) => {
      if (choice && choice !== 'Otomatis' && INSTRUCT_MAP[choice]) {
        picked.push(INSTRUCT_MAP[choice]);
      }
    });
    setCustomInstruct(picked.join(', '));
  };

  const handleApplyPreset = (preset: VoicePreset) => {
    setSelectedPresetId(preset.id);
    setCategories(preset.categories);
    setCustomInstruct(preset.instruct);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setErrorMsg('Ketik naskah teks terlebih dahulu.');
      return;
    }
    if (!customInstruct.trim()) {
      setErrorMsg('Pilih minimal satu karakter suara atau isi deskripsi.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const catArray = [
        categories.Gender,
        categories.Usia,
        categories.Pitch,
        categories.Gaya,
        categories.Aksen,
      ];

      const response = await fetch('/api/voice/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          instruct: customInstruct.trim(),
          language,
          steps,
          cfg,
          speed,
          duration,
          format,
          normalize_numbers: normalizeNumbers,
          categories: catArray,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Gagal meracik suara (HTTP ${response.status})`);
      }

      const statusHeader = response.headers.get('X-Voice-Status');
      const statusInfo = statusHeader ? decodeURIComponent(statusHeader) : 'Selesai';

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const sizeKb = Math.round(audioBlob.size / 1024);

      const audioObj = new Audio(audioUrl);
      audioObj.onloadedmetadata = () => {
        const dur = Math.round(audioObj.duration * 10) / 10 || 3.5;

        const newResult = {
          audioUrl,
          info: statusInfo,
          duration: dur,
          sizeKb,
          format,
        };
        setCurrentResult(newResult);

        // Save history item
        const historyItem: HistoryItem = {
          id: `design_${Date.now()}`,
          title: text.slice(0, 38) + (text.length > 38 ? '...' : ''),
          type: 'design',
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
            instruct: customInstruct,
          },
        };
        onGenerated(historyItem);
      };
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat meracik suara.');
    } finally {
      setLoading(false);
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
                Fitur Voice Design disintesis langsung di GPU Colab melalui OmniVoice.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* Preset Cards */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-emerald-400" />
                <span>Pilihan Preset Karakter Suara</span>
              </label>
              <span className="text-[11px] text-slate-400">1-Klik Terapkan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VOICE_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                        {preset.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {preset.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Script Input */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                Naskah Teks (Script) <span className="text-rose-400">*</span>
              </label>
              <div className="text-[11px] text-slate-400 font-mono">
                {text.length} karakter &middot; {text.trim() ? text.trim().split(/\s+/).length : 0} kata
              </div>
            </div>

            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ketik naskah teks yang ingin diucapkan karakter suara ini... Contoh: Selamat pagi pemirsa, kembali lagi bersama saya di kabar terkini nusantara."
              className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition resize-none leading-relaxed"
            />
          </div>

          {/* Categories Grid (Gender, Usia, Pitch, Gaya, Aksen) */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                Atribut Karakter Suara
              </label>
              <span className="text-[11px] text-slate-400">Pilih kombinasi atribut</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(CATEGORIES).map(([catName, options]) => (
                <div key={catName}>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    {catName}
                  </label>
                  <select
                    value={categories[catName as keyof typeof categories]}
                    onChange={(e) =>
                      handleCategoryChange(catName as keyof typeof categories, e.target.value)
                    }
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 p-2 outline-none focus:border-emerald-400 transition"
                  >
                    {options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Bahasa
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 p-2 outline-none focus:border-emerald-400 transition"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Instruction Box */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Deskripsi Suara Teknis (Instruct)
              </label>
              <input
                type="text"
                value={customInstruct}
                onChange={(e) => {
                  setCustomInstruct(e.target.value);
                  setSelectedPresetId(null);
                }}
                placeholder="Contoh: male, calm tone, very low pitch, professional narrator"
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-2.5 text-xs text-emerald-300 font-mono placeholder:text-slate-500 focus:border-emerald-400 outline-none transition"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Teks deskripsi bahasa Inggris yang dipahami model OmniVoice. Dihasilkan otomatis saat Anda memilih tombol di atas.
              </p>
            </div>

            {/* Advanced Settings */}
            <div className="border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showAdvanced ? 'Tutup Pengaturan Lanjutan' : 'Buka Pengaturan Lanjutan (Speed, CFG, Format)'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 rounded-xl bg-slate-950/60 p-4 border border-slate-800 text-xs">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 mb-1">Format File</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormat('wav')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition border ${
                            format === 'wav'
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          WAV
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormat('mp3')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition border ${
                            format === 'mp3'
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          MP3
                        </button>
                      </div>
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
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl bg-rose-500/15 border border-rose-500/30 p-3.5 text-xs text-rose-300">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              {(errorMsg.includes('terputus') || errorMsg.includes('kadaluarsa') || errorMsg.includes('tidak dapat diakses') || errorMsg.includes('503')) && (
                <button
                  type="button"
                  onClick={onOpenAccessModal}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
                >
                  Hubungkan Ulang Colab
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-extrabold text-sm py-3.5 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Meracik Karakter Suara di GPU Colab...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 fill-current stroke-[2]" />
                <span>Generate Voice Design Sekarang</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Audio Output */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-lg sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Hasil Racikan Suara</h3>
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
                  <Wand2 className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Meracik Karakter Suara...</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Model OmniVoice sedang mensintesis karakter dari deskripsi instruct.
                  </p>
                </div>
              </div>
            ) : currentResult ? (
              <div className="space-y-4">
                <AudioPlayer
                  src={currentResult.audioUrl}
                  title={text.slice(0, 45) + (text.length > 45 ? '...' : '')}
                  fileName={`veoclone_design_${language}`}
                  format={currentResult.format}
                  engineUsed={activeNotebook?.engine || 'OmniVoice'}
                  duration={currentResult.duration}
                  autoPlay={true}
                />

                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Deskripsi:</span>
                    <span className="text-emerald-400 font-mono text-[11px] truncate max-w-[200px]">
                      {customInstruct}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bahasa:</span>
                    <span className="font-semibold text-white">{language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Info Engine:</span>
                    <span className="text-slate-300 text-[11px] truncate max-w-[200px]">
                      {currentResult.info}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-14 flex flex-col items-center justify-center text-center space-y-3 text-slate-500">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
                  <Wand2 className="w-7 h-7 stroke-[1.5]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-300">Belum Ada Suara Dirancik</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                    Pilih salah satu preset atau ubah atribut suara di samping untuk memulai.
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
