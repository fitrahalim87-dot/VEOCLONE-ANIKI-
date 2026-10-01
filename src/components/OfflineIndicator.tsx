import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20 animate-pulse border border-amber-300/40">
      <WifiOff className="w-4 h-4 text-slate-950 stroke-[2.5]" />
      <span>Mode Offline — Fitur pemutar & riwayat tersimpan tetap dapat diakses.</span>
    </div>
  );
};
