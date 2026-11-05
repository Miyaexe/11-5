// Blackmagic Design DeckLink & AJA KONA ハードウェア送出マネージャー
import { HardwareOutputConfig, VideoStandard, SDIColorFormat } from '@/types';

export const DECKLINK_MODELS = [
  'DeckLink Duo 2',
  'DeckLink Quad 2',
  'DeckLink 8K Pro',
  'DeckLink 4K Extreme 12G',
  'DeckLink Mini Monitor 4K',
  'DeckLink Studio 4K',
  'UltraStudio 4K Mini',
];

export const AJA_KONA_MODELS = [
  'AJA KONA 5 (12G-SDI)',
  'AJA KONA 4 (3G-SDI)',
  'AJA KONA IP (SMPTE 2110)',
  'AJA KONA 1 (3G-SDI)',
  'AJA Io 4K Plus',
  'AJA T-TAP Pro',
];

export const VIDEO_STANDARDS: VideoStandard[] = [
  '1080p59.94',
  '1080p60',
  '1080i59.94',
  '2160p59.94',
  '720p59.94',
];

export const SDI_COLOR_FORMATS: SDIColorFormat[] = [
  '10-bit YUV 4:2:2',
  '8-bit YUV 4:2:2',
  'RGB 4:4:4',
];

class HardwareBridgeManager {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private listeners: ((connected: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initWebSocket();
    }
  }

  private initWebSocket() {
    try {
      this.ws = new WebSocket('ws://localhost:9998');
      this.ws.onopen = () => {
        this.isConnected = true;
        this.notify(true);
      };
      this.ws.onclose = () => {
        this.isConnected = false;
        this.notify(false);
        // 5秒ごとに再接続試行
        setTimeout(() => this.initWebSocket(), 5000);
      };
      this.ws.onerror = () => {
        this.isConnected = false;
        this.notify(false);
      };
    } catch (e) {
      this.isConnected = false;
    }
  }

  public subscribe(callback: (connected: boolean) => void) {
    this.listeners.push(callback);
    callback(this.isConnected);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(connected: boolean) {
    this.listeners.forEach((l) => l(connected));
  }

  public sendHardwareConfig(channelId: number, config: HardwareOutputConfig) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          action: 'SET_CONFIG',
          channelId,
          config,
          timestamp: Date.now(),
        })
      );
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const hardwareBridge =
  typeof window !== 'undefined' ? new HardwareBridgeManager() : ({} as HardwareBridgeManager);
