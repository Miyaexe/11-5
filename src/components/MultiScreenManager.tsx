"use client";

import React from 'react';
import { ExternalLink, MonitorPlay } from 'lucide-react';

interface MultiScreenManagerProps {
  outputCount: number;
  onOpenChannelWindow: (windowId: number, channelId?: number) => void;
}

export const MultiScreenManager: React.FC<MultiScreenManagerProps> = ({
  outputCount = 4,
  onOpenChannelWindow,
}) => {
  return (
    <div className="flex items-center gap-2 bg-zinc-900/90 border border-surface-border px-3 py-1.5 rounded-lg text-xs font-mono">
      <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
        <MonitorPlay className="w-4 h-4 text-broadcast-cyan" />
        <span className="hidden sm:inline">OUTPUT WINDOWS:</span>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {Array.from({ length: outputCount }, (_, i) => i + 1).map((winId) => (
          <button
            key={winId}
            onClick={() => onOpenChannelWindow(winId, winId)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-mono transition"
            title={`送出ウィンドウ #${winId} を開く`}
          >
            <span>WIN {winId}</span>
            <ExternalLink className="w-3 h-3 text-cyan-400" />
          </button>
        ))}
      </div>
    </div>
  );
};
