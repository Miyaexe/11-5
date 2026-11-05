"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Activity, ZoomIn, ZoomOut } from 'lucide-react';

interface VectorscopeProps {
  sourceElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | null;
  channelName?: string;
  sourceType?: string;
  size?: number; // キャンバスサイズ (デフォルト 190)
}

export const Vectorscope: React.FC<VectorscopeProps> = ({
  sourceElement,
  channelName = "CH 1",
  sourceType = "video",
  size = 190,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gain, setGain] = useState<number>(1);
  const [displayColor, setDisplayColor] = useState<'green' | 'amber' | 'cyan' | 'full'>('green');
  const [sampleRes, setSampleRes] = useState<number>(120);

  useEffect(() => {
    if (!sampleCanvasRef.current) {
      sampleCanvasRef.current = document.createElement('canvas');
    }
  }, []);

  useEffect(() => {
    let animId: number;

    const drawScope = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = (Math.min(width, height) / 2) * 0.86;

      // オシロスコープ管面（深みのあるグラデーション）
      const gradBg = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius * 1.2);
      gradBg.addColorStop(0, '#0c1017');
      gradBg.addColorStop(0.85, '#05070a');
      gradBg.addColorStop(1, '#020305');
      ctx.fillStyle = gradBg;
      ctx.fillRect(0, 0, width, height);

      // --- レティクル（目盛り・ターゲット）描画 ---
      ctx.lineWidth = 1;

      // 外周ベゼルリング
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 同心円（25%, 50%, 75%, 100%）
      [0.25, 0.5, 0.75, 1.0].forEach((ratio) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * ratio, 0, Math.PI * 2);
        ctx.strokeStyle = ratio === 0.75 ? '#334155' : '#141c2b';
        ctx.setLineDash(ratio === 0.75 ? [2, 3] : []);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // 中心十字クロスヘア
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy);
      ctx.lineTo(cx + 10, cy);
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx, cy + 10);
      ctx.stroke();

      // I軸 / Q軸（スキントーンライン: 約123度 / 10時半方向）
      const skinAngle = (123 * Math.PI) / 180;
      ctx.strokeStyle = '#3b82f6';
      ctx.globalAlpha = 0.55;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(skinAngle) * radius, cy + Math.sin(skinAngle) * radius);
      ctx.lineTo(cx + Math.cos(skinAngle) * radius, cy - Math.sin(skinAngle) * radius);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;

      // スキントーンマーク文字 "I"
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('I (Skin)', cx - Math.cos(skinAngle) * (radius + 12) - 8, cy - Math.sin(skinAngle) * (radius + 12));

      // 75% SMPTE カラーターゲット定義
      const targetColors: Record<string, { u: number; v: number; colorHex: string }> = {
        R: { u: -0.147, v: 0.615, colorHex: '#ef4444' },
        Mg: { u: 0.289, v: 0.523, colorHex: '#ec4899' },
        B: { u: 0.436, v: -0.092, colorHex: '#3b82f6' },
        Cy: { u: 0.147, v: -0.615, colorHex: '#06b6d4' },
        G: { u: -0.289, v: -0.523, colorHex: '#22c55e' },
        Yl: { u: -0.436, v: 0.092, colorHex: '#eab308' },
      };

      // 75% ターゲットボックスの描画
      Object.entries(targetColors).forEach(([col, pos]) => {
        const tx = cx + pos.u * (radius / 0.5) * 0.75 * gain;
        const ty = cy - pos.v * (radius / 0.5) * 0.75 * gain;

        ctx.strokeStyle = '#475569';
        ctx.strokeRect(tx - 3.5, ty - 3.5, 7, 7);

        ctx.fillStyle = pos.colorHex;
        ctx.font = 'bold 8px monospace';
        ctx.fillText(col, tx + 5, ty + 3);
      });

      // --- 映像または画像データのサンプリングと「線表示（Trace Lines）」描画 ---
      if (sourceElement && sampleCanvasRef.current) {
        const sCanvas = sampleCanvasRef.current;
        const sW = sampleRes;
        const sH = Math.round((sampleRes * 9) / 16);
        sCanvas.width = sW;
        sCanvas.height = sH;
        const sCtx = sCanvas.getContext('2d', { willReadFrequently: true });

        if (sCtx) {
          try {
            let canDraw = false;
            const tagName = (sourceElement as HTMLElement)?.tagName?.toUpperCase();
            if (tagName === 'VIDEO') {
              const video = sourceElement as HTMLVideoElement;
              if (video.readyState >= 2) canDraw = true;
            } else if (tagName === 'IMG') {
              const img = sourceElement as HTMLImageElement;
              canDraw = img.complete && img.naturalWidth > 0;
            } else if (tagName === 'CANVAS') {
              canDraw = true;
            }

            if (canDraw) {
              sCtx.drawImage(sourceElement, 0, 0, sW, sH);
              const imgData = sCtx.getImageData(0, 0, sW, sH).data;

              ctx.save();
              ctx.globalCompositeOperation = 'lighter';

              let strokeColor = '#22c55e'; // default phosphor green
              if (displayColor === 'amber') strokeColor = '#f59e0b';
              if (displayColor === 'cyan') strokeColor = '#06b6d4';

              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = 1.0;
              ctx.globalAlpha = 0.32;

              // 【線表示（Vector Trace Line）】
              ctx.beginPath();
              let isDrawingLine = false;

              for (let y = 0; y < sH; y += 2) {
                for (let x = 0; x < sW; x += 2) {
                  const idx = (y * sW + x) * 4;
                  const r = imgData[idx] / 255;
                  const g = imgData[idx + 1] / 255;
                  const b = imgData[idx + 2] / 255;
                  const a = imgData[idx + 3];

                  if (a < 15) {
                    isDrawingLine = false;
                    continue;
                  }

                  const u = -0.14713 * r - 0.28886 * g + 0.436 * b;
                  const v = 0.615 * r - 0.51499 * g - 0.10001 * b;

                  const px = cx + u * (radius / 0.5) * gain;
                  const py = cy - v * (radius / 0.5) * gain;

                  if (px >= 0 && px < width && py >= 0 && py < height) {
                    if (displayColor === 'full') {
                      ctx.stroke();
                      ctx.beginPath();
                      ctx.strokeStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 0.4)`;
                      ctx.moveTo(px, py);
                    } else {
                      if (!isDrawingLine) {
                        ctx.moveTo(px, py);
                        isDrawingLine = true;
                      } else {
                        ctx.lineTo(px, py);
                      }
                    }
                  } else {
                    isDrawingLine = false;
                  }
                }
                isDrawingLine = false;
              }

              ctx.stroke();
              ctx.restore();
            }
          } catch (e) {
            // CORS等のエラーハンドリング
          }
        }
      }

      animId = requestAnimationFrame(drawScope);
    };

    animId = requestAnimationFrame(drawScope);
    return () => cancelAnimationFrame(animId);
  }, [sourceElement, gain, displayColor, sampleRes]);

  return (
    <div className="flex flex-col items-center justify-between bg-zinc-950/90 border border-zinc-800/80 rounded-lg p-2.5 h-full">
      {/* ヘッダー */}
      <div className="w-full flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800/60 text-[10px] font-mono">
        <span className="text-zinc-300 font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-500/50" />
          VECTORSCOPE
        </span>

        {/* ゲイン & カラー切替 */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setGain((g) => (g === 1 ? 2 : g === 2 ? 0.5 : 1))}
            className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white font-mono text-[9px] font-bold"
            title="Toggle Gain (1x, 2x, 0.5x)"
          >
            {gain}x
          </button>
          <button
            onClick={() => {
              const modes: ('green' | 'amber' | 'cyan' | 'full')[] = ['green', 'amber', 'cyan', 'full'];
              const next = modes[(modes.indexOf(displayColor) + 1) % modes.length];
              setDisplayColor(next);
            }}
            className="w-3 h-3 rounded-full border border-zinc-600 transition shadow-sm"
            style={{
              backgroundColor:
                displayColor === 'green'
                  ? '#22c55e'
                  : displayColor === 'amber'
                  ? '#f59e0b'
                  : displayColor === 'cyan'
                  ? '#06b6d4'
                  : '#a855f7',
            }}
            title="Toggle Trace Color (Green, Amber, Cyan, True Color)"
          />
        </div>
      </div>

      {/* スコープ本体（大きめサイズで鮮明に表示） */}
      <div className="relative flex items-center justify-center my-auto py-1">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-full border border-zinc-800 shadow-2xl bg-[#020305]"
        />
      </div>

      <div className="w-full flex justify-between items-center text-[9px] text-zinc-500 font-mono mt-1 pt-1.5 border-t border-zinc-800/50">
        <span className="text-zinc-400">LINE TRACE</span>
        <span>REC.709 75%</span>
      </div>
    </div>
  );
};
