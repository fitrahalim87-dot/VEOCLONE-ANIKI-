import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface AudioRecorderProps {
  onAudioReady: (base64: string, mime: string, durationSec: number) => void;
  onClear: () => void;
  existingAudio?: string | null;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioReady,
  onClear,
  existingAudio,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudio || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onAudioReady(base64, mimeType, recordSeconds);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 15) {
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setMicError('Izin mikrofon ditolak atau tidak tersedia pada browser ini.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const handleClear = () => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
    }
    setRecordedBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordSeconds(0);
    onClear();
  };

  const togglePlayback = () => {
    if (!audioPlaybackRef.current) return;
    if (isPlaying) {
      audioPlaybackRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlaybackRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  return (
    <div className="w-full rounded-xl bg-slate-900/80 border border-slate-700/60 p-3.5 text-xs">
      {micError && (
        <div className="mb-2.5 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-2 text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{micError}</span>
        </div>
      )}

      {audioUrl ? (
        <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-lg border border-emerald-500/30">
          <audio
            ref={audioPlaybackRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlayback}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
              title={isPlaying ? 'Jeda rekaman' : 'Putar rekaman'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Audio Siap ({recordSeconds > 0 ? `${recordSeconds}s` : 'Rekaman'})</span>
              </div>
              <p className="text-[11px] text-slate-400">Direkam langsung dari mikrofon</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition text-[11px]"
            title="Hapus rekaman"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200">
                {isRecording ? `Merekam... ${recordSeconds} detik (rekomendasi 3–10s)` : 'Rekam Suara Sendiri'}
              </div>
              <p className="text-[11px] text-slate-400">
                Ucapkan 1 kalimat jelas dengan mikrofon HP atau laptop
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 px-4 py-2 font-bold text-white shadow-lg shadow-rose-500/25 active:scale-95 transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Selesai ({recordSeconds}s)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 px-3.5 py-2 font-medium text-slate-200 transition"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mulai Rekam</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
