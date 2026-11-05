"use client";

import React, { useState } from 'react';
import { Play, Trash2, Clock, Plus, Layers, Image as ImageIcon, Film, Radio } from 'lucide-react';
import { TimelineClip, MediaItem } from '@/types';

interface OutputTimelineProps {
  channelId: number;
  playlist: TimelineClip[];
  activeClipIndex: number;
  autoAdvance: boolean;
  currentTime: number;
  onSelectClip: (index: number) => void;
  onRemoveClip: (instanceId: string) => void;
  onAddClip: (media: MediaItem) => void;
  onToggleAutoAdvance: () => void;
}

export const OutputTimeline: React.FC<OutputTimelineProps> = ({
  channelId,
  playlist,
  activeClipIndex,
  autoAdvance,
  currentTime,
  onSelectClip,
  onRemoveClip,
  onAddClip,
  onToggleAutoAdvance,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const media: MediaItem = JSON.parse(dataStr);
        onAddClip(media);
      }
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0s';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-2 flex flex-col gap-1.5">
      {/* タイムラインヘッダー */}
      <div className="flex items-center justify-between text-[10px] font-mono pb-1 border-b border-zinc-800/60">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-bold text-zinc-300">SEQUENCE TIMELINE</span>
          <span className="text-zinc-500">({playlist.length} CLIPS)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* 自動連続再生トグル */}
          <button
            onClick={onToggleAutoAdvance}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition border ${
              autoAdvance
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
            title="Auto Advance to Next Clip upon completion"
          >
            AUTO ADVANCE: {autoAdvance ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* タイムラインレーン（ドラッグ＆ドロップ受け入れゾーン） */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex items-center gap-2 overflow-x-auto py-1 min-h-[58px] px-1 rounded transition-colors ${
          isDragOver
            ? 'bg-blue-950/40 border border-dashed border-blue-500'
            : 'bg-zinc-900/40 border border-transparent'
        }`}
      >
        {playlist.length === 0 ? (
          <div className="w-full flex items-center justify-center text-zinc-600 text-[10px] font-mono py-2">
            ここに素材をドラッグ＆ドロップしてタイムラインを作成
          </div>
        ) : (
          playlist.map((clip, idx) => {
            const isActive = idx === activeClipIndex;
            return (
              <div
                key={clip.instanceId}
                onClick={() => onSelectClip(idx)}
                className={`relative flex items-center gap-2 px-2 py-1.5 rounded-md border transition cursor-pointer flex-shrink-0 group ${
                  isActive
                    ? 'bg-blue-950/70 border-blue-500 ring-1 ring-blue-500/50 shadow-md shadow-blue-500/20'
                    : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* 再生中インジケーター */}
                <div className="w-8 h-6 bg-black rounded overflow-hidden flex items-center justify-center flex-shrink-0 relative border border-zinc-800">
                  {clip.type === 'image' || clip.type === 'test-pattern' ? (
                    <img src={clip.url} alt="" className="w-full h-full object-cover" />
                  ) : clip.type === 'video' ? (
                    <video src={clip.url} className="w-full h-full object-cover" />
                  ) : (
                    <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  )}
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                      <Play className="w-3 h-3 fill-white text-white animate-pulse" />
                    </div>
                  )}
                </div>

                {/* クリップ情報 */}
                <div className="flex flex-col min-w-0 pr-4">
                  <span
                    className={`text-[10px] font-mono truncate max-w-[90px] font-semibold ${
                      isActive ? 'text-blue-300' : 'text-zinc-300'
                    }`}
                    title={clip.name}
                  >
                    {idx + 1}. {clip.name}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500">
                    {formatSeconds(clip.duration)}
                  </span>
                </div>

                {/* 削除ボタン */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveClip(clip.instanceId);
                  }}
                  className="absolute top-1 right-1 p-0.5 rounded text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                  title="Remove from timeline"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
