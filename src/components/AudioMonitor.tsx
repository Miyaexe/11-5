"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audioManager } from '@/utils/audioManager';

interface AudioMonitorProps {
  sourceElement: HTMLMediaElement | null;
  channelName?: string;
  isMuted?: boolean;
  isVideoOrAudio?: boolean;
  onToggleMute?: () => void;
}

export const AudioMonitor: React.FC<AudioMonitorProps> = ({
  sourceElement,
  channelName = "CH 1",
  isMuted = false,
  isVideoOrAudio = true,
  onToggleMute,
}) => {
  const [levelL, setLevelL] = useState<number>(-100);
  const [levelR, setLevelR] = useState<number>(-100);
  const [peakL, setPeakL] = useState<number>(-100);
  const [peakR, setPeakR] = useState<number>(-100);
  const [isClipL, setIsClipL] = useState<boolean>(false);
  const [isClipR, setIsClipR] = useState<boolean>(false);

  const peakHoldTimerL = useRef<NodeJS.Timeout | null>(null);
  const peakHoldTimerR = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!sourceElement || !isVideoOrAudio) {
      setLevelL(-100);
      setLevelR(-100);
      setPeakL(-100);
      setPeakR(-100);
      return;
    }

    audioManager.registerMediaElement(sourceElement);

    let animId: number;

    const updateMeter = () => {
      const metrics = audioManager.getMetrics(sourceElement);

      setLevelL(metrics.rmsL);
      setLevelR(metrics.rmsR);

      // Peak Hold L
      if (metrics.peakL >= 0) setIsClipL(true);
      if (metrics.peakL > peakL) {
        setPeakL(metrics.peakL);
        if (peakHoldTimerL.current) clearTimeout(peakHoldTimerL.current);
        peakHoldTimerL.current = setTimeout(() => {
          setPeakL((p) => Math.max(-100, p - 6));
        }, 1400);
      } else {
        setPeakL((p) => Math.max(-100, p - 0.5));
      }

      // Peak Hold R
      if (metrics.peakR >= 0) setIsClipR(true);
      if (metrics.peakR > peakR) {
        setPeakR(metrics.peakR);
        if (peakHoldTimerR.current) clearTimeout(peakHoldTimerR.current);
        peakHoldTimerR.current = setTimeout(() => {
          setPeakR((p) => Math.max(-100, p - 6));
        }, 1400);
      } else {
        setPeakR((p) => Math.max(-100, p - 0.5));
      }

      animId = requestAnimationFrame(updateMeter);
    };

    animId = requestAnimationFrame(updateMeter);
    return () => {
      cancelAnimationFrame(animId);
      if (peakHoldTimerL.current) clearTimeout(peakHoldTimerL.current);
      if (peakHoldTimerR.current) clearTimeout(peakHoldTimerR.current);
    };
  }, [sourceElement, isVideoOrAudio, peakL, peakR]);

  // dB (-48dB 〜 0dB) をパーセンテージに変換
  const dbToPercent = (db: number) => {
    if (db <= -48) return 0;
    if (db >= 0) return 100;
    return Math.min(100, Math.max(0, ((db + 48) / 48) * 100));
  };

  const dbScaleMarks = [-48, -36, -24, -18, -12, -6, 0];

  return (
    <div className="w-full bg-zinc-950/90 border border-zinc-800/80 rounded-lg p-2 flex flex-col justify-between">
      {/* 上部ヘッダー（VU/PPMラベル、数値、ミュートボタン、CLIP） */}
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-zinc-800/60 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 font-bold">AUDIO PPM</span>
          <span className="text-zinc-500 font-mono text-[9px]">
            {levelL <= -60 ? '-∞' : `${levelL.toFixed(1)}`} / {levelR <= -60 ? '-∞' : `${levelR.toFixed(1)}`} dBFS
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* CLIP インジケーター */}
          <button
            onClick={() => {
              setIsClipL(false);
              setIsClipR(false);
            }}
            className={`px-1.5 py-0.2 rounded text-[8px] font-bold font-mono transition ${
              isClipL || isClipR
                ? 'bg-red-600 text-white animate-pulse shadow-sm shadow-red-500/50'
                : 'text-zinc-600'
            }`}
            title="Clip Reset"
          >
            CLIP
          </button>

          {/* モニター音声 MUTE/LIVE */}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono transition ${
                isMuted
                  ? 'text-red-400 bg-red-950/60 border border-red-800'
                  : 'text-emerald-400 hover:bg-zinc-800'
              }`}
              title={isMuted ? 'Unmute Monitor Audio' : 'Mute Monitor Audio'}
            >
              {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              <span>{isMuted ? 'MUTE' : 'LIVE'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 横向きメーター本体 */}
      {!isVideoOrAudio ? (
        <div className="py-2 flex items-center justify-center text-zinc-600 text-[10px] font-mono">
          NO AUDIO (STILL IMAGE)
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 py-0.5">
          {/* L チャンネル（横バー） */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold text-zinc-400 w-3">L</span>
            <div className="flex-1 h-3 bg-zinc-900 rounded overflow-hidden relative border border-zinc-800/80">
              {/* レベルバー（横グラデーション） */}
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${dbToPercent(levelL)}%`,
                  background: 'linear-gradient(to right, #22c55e 0%, #22c55e 65%, #eab308 78%, #f97316 88%, #ef4444 100%)',
                }}
              />
              {/* Peak Hold 線 */}
              {peakL > -48 && (
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-white shadow-sm transition-all duration-100 z-10"
                  style={{ left: `${dbToPercent(peakL)}%` }}
                />
              )}
            </div>
          </div>

          {/* R チャンネル（横バー） */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold text-zinc-400 w-3">R</span>
            <div className="flex-1 h-3 bg-zinc-900 rounded overflow-hidden relative border border-zinc-800/80">
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${dbToPercent(levelR)}%`,
                  background: 'linear-gradient(to right, #22c55e 0%, #22c55e 65%, #eab308 78%, #f97316 88%, #ef4444 100%)',
                }}
              />
              {peakR > -48 && (
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-white shadow-sm transition-all duration-100 z-10"
                  style={{ left: `${dbToPercent(peakR)}%` }}
                />
              )}
            </div>
          </div>

          {/* 横目盛りラベル */}
          <div className="flex justify-between pl-5 pr-1 text-[8px] font-mono text-zinc-500">
            {dbScaleMarks.map((db) => (
              <span
                key={db}
                className={
                  db === 0
                    ? 'text-red-400 font-bold'
                    : db === -6
                    ? 'text-amber-400'
                    : ''
                }
              >
                {db === 0 ? '0dB' : `${db}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
