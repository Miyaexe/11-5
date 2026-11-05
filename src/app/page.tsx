"use client";

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Clock,
  Play,
  Square,
  Cpu,
  Radio,
} from 'lucide-react';
import { MediaItem, OutputChannelState, TimelineClip } from '@/types';
import { OutputChannelCard } from '@/components/OutputChannelCard';
import { MediaPool } from '@/components/MediaPool';
import { MultiScreenManager } from '@/components/MultiScreenManager';
import { syncChannel } from '@/utils/broadcastSync';
import { createSMPTEColorBars, createColorGradient } from '@/utils/testPatterns';
import { hardwareBridge } from '@/utils/hardwareBridge';

export default function PlayoutController() {
  const [channels, setChannels] = useState<OutputChannelState[]>([
    {
      id: 1,
      name: 'OUTPUT 1',
      assignedMediaId: null,
      playlist: [],
      activeClipIndex: 0,
      autoAdvance: true,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
      isLoop: true,
      isBlackout: false,
      aspectRatio: 'contain',
      targetWindowId: 1,
      hardwareOutput: {
        enabled: true,
        brand: 'Blackmagic DeckLink',
        model: 'DeckLink Duo 2',
        port: 1,
        videoStandard: '1080p59.94',
        colorFormat: '10-bit YUV 4:2:2',
        status: 'standby',
        genlock: 'Ref In',
      },
    },
    {
      id: 2,
      name: 'OUTPUT 2',
      assignedMediaId: null,
      playlist: [],
      activeClipIndex: 0,
      autoAdvance: true,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
      isLoop: true,
      isBlackout: false,
      aspectRatio: 'contain',
      targetWindowId: 2,
      hardwareOutput: {
        enabled: true,
        brand: 'Blackmagic DeckLink',
        model: 'DeckLink Duo 2',
        port: 2,
        videoStandard: '1080p59.94',
        colorFormat: '10-bit YUV 4:2:2',
        status: 'standby',
        genlock: 'Ref In',
      },
    },
    {
      id: 3,
      name: 'OUTPUT 3',
      assignedMediaId: null,
      playlist: [],
      activeClipIndex: 0,
      autoAdvance: true,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
      isLoop: true,
      isBlackout: false,
      aspectRatio: 'contain',
      targetWindowId: 3,
      hardwareOutput: {
        enabled: true,
        brand: 'AJA KONA',
        model: 'AJA KONA 5 (12G-SDI)',
        port: 1,
        videoStandard: '1080p59.94',
        colorFormat: '10-bit YUV 4:2:2',
        status: 'standby',
        genlock: 'Ref In',
      },
    },
    {
      id: 4,
      name: 'OUTPUT 4',
      assignedMediaId: null,
      playlist: [],
      activeClipIndex: 0,
      autoAdvance: true,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
      isLoop: true,
      isBlackout: false,
      aspectRatio: 'contain',
      targetWindowId: 4,
      hardwareOutput: {
        enabled: true,
        brand: 'AJA KONA',
        model: 'AJA KONA 5 (12G-SDI)',
        port: 2,
        videoStandard: '1080p59.94',
        colorFormat: '10-bit YUV 4:2:2',
        status: 'standby',
        genlock: 'Ref In',
      },
    },
  ]);

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [timecode, setTimecode] = useState<string>('00:00:00;00');
  const [isBridgeOnline, setIsBridgeOnline] = useState(false);

  useEffect(() => {
    const unsub = hardwareBridge.subscribe((connected) => {
      setIsBridgeOnline(connected);
    });
    return () => unsub();
  }, []);

  // 初期ロード
  useEffect(() => {
    const barsUrl = createSMPTEColorBars();
    const gradUrl = createColorGradient();

    const initialBars: MediaItem = {
      id: 'default_smpte',
      name: 'SMPTE Color Bars (75% Rec.709)',
      type: 'test-pattern',
      url: barsUrl,
      thumbnailUrl: barsUrl,
      format: 'SMPTE',
      duration: 10,
    };
    const initialGrad: MediaItem = {
      id: 'default_grad',
      name: 'RGB Spectrum Gradient',
      type: 'test-pattern',
      url: gradUrl,
      thumbnailUrl: gradUrl,
      format: 'TEST',
      duration: 5,
    };

    setMediaList([initialBars, initialGrad]);

    const clip1: TimelineClip = {
      instanceId: `clip_init_1`,
      mediaId: initialBars.id,
      name: initialBars.name,
      type: initialBars.type,
      url: initialBars.url,
      thumbnailUrl: initialBars.thumbnailUrl,
      duration: 10,
    };
    const clip2: TimelineClip = {
      instanceId: `clip_init_2`,
      mediaId: initialGrad.id,
      name: initialGrad.name,
      type: initialGrad.type,
      url: initialGrad.url,
      thumbnailUrl: initialGrad.thumbnailUrl,
      duration: 5,
    };

    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === 1
          ? {
              ...ch,
              assignedMediaId: initialBars.id,
              playlist: [clip1, clip2],
              activeClipIndex: 0,
            }
          : ch
      )
    );
  }, []);

  // タイムコード更新
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const f = String(Math.floor((now.getMilliseconds() / 1000) * 30)).padStart(2, '0');
      setTimecode(`${h}:${m}:${s};${f}`);
    }, 33);
    return () => clearInterval(timer);
  }, []);

  // BroadcastChannel 同期
  useEffect(() => {
    const unsubscribe = syncChannel.subscribe((msg) => {
      if (msg.type === 'SYNC_STATE' && msg.payload?.requestSync) {
        const ch = channels.find((c) => c.id === msg.channelId);
        const media = mediaList.find((m) => m.id === ch?.assignedMediaId);
        if (ch) {
          syncChannel.send('SYNC_STATE', ch.id, { channel: ch, media });
        }
      }
    });
    return () => unsubscribe();
  }, [channels, mediaList]);

  const updateChannel = (channelId: number, updated: Partial<OutputChannelState>) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === channelId) {
          const next = { ...ch, ...updated };

          if (updated.isPlaying !== undefined) {
            syncChannel.send(updated.isPlaying ? 'PLAY' : 'PAUSE', channelId);
          }
          if (updated.currentTime !== undefined) {
            syncChannel.send('SEEK', channelId, { time: updated.currentTime });
          }
          if (updated.volume !== undefined || updated.isMuted !== undefined) {
            syncChannel.send('SET_VOLUME', channelId, {
              volume: next.volume,
              isMuted: next.isMuted,
            });
          }
          if (updated.isBlackout !== undefined) {
            syncChannel.send('BLACKOUT', channelId, { isBlackout: updated.isBlackout });
          }

          return next;
        }
        return ch;
      })
    );
  };

  const handleAssignMedia = (mediaId: string, channelId: number) => {
    const media = mediaList.find((m) => m.id === mediaId) || null;
    if (!media) return;

    const newClip: TimelineClip = {
      instanceId: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mediaId: media.id,
      name: media.name,
      type: media.type,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      duration: media.duration || (media.type === 'image' ? 5 : 10),
    };

    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === channelId) {
          const nextPlaylist = [...ch.playlist, newClip];
          return {
            ...ch,
            playlist: nextPlaylist,
            activeClipIndex: nextPlaylist.length - 1,
            assignedMediaId: mediaId,
            currentTime: 0,
            isPlaying: true,
          };
        }
        return ch;
      })
    );
    syncChannel.send('ASSIGN', channelId, { media });
  };

  const handleAddMedia = (item: MediaItem) => {
    setMediaList((prev) => [...prev, item]);
  };

  const handleRemoveMedia = (id: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== id));
    setChannels((prev) =>
      prev.map((ch) => {
        const nextPlaylist = ch.playlist.filter((c) => c.mediaId !== id);
        return {
          ...ch,
          playlist: nextPlaylist,
          assignedMediaId: ch.assignedMediaId === id ? null : ch.assignedMediaId,
        };
      })
    );
  };

  const handleOpenOutputWindow = (targetWindowId: number, sourceChannelId?: number) => {
    const url = `/output/${targetWindowId}`;
    const windowFeatures = 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no';
    window.open(url, `OutputWindow_${targetWindowId}`, windowFeatures);

    const chId = sourceChannelId || targetWindowId;
    setTimeout(() => {
      const ch = channels.find((c) => c.id === chId);
      const media = mediaList.find((m) => m.id === ch?.assignedMediaId);
      syncChannel.send('SYNC_STATE', chId, { channel: ch, media });
    }, 800);
  };

  const playAll = () => {
    channels.forEach((ch) => {
      if (ch.assignedMediaId) {
        updateChannel(ch.id, { isPlaying: true });
      }
    });
  };

  const pauseAll = () => {
    channels.forEach((ch) => updateChannel(ch.id, { isPlaying: false }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col select-none text-zinc-100">
      {/* トップコントロールバー */}
      <header className="h-16 bg-surface border-b border-surface-border px-5 flex items-center justify-between gap-4 sticky top-0 z-50 shadow-md">
        {/* ロゴ & タイトル */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/10">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-wider uppercase text-zinc-100 font-mono">
                PRO PLAYOUT CONTROLLER
              </h1>
              {/* SDI Hardware インジケーター */}
              <span className="text-[10px] bg-blue-950/80 text-blue-300 border border-blue-700 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5" />
                DECKLINK & AJA KONA SDI
              </span>
              <span className="text-[10px] bg-red-950/80 text-red-400 border border-red-800 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                ON AIR
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              BLACKMAGIC DESKTOP VIDEO & AJA NTV2 BROADCAST ARCHITECTURE
            </p>
          </div>
        </div>

        {/* タイムコード表示 */}
        <div className="flex items-center gap-2.5 bg-zinc-950 px-3.5 py-1.5 rounded-lg border border-surface-border font-mono shadow-inner">
          <Clock className="w-4 h-4 text-zinc-500" />
          <span className="text-xs text-zinc-400">JST / TC:</span>
          <span className="text-sm font-bold text-broadcast-green tracking-wider font-mono">
            {timecode}
          </span>
        </div>

        {/* 一括コントロール ＆ 送出ウィンドウセレクター */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-lg border border-surface-border">
            <button
              onClick={playAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm shadow-emerald-500/30"
              title="Play All Video Channels"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              ALL PLAY
            </button>
            <button
              onClick={pauseAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition border border-zinc-700"
              title="Pause All Video Channels"
            >
              <Square className="w-3 h-3 fill-current" />
              ALL STOP
            </button>
          </div>

          <MultiScreenManager onOpenChannelWindow={handleOpenOutputWindow} />
        </div>
      </header>

      {/* メインエリア */}
      <main className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        {/* 上段: 4つの個別アウトプットチャンネル */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {channels.map((channel) => {
            const assignedMedia = mediaList.find((m) => m.id === channel.assignedMediaId) || null;
            return (
              <OutputChannelCard
                key={channel.id}
                channel={channel}
                assignedMedia={assignedMedia}
                onUpdateChannel={(updated) => updateChannel(channel.id, updated)}
                onOpenOutputWindow={handleOpenOutputWindow}
              />
            );
          })}
        </div>

        {/* 下段: メディアプール */}
        <div className="flex-1 min-h-[300px]">
          <MediaPool
            mediaList={mediaList}
            onAddMedia={handleAddMedia}
            onRemoveMedia={handleRemoveMedia}
            onAssignToChannel={handleAssignMedia}
          />
        </div>
      </main>
    </div>
  );
}
