"use client";

import React, { useRef, useState } from 'react';
import {
  FolderPlus,
  Video,
  Image as ImageIcon,
  Camera,
  Sliders,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { MediaItem } from '@/types';
import { createSMPTEColorBars, createColorGradient } from '@/utils/testPatterns';

interface MediaPoolProps {
  mediaList: MediaItem[];
  outputCount: number; // 動的なアウトプット数 (1〜8)
  onAddMedia: (item: MediaItem) => void;
  onRemoveMedia: (id: string) => void;
  onAssignToChannel: (mediaId: string, channelId: number) => void;
}

export const MediaPool: React.FC<MediaPoolProps> = ({
  mediaList,
  outputCount = 4,
  onAddMedia,
  onRemoveMedia,
  onAssignToChannel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'video' | 'image' | 'test'>('all');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video');
      const isImage = file.type.startsWith('image');
      if (!isVideo && !isImage) return;

      const url = URL.createObjectURL(file);
      const ext = file.name.split('.').pop()?.toUpperCase() || (isVideo ? 'MP4' : 'PNG');

      if (isImage) {
        const img = new Image();
        img.onload = () => {
          const item: MediaItem = {
            id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            type: 'image',
            url,
            thumbnailUrl: url,
            width: img.naturalWidth,
            height: img.naturalHeight,
            fileSize: formatFileSize(file.size),
            format: ext,
            duration: 5,
          };
          onAddMedia(item);
        };
        img.src = url;
      } else {
        const tempVideo = document.createElement('video');
        tempVideo.onloadedmetadata = () => {
          const item: MediaItem = {
            id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            type: 'video',
            url,
            fileSize: formatFileSize(file.size),
            format: ext,
            duration: tempVideo.duration || 10,
          };
          onAddMedia(item);
        };
        tempVideo.src = url;
      }
    });
  };

  const addColorBars = () => {
    const barsUrl = createSMPTEColorBars();
    const item: MediaItem = {
      id: `smpte_${Date.now()}`,
      name: 'SMPTE Color Bars (75% Rec.709)',
      type: 'test-pattern',
      url: barsUrl,
      thumbnailUrl: barsUrl,
      format: 'SMPTE',
      duration: 10,
    };
    onAddMedia(item);
  };

  const addGradient = () => {
    const gradUrl = createColorGradient();
    const item: MediaItem = {
      id: `grad_${Date.now()}`,
      name: 'RGB Spectrum Gradient',
      type: 'test-pattern',
      url: gradUrl,
      thumbnailUrl: gradUrl,
      format: 'GRADIENT',
      duration: 5,
    };
    onAddMedia(item);
  };

  const addLiveCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });

      const videoTrack = stream.getVideoTracks()[0];
      const cameraName = videoTrack.label || 'USB Capture / Camera';

      const item: MediaItem = {
        id: `live_${Date.now()}`,
        name: `🔴 LIVE: ${cameraName}`,
        type: 'live-camera',
        url: '',
        stream,
        format: 'LIVE',
        duration: 999999,
      };
      onAddMedia(item);
    } catch (err) {
      alert('カメラまたはキャプチャデバイスへのアクセスが許可されませんでした。');
      console.error(err);
    }
  };

  const handleDragStart = (e: React.DragEvent, media: MediaItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(media));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const filteredList = mediaList.filter((m) => {
    if (activeFilter === 'video') return m.type === 'video';
    if (activeFilter === 'image') return m.type === 'image';
    if (activeFilter === 'test') return m.type === 'test-pattern' || m.type === 'live-camera';
    return true;
  });

  return (
    <div className="flex flex-col bg-surface-card border border-surface-border rounded-xl p-3.5 shadow-xl h-full">
      {/* ヘッダー & ボタン群 */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-surface-border gap-2">
        <div className="flex items-center gap-2">
          <FolderPlus className="w-4 h-4 text-broadcast-blue" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-100 font-mono">
            MEDIA POOL
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
            {mediaList.length} ITEMS
          </span>
          <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
            (各タイムラインへドラッグ＆ドロップ可能)
          </span>
        </div>

        {/* フィルタータブ */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[11px] font-mono">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-0.5 rounded ${activeFilter === 'all' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            ALL
          </button>
          <button
            onClick={() => setActiveFilter('video')}
            className={`px-2 py-0.5 rounded ${activeFilter === 'video' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            VIDEO
          </button>
          <button
            onClick={() => setActiveFilter('image')}
            className={`px-2 py-0.5 rounded ${activeFilter === 'image' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            IMAGE
          </button>
          <button
            onClick={() => setActiveFilter('test')}
            className={`px-2 py-0.5 rounded ${activeFilter === 'test' ? 'bg-amber-600 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            LIVE/TEST
          </button>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            multiple
            accept="video/*,image/*,.mp4,.mov,.webm,.png,.jpg,.jpeg,.webp,.gif,.svg"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 font-semibold shadow-md shadow-blue-500/20 transition"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            ファイル追加
          </button>

          <button
            onClick={addColorBars}
            className="px-2 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1 font-mono transition"
          >
            <Sliders className="w-3 h-3 text-amber-400" />
            カラーバー
          </button>

          <button
            onClick={addGradient}
            className="px-2 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1 font-mono transition"
          >
            <Sparkles className="w-3 h-3 text-pink-400" />
            グラデーション
          </button>

          <button
            onClick={addLiveCamera}
            className="px-2 py-1 text-xs rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 flex items-center gap-1 font-mono transition"
          >
            <Camera className="w-3 h-3 text-red-400" />
            LIVE入力
          </button>
        </div>
      </div>

      {/* ドロップゾーン ＆ 素材グリッド */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex-1 overflow-y-auto mt-2 min-h-[190px] p-2.5 rounded-xl border border-dashed transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-950/30'
            : 'border-surface-border bg-zinc-950/40'
        }`}
      >
        {filteredList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-7 h-7 text-zinc-600 stroke-1" />
              <ImageIcon className="w-7 h-7 text-zinc-600 stroke-1" />
            </div>
            <p className="text-xs font-medium text-zinc-400">
              動画（MP4/MOV/WebM）や画像（PNG/JPG/GIF/WebP）をここにドラッグ＆ドロップ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredList.map((media) => (
              <div
                key={media.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, media)}
                className="bg-surface border border-surface-border rounded-xl p-3 flex flex-col justify-between hover:border-zinc-500 transition group shadow-md cursor-grab active:cursor-grabbing hover:shadow-blue-500/10"
                title="ドラッグしてアウトプットのタイムラインへ追加"
              >
                {/* サムネイル + メタデータ + 削除 */}
                <div className="flex items-start gap-2.5">
                  <div className="w-16 h-12 bg-black rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 relative border border-zinc-800">
                    {media.type === 'video' ? (
                      <video src={media.url} className="w-full h-full object-cover" preload="metadata" />
                    ) : media.type === 'image' || media.type === 'test-pattern' ? (
                      <img src={media.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-red-500 animate-pulse" />
                    )}
                    <span
                      className={`absolute bottom-0 right-0 text-[8px] px-1 font-mono font-bold uppercase rounded-tl ${
                        media.type === 'image'
                          ? 'bg-emerald-600 text-white'
                          : media.type === 'video'
                          ? 'bg-blue-600 text-white'
                          : media.type === 'live-camera'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {media.format || media.type}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-xs font-bold text-zinc-200 truncate" title={media.name}>
                      {media.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono mt-0.5">
                      {media.fileSize && <span>{media.fileSize}</span>}
                      {media.width && media.height && (
                        <span>{`${media.width}x${media.height}`}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveMedia(media.id);
                    }}
                    className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 動的ルーティングセクション (1〜8CHに対応) */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-1">
                  <span className="text-[10px] text-zinc-400 font-mono font-bold flex-shrink-0">
                    ROUTE:
                  </span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {Array.from({ length: outputCount }, (_, i) => i + 1).map((ch) => (
                      <button
                        key={ch}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAssignToChannel(media.id, ch);
                        }}
                        className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-zinc-800 hover:bg-blue-600 text-zinc-200 hover:text-white border border-zinc-700 hover:border-blue-500 transition shadow-sm"
                        title={`Assign directly to Output ${ch}`}
                      >
                        CH{ch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
