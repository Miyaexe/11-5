// 複数ウィンドウ間（Controller ↔ Output Window）の超低遅延同期マネージャー
import { BroadcastMessage } from '@/types';

const CHANNEL_NAME = 'video_playout_broadcast_v1';

export class SyncChannel {
  private channel: BroadcastChannel | null = null;
  private listeners: ((msg: BroadcastMessage) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        this.listeners.forEach((fn) => fn(event.data));
      };
    }
  }

  public send(type: BroadcastMessage['type'], channelId: number, payload?: any) {
    if (!this.channel) return;
    const msg: BroadcastMessage = {
      type,
      channelId,
      payload,
      timestamp: Date.now(),
    };
    this.channel.postMessage(msg);
  }

  public subscribe(fn: (msg: BroadcastMessage) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public close() {
    this.channel?.close();
  }
}

export const syncChannel = typeof window !== 'undefined' ? new SyncChannel() : ({} as SyncChannel);
