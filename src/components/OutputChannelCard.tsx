"use client";

import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Volume2,
  VolumeX,
  ExternalLink,
  Maximize2,
  Radio,
  Image as ImageIcon,
  Film,
  Monitor,
  Cpu,
  Settings2,
} from 'lucide-react';
import { OutputChannelState, MediaItem, TimelineClip, HardwareOutputConfig } from '@/types';
import { Vectorscope } from './Vectorscope';
import { AudioMonitor } from './AudioMonitor';
import { OutputTimeline } from './OutputTimeline';
import { HardwareConfigModal } from './HardwareConfigModal';
import { hardwareBridge } from '@/utils/hardwareBridge';

interface OutputChannelCardProps {
  channel: OutputChannelState;
  assignedMedia: MediaItem | null;
  onUpdateChannel: (updated: Partial<OutputChannelState>) => void;
  onOpenOutputWindow: (targetWindowId: number, channelId: number) => void;
}

export const OutputChannelCard: React.FC<OutputChannelCardProps> = ({
  channel,
  assignedMedia,
  onUpdateChannel,
  onOpenOutputWindow,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localImageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeMediaElement, setActiveMediaElement] = useState<HTMLVideoElement | HTMLImageElement | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isBridgeConnected, setIsBridgeConnected] = useState(false);

  useEffect(() => {
    const unsub = hardwareBridge.subscribe((connected) => {
      setIsBridgeConnected(connected);
    });
    return () => unsub();
  }, []);

  const isImageMedia =
    assignedMedia?.type === 'image' || assignedMedia?.type === 'test-pattern';

  const isAudioAvailable =
    assignedMedia?.type === 'video' || assignedMedia?.type === 'live-camera';

  // メディア要素のrefを保持
  useEffect(() => {
    if (isImageMedia) {
      setActiveMediaElement(localImageRef.current);
    } else {
      setActiveMediaElement(localVideoRef.current);
    }
  }, [isImageMedia, assignedMedia]);

  // 動画の反映
  useEffect(() => {
    const video = localVideoRef.current;
    if (!video || isImageMedia) return;

    if (assignedMedia?.type === 'live-camera' && assignedMedia.stream) {
      if (video.srcObject !== assignedMedia.stream) {
        video.srcObject = assignedMedia.stream;
        video.play().catch(() => {});
      }
    } else if (assignedMedia?.type === 'video' && assignedMedia.url) {
      if (video.src !== assignedMedia.url) {
        video.srcObject = null;
        video.src = assignedMedia.url;
      }
      if (channel.isPlaying) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    } else {
      video.pause();
      video.src = '';
      video.srcObject = null;
    }
  }, [assignedMedia, isImageMedia, channel.isPlaying]);

  // 音量・ミュート同期
  useEffect(() => {
    const video = localVideoRef.current;
    if (!video || isImageMedia) return;
    video.volume = channel.volume;
    video.muted = channel.isMuted;
  }, [channel.volume, channel.isMuted, isImageMedia]);

  // 静止画のタイマー進行
  useEffect(() => {
    if (!isImageMedia || !channel.isPlaying || !channel.autoAdvance) return;
    const currentClip = channel.playlist[channel.activeClipIndex];
    const duration = currentClip?.duration || 5;

    const timer = setTimeout(() => {
      handleNextClip();
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [isImageMedia, channel.isPlaying, channel.autoAdvance, channel.activeClipIndex, channel.playlist]);

  const handleTimeUpdate = () => {
    const video = localVideoRef.current;
    if (!video) return;
    onUpdateChannel({
      currentTime: video.currentTime,
      duration: video.duration || 0,
    });
  };

  const handleNextClip = () => {
    if (channel.playlist.length === 0) return;
    const nextIdx = (channel.activeClipIndex + 1) % channel.playlist.length;
    const nextClip = channel.playlist[nextIdx];
    if (nextClip) {
      onUpdateChannel({
        activeClipIndex: nextIdx,
        assignedMediaId: nextClip.mediaId,
        currentTime: 0,
        isPlaying: true,
      });
    }
  };

  const togglePlay = () => {
    onUpdateChannel({ isPlaying: !channel.isPlaying });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (localVideoRef.current) {
      localVideoRef.current.currentTime = time;
    }
    onUpdateChannel({ currentTime: time });
  };

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '00:00:00.00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const f = Math.floor((sec % 1) * 30);
    return `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(f).padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleAddClipToTimeline = (media: MediaItem) => {
    const newClip: TimelineClip = {
      instanceId: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mediaId: media.id,
      name: media.name,
      type: media.type,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      duration: media.duration || (media.type === 'image' ? 5 : 10),
    };

    const nextPlaylist = [...channel.playlist, newClip];
    const isFirstClip = channel.playlist.length === 0;

    onUpdateChannel({
      playlist: nextPlaylist,
      ...(isFirstClip
        ? {
            activeClipIndex: 0,
            assignedMediaId: media.id,
            isPlaying: true,
          }
        : {}),
    });
  };

  const handleSelectClip = (index: number) => {
    const clip = channel.playlist[index];
    if (clip) {
      onUpdateChannel({
        activeClipIndex: index,
        assignedMediaId: clip.mediaId,
        currentTime: 0,
        isPlaying: true,
      });
    }
  };

  const handleRemoveClip = (instanceId: string) => {
    const nextPlaylist = channel.playlist.filter((c) => c.instanceId !== instanceId);
    let nextIdx = channel.activeClipIndex;
    if (nextIdx >= nextPlaylist.length) {
      nextIdx = Math.max(0, nextPlaylist.length - 1);
    }
    const nextAssigned = nextPlaylist[nextIdx]?.mediaId || null;

    onUpdateChannel({
      playlist: nextPlaylist,
      activeClipIndex: nextIdx,
      assignedMediaId: nextAssigned,
    });
  };

  const handleSaveHardwareConfig = (config: HardwareOutputConfig) => {
    onUpdateChannel({ hardwareOutput: config });
    hardwareBridge.sendHardwareConfig(channel.id, config);
  };

  const hw = channel.hardwareOutput;

  return (
    <div className="flex flex-col bg-surface border border-surface-border rounded-xl overflow-hidden shadow-xl hover:border-zinc-700 transition">
      {/* チャンネルヘッダー（タリー、CH名、アサイン素材名、ハードウェア送出設定、OUTボタン） */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-card border-b border-surface-border gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2.5 h-2.5 rounded-full shadow-sm transition-all ${
              channel.isBlackout
                ? 'bg-zinc-700'
                : assignedMedia && (channel.isPlaying || isImageMedia)
                ? 'bg-red-500 animate-pulse shadow-red-500/80 ring-2 ring-red-900/50'
                : assignedMedia
                ? 'bg-emerald-500'
                : 'bg-zinc-700'
            }`}
            title={channel.isBlackout ? 'FTB Active' : 'Tally Status'}
          />
          <span className="text-xs font-bold tracking-wider text-zinc-100 font-mono">
            OUTPUT {channel.id}
          </span>
          <span
            className="text-[10px] text-zinc-400 truncate max-w-[130px] font-mono"
            title={assignedMedia?.name}
          >
            {assignedMedia ? assignedMedia.name : '(NO SIGNAL)'}
          </span>

          {/* ハードウェアSDIバッジ（DeckLink / AJA） */}
          {hw?.enabled && hw.brand !== 'Window' && (
            <span
              onClick={() => setIsConfigModalOpen(true)}
              className="cursor-pointer px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 bg-blue-950 text-blue-300 border border-blue-700 hover:bg-blue-900 transition"
              title={`${hw.brand} ${hw.model} (Port ${hw.port})`}
            >
              <Cpu className="w-2.5 h-2.5" />
              <span>{hw.brand === 'Blackmagic DeckLink' ? 'DECKLINK' : 'KONA'} SDI{hw.port}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">{hw.videoStandard}</span>
            </span>
          )}
        </div>

        {/* 送出先コントロール & ハードウェア設定 */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* DeckLink / AJA ハードウェア設定ボタン */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className={`p-1 rounded border transition ${
              hw?.enabled && hw.brand !== 'Window'
                ? 'bg-blue-950/80 border-blue-600 text-blue-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Configure Blackmagic DeckLink / AJA KONA SDI Output"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          {/* 送出先ウィンドウ選択 */}
          <div className="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700 text-[10px] font-mono">
            <Monitor className="w-3 h-3 text-zinc-400" />
            <select
              value={channel.targetWindowId || channel.id}
              onChange={(e) =>
                onUpdateChannel({ targetWindowId: parseInt(e.target.value, 10) })
              }
              className="bg-transparent text-cyan-300 font-bold outline-none cursor-pointer"
              title="送出先ウィンドウを選択"
            >
              <option value={1} className="bg-zinc-900 text-white">Win 1</option>
              <option value={2} className="bg-zinc-900 text-white">Win 2</option>
              <option value={3} className="bg-zinc-900 text-white">Win 3</option>
              <option value={4} className="bg-zinc-900 text-white">Win 4</option>
            </select>
          </div>

          <button
            onClick={() =>
              onOpenOutputWindow(channel.targetWindowId || channel.id, channel.id)
            }
            className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-[10px] transition shadow-sm shadow-blue-500/30"
            title="選択した送出先ウィンドウを開く"
          >
            <span>OUT</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* メインモニタリングエリア（プレビュー + 大型ベクトルスコープ + 横型オーディオメーター） */}
      <div className="p-3 flex flex-col lg:flex-row gap-3 bg-surface-card/60">
        {/* 左側: プレビュー画面 ＆ コントローラー ＆ 横向きオーディオメーター */}
        <div className="flex-1 flex flex-col justify-between min-w-0 gap-2">
          {/* プレビュー画面 (16:9) */}
          <div
            ref={containerRef}
            className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center group select-none border border-zinc-800"
          >
            {isImageMedia ? (
              <img
                ref={(el) => {
                  localImageRef.current = el;
                  if (el !== activeMediaElement) setActiveMediaElement(el);
                }}
                src={assignedMedia?.url || ''}
                alt=""
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  channel.isBlackout ? 'opacity-0' : 'opacity-100'
                }`}
              />
            ) : (
              <video
                ref={(el) => {
                  localVideoRef.current = el;
                  if (el !== activeMediaElement) setActiveMediaElement(el);
                }}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                  if (channel.autoAdvance && channel.playlist.length > 1) {
                    handleNextClip();
                  } else if (channel.isLoop && localVideoRef.current) {
                    localVideoRef.current.currentTime = 0;
                    localVideoRef.current.play();
                  } else {
                    onUpdateChannel({ isPlaying: false });
                  }
                }}
                playsInline
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  channel.isBlackout ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}

            {/* FTB表示 */}
            {channel.isBlackout && (
              <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
                <span className="text-[10px] font-mono tracking-widest text-zinc-600 font-bold border border-zinc-800 px-2 py-0.5 rounded bg-zinc-950">
                  BLACKOUT (FTB)
                </span>
              </div>
            )}

            {/* 信号なし */}
            {!assignedMedia && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 select-none">
                <Radio className="w-6 h-6 mb-1 stroke-1" />
                <span className="text-[10px] font-mono">NO SIGNAL</span>
              </div>
            )}

            {/* バッジ */}
            {assignedMedia && (
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-300 border border-zinc-800">
                {isImageMedia ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <ImageIcon className="w-2.5 h-2.5" /> STILL
                  </span>
                ) : assignedMedia.type === 'live-camera' ? (
                  <span className="flex items-center gap-1 text-red-400 font-bold animate-pulse">
                    <Radio className="w-2.5 h-2.5" /> LIVE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-blue-400 font-bold">
                    <Film className="w-2.5 h-2.5" /> {formatTime(channel.currentTime)}
                  </span>
                )}
              </div>
            )}

            <button
              onClick={toggleFullscreen}
              className="absolute bottom-1.5 right-1.5 p-1 rounded bg-black/75 hover:bg-black text-zinc-300 hover:text-white opacity-0 group-hover:opacity-100 transition z-20 border border-zinc-700"
              title="Fullscreen Preview"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* シークバー */}
          <div>
            <input
              type="range"
              min={0}
              max={channel.duration || 100}
              step={0.1}
              value={channel.currentTime || 0}
              onChange={handleSeek}
              disabled={!assignedMedia || isImageMedia || assignedMedia.type === 'live-camera'}
              className="w-full h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-blue-500 disabled:opacity-20"
            />
          </div>

          {/* 再生/音量/FTB コントロール */}
          <div className="flex items-center justify-between gap-1 text-zinc-300">
            <div className="flex items-center gap-1">
              <button
                onClick={togglePlay}
                disabled={!assignedMedia || isImageMedia}
                className={`p-1.5 rounded transition ${
                  channel.isPlaying
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                } disabled:opacity-30`}
                title={channel.isPlaying ? 'Pause' : 'Play'}
              >
                {channel.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  if (localVideoRef.current) localVideoRef.current.currentTime = 0;
                  onUpdateChannel({ currentTime: 0 });
                }}
                disabled={!assignedMedia || isImageMedia}
                className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 disabled:opacity-30"
                title="Rewind"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onUpdateChannel({ isLoop: !channel.isLoop })}
                disabled={!assignedMedia || isImageMedia}
                className={`p-1.5 rounded transition border ${
                  channel.isLoop
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'
                } disabled:opacity-30`}
                title="Loop"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 音量 */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateChannel({ isMuted: !channel.isMuted })}
                disabled={!assignedMedia || isImageMedia}
                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                title="Mute"
              >
                {channel.isMuted || channel.volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={channel.isMuted ? 0 : channel.volume}
                onChange={(e) =>
                  onUpdateChannel({ volume: parseFloat(e.target.value), isMuted: false })
                }
                disabled={!assignedMedia || isImageMedia}
                className="w-14 h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-blue-500 disabled:opacity-20"
              />
            </div>

            {/* FTB */}
            <button
              onClick={() => onUpdateChannel({ isBlackout: !channel.isBlackout })}
              className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition border ${
                channel.isBlackout
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-500/50'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700 hover:bg-zinc-700'
              }`}
              title="Fade To Black"
            >
              FTB
            </button>
          </div>

          {/* 横向きオーディオメーター */}
          <div className="pt-1">
            <AudioMonitor
              sourceElement={
                isAudioAvailable && activeMediaElement instanceof HTMLMediaElement
                  ? activeMediaElement
                  : null
              }
              channelName={`CH ${channel.id}`}
              isMuted={channel.isMuted}
              isVideoOrAudio={isAudioAvailable}
              onToggleMute={() => onUpdateChannel({ isMuted: !channel.isMuted })}
            />
          </div>
        </div>

        {/* 右側: 大型ベクトルスコープ（線表示 190px） */}
        <div className="w-full lg:w-[210px] flex flex-col flex-shrink-0">
          <Vectorscope
            sourceElement={activeMediaElement}
            channelName={`CH ${channel.id}`}
            sourceType={assignedMedia?.type}
            size={185}
          />
        </div>
      </div>

      {/* 下部: タイムライン */}
      <div className="p-2.5 pt-0 bg-surface-card/60">
        <OutputTimeline
          channelId={channel.id}
          playlist={channel.playlist || []}
          activeClipIndex={channel.activeClipIndex || 0}
          autoAdvance={channel.autoAdvance ?? true}
          currentTime={channel.currentTime}
          onSelectClip={handleSelectClip}
          onRemoveClip={handleRemoveClip}
          onAddClip={handleAddClipToTimeline}
          onToggleAutoAdvance={() =>
            onUpdateChannel({ autoAdvance: !(channel.autoAdvance ?? true) })
          }
        />
      </div>

      {/* DeckLink & AJA ハードウェア設定モーダル */}
      <HardwareConfigModal
        isOpen={isConfigModalOpen}
        channelId={channel.id}
        config={
          channel.hardwareOutput || {
            enabled: false,
            brand: 'Blackmagic DeckLink',
            model: 'DeckLink Duo 2',
            port: channel.id,
            videoStandard: '1080p59.94',
            colorFormat: '10-bit YUV 4:2:2',
            status: 'standby',
            genlock: 'Ref In',
          }
        }
        isBridgeConnected={isBridgeConnected}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveHardwareConfig}
      />
    </div>
  );
};
