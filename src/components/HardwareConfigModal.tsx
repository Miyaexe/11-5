"use client";

import React from 'react';
import { X, Cpu, Check, AlertCircle, Radio, Settings2, Zap } from 'lucide-react';
import { HardwareOutputConfig, HardwareDeviceBrand, VideoStandard, SDIColorFormat } from '@/types';
import { DECKLINK_MODELS, AJA_KONA_MODELS, VIDEO_STANDARDS, SDI_COLOR_FORMATS } from '@/utils/hardwareBridge';

interface HardwareConfigModalProps {
  isOpen: boolean;
  channelId: number;
  config: HardwareOutputConfig;
  isBridgeConnected: boolean;
  onClose: () => void;
  onSave: (config: HardwareOutputConfig) => void;
}

export const HardwareConfigModal: React.FC<HardwareConfigModalProps> = ({
  isOpen,
  channelId,
  config,
  isBridgeConnected,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = React.useState<HardwareOutputConfig>(config);

  React.useEffect(() => {
    setDraft(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleBrandChange = (brand: HardwareDeviceBrand) => {
    let model = 'Virtual Window';
    if (brand === 'Blackmagic DeckLink') model = DECKLINK_MODELS[0];
    if (brand === 'AJA KONA') model = AJA_KONA_MODELS[0];

    setDraft((prev) => ({
      ...prev,
      brand,
      model,
      enabled: brand !== 'Window',
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-zinc-100 flex items-center gap-2">
                SDI HARDWARE OUTPUT SETUP (CH {channelId})
              </h2>
              <p className="text-[11px] font-mono text-zinc-400">
                Blackmagic DeckLink & AJA KONA SDI Routing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 設定フォーム */}
        <div className="p-5 flex flex-col gap-4 text-xs font-mono">
          {/* ハードウェアブリッジ接続ステータス */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isBridgeConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <div>
                <span className="font-bold text-zinc-200">LOCAL HARDWARE BRIDGE:</span>
                <span className={`ml-2 font-bold ${isBridgeConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isBridgeConnected ? 'ONLINE (ACTIVE)' : 'STANDBY / DIRECT DISPLAY MODE'}
                </span>
              </div>
            </div>
          </div>

          {/* デバイスブランド選択 */}
          <div>
            <label className="text-zinc-400 font-bold block mb-1.5">OUTPUT HARDWARE INTERFACE:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Blackmagic DeckLink', 'AJA KONA', 'Window'] as HardwareDeviceBrand[]).map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleBrandChange(brand)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    draft.brand === brand
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <Cpu className="w-4 h-4 mb-0.5" />
                  <span className="font-bold text-[11px]">{brand}</span>
                </button>
              ))}
            </div>
          </div>

          {/* デバイスモデル & ポート */}
          {draft.brand !== 'Window' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 font-bold block mb-1">DEVICE MODEL:</label>
                <select
                  value={draft.model}
                  onChange={(e) => setDraft((prev) => ({ ...prev, model: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-200 font-mono outline-none focus:border-blue-500"
                >
                  {(draft.brand === 'Blackmagic DeckLink' ? DECKLINK_MODELS : AJA_KONA_MODELS).map(
                    (m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">SDI CONNECTOR / PORT:</label>
                <select
                  value={draft.port}
                  onChange={(e) => setDraft((prev) => ({ ...prev, port: parseInt(e.target.value, 10) }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-200 font-mono outline-none focus:border-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                    <option key={p} value={p}>
                      SDI Out {p} (Port {p})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ビデオ規格 & 色差フォーマット */}
          {draft.brand !== 'Window' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 font-bold block mb-1">VIDEO STANDARD:</label>
                <select
                  value={draft.videoStandard}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, videoStandard: e.target.value as VideoStandard }))
                  }
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-200 font-mono outline-none focus:border-blue-500"
                >
                  {VIDEO_STANDARDS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">SDI COLOR FORMAT:</label>
                <select
                  value={draft.colorFormat}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, colorFormat: e.target.value as SDIColorFormat }))
                  }
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-200 font-mono outline-none focus:border-blue-500"
                >
                  {SDI_COLOR_FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Genlock（同期信号） */}
          {draft.brand !== 'Window' && (
            <div>
              <label className="text-zinc-400 font-bold block mb-1">GENLOCK / REFERENCE:</label>
              <select
                value={draft.genlock}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, genlock: e.target.value as any }))
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-200 font-mono outline-none focus:border-blue-500"
              >
                <option value="Ref In">External Blackburst / Tri-Level Sync (Ref In)</option>
                <option value="Internal">Internal PTP / Free Run</option>
                <option value="Free Run">Auto Locking</option>
              </select>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-surface-border bg-surface">
          <div className="text-[11px] font-mono text-zinc-500">
            {draft.brand !== 'Window'
              ? `Target: ${draft.model} - Port ${draft.port}`
              : 'Target: Browser Output Window'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-bold text-xs transition"
            >
              CANCEL
            </button>
            <button
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs transition shadow-lg shadow-blue-500/20"
            >
              SAVE SETTINGS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
