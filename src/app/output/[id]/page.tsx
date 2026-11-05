"use client";

import React, { useEffect, useRef, useState, use } from 'react';
import { Maximize2, Radio, Monitor, Check } from 'lucide-react';
import { BroadcastMessage, MediaItem, OutputChannelState } from '@/types';
import { syncChannel } from '@/utils/broadcastSync';

interface OutputPageProps {
  params: Promise<{ id: string }>;
}

export default function OutputWindow({ params }: OutputPageProps) {
  const resolvedParams = use(params);
  const initialWindowId = parseInt(resolvedParams.id, 10) || 1;

  // この送出ウィンドウが表示する対象チャンネル（初期値はURLのID、任意で切替可能）
  const [selectedChannelId, setSelectedChannelId] = useState<number>(initialWindowId);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [assignedMedia, setAssignedMedia] = useState<MediaItem | null>(null);
  const [channelState, setChannelState] = useState<OutputChannelState>({
    id: selectedChannelId,
    name: `OUTPUT ${selectedChannelId}`,
    assignedMediaId: null,
    playlist: [],
    activeClipIndex: 0,
    autoAdvance: true,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isLoop: false,
    isBlackout: false,
    aspectRatio: 'contain',
    targetWindowId: initialWindowId,
  });
  const [showControls, setShowControls] = useState(false);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const isImageMedia =
    assignedMedia?.type === 'image' || assignedMedia?.type === 'test-pattern';

  // BroadcastChannel 同期
  useEffect(() => {
    const unsubscribe = syncChannel.subscribe((msg: BroadcastMessage) => {
      // 送出先ウィンドウ番号またはチャンネル番号の一致チェック
      if (msg.channelId !== selectedChannelId) return;

      const video = videoRef.current;

      switch (msg.type) {
        case 'SYNC_STATE':
          if (msg.payload?.channel) {
            setChannelState(msg.payload.channel);
          }
          if (msg.payload?.media) {
            setAssignedMedia(msg.payload.media);
            if (video && msg.payload.media.type === 'video' && msg.payload.media.url) {
              if (video.src !== msg.payload.media.url) {
                video.src = msg.payload.media.url;
              }
            }
          }
          break;

        case 'ASSIGN':
          setAssignedMedia(msg.payload?.media || null);
          if (video && msg.payload?.media?.type === 'video' && msg.payload?.media?.url) {
            video.src = msg.payload.media.url;
          }
          break;

        case 'PLAY':
          video?.play().catch(() => {});
          setChannelState((prev) => ({ ...prev, isPlaying: true }));
          break;

        case 'PAUSE':
          video?.pause();
          setChannelState((prev) => ({ ...prev, isPlaying: false }));
          break;

        case 'SEEK':
          if (video && typeof msg.payload?.time === 'number') {
            video.currentTime = msg.payload.time;
          }
          break;

        case 'SET_VOLUME':
          if (video && typeof msg.payload?.volume === 'number') {
            video.volume = msg.payload.volume;
            video.muted = msg.payload.isMuted ?? false;
          }
          break;

        case 'BLACKOUT':
          setChannelState((prev) => ({ ...prev, isBlackout: !!msg.payload?.isBlackout }));
          break;
      }
    });

    // チャンネル変更時に即座にコントローラーへ同期を要求
    syncChannel.send('SYNC_STATE', selectedChannelId, { requestSync: true });

    return () => {
      unsubscribe();
    };
  }, [selectedChannelId]);

  // マウスホバーでツールバーを一時表示
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onDoubleClick={toggleFullscreen}
      className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center select-none"
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* 映像または静止画像 */}
      {isImageMedia ? (
        <img
          src={assignedMedia?.url || ''}
          alt=""
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            channelState.isBlackout ? 'opacity-0' : 'opacity-100'
          }`}
        />
      ) : (
        <video
          ref={videoRef}
          playsInline
          src={assignedMedia?.type === 'video' ? assignedMedia.url : ''}
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            channelState.isBlackout ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {/* NO SIGNAL 表示 */}
      {!assignedMedia && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700">
          <Radio className="w-12 h-12 mb-2 stroke-1 animate-pulse text-zinc-600" />
          <p className="text-sm font-mono tracking-widest uppercase font-bold text-zinc-500">
            RECEIVING OUTPUT {selectedChannelId} - NO SIGNAL
          </p>
          <p className="text-xs text-zinc-700 mt-1 font-mono">
            コントローラーのタイムラインに素材を追加してください
          </p>
        </div>
      )}

      {/* FTB (Fade To Black) */}
      {channelState.isBlackout && (
        <div className="absolute inset-0 bg-black z-30" />
      )}

      {/* ホバー時に現れる上部操作バー（任意の受信チャンネル選択 ＆ 全画面ボタン） */}
      <div
        className={`absolute top-4 right-4 flex items-center gap-2.5 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-zinc-800 transition-opacity duration-300 z-40 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* 受信チャンネルの任意切り替え */}
        <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-300">
          <Monitor className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-zinc-500">SOURCE:</span>
          <div className="flex items-center gap-1 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-700">
            {[1, 2, 3, 4].map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannelId(ch)}
                className={`px-1.5 py-0.5 rounded font-bold transition text-[11px] ${
                  selectedChannelId === ch
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                CH{ch}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition border border-zinc-700"
          title="Fullscreen (or double click anywhere)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        className={`absolute bottom-4 left-4 bg-black/85 px-3 py-1 rounded-md border border-zinc-800 text-[11px] font-mono text-zinc-400 transition-opacity duration-300 z-40 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        Window #{initialWindowId} (Showing Output {selectedChannelId}) • ダブルクリックで全画面
      </div>
    </div>
  );
}
