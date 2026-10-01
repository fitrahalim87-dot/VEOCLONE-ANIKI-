import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, VolumeX, RotateCcw, Share2, Sparkles, Check } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  fileName?: string;
  format?: 'wav' | 'mp3';
  engineUsed?: string;
  duration?: number;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title = 'Hasil Audio',
  fileName = 'vonigen_audio',
  format = 'wav',
  engineUsed,
  duration: initialDuration = 0,
  autoPlay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Autoplay may be blocked by browser policy
      });
    }
  }, [src, autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 0.8];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = `${fileName.replace(/\s+/g, '_')}_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vonigen Voice - ${title}`,
          text: `Dengarkan audio hasil kloning suara dari Vonigen by Aniki`,
          url: window.location.href,
        });
        return;
      } catch {
        // Ignore user cancellation
      }
    }
    // Fallback: copy link or trigger download
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/25 p-4 sm:p-5 shadow-xl shadow-black/40 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              <Sparkles className="w-2.5 h-2.5" />
              {format.toUpperCase()}
            </span>
            {engineUsed && (
              <span className="text-[11px] text-slate-400 truncate max-w-[200px]">{engineUsed}</span>
            )}
          </div>
          <h4 className="text-sm font-bold text-white truncate mt-1">{title}</h4>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Ubah kecepatan putar"
          >
            {playbackRate}x
          </button>
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isMuted ? 'Nyalakan suara' : 'Bisukan'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Bagikan"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 active:scale-95 shadow-md shadow-emerald-500/20 transition"
            title="Unduh file audio"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Unduh</span>
          </button>
        </div>
      </div>

      {/* Waveform / Visualizer Simulation */}
      <div className="flex items-center justify-between gap-1 h-7 my-2 px-1">
        {Array.from({ length: 36 }).map((_, i) => {
          const barHeight = Math.sin((i / 36) * Math.PI) * 20 + ((i * 7) % 11) + 4;
          const isPassed = (i / 36) * 100 <= progressPercent;
          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPassed
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50'
                  : 'bg-slate-800'
              } ${isPlaying && isPassed ? 'scale-y-110' : ''}`}
              style={{ height: `${Math.max(6, barHeight)}px` }}
            />
          );
        })}
      </div>

      {/* Progress slider */}
      <div className="space-y-1 mt-1">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300"
        />

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{formatSeconds(currentTime)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
              }}
              className="hover:text-slate-200 transition"
              title="Putar ulang dari awal"
            >
              <RotateCcw className="w-3 h-3 inline mr-1" />
              Reset
            </button>
            <span>{formatSeconds(duration)}</span>
          </div>
        </div>
      </div>

      {/* Big Play Button Center / Bottom */}
      <div className="flex justify-center mt-3">
        <button
          onClick={togglePlay}
          className="group flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Jeda Pemutaran</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Dengarkan Suara</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
