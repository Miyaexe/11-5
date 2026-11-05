export type MediaType = 'video' | 'image' | 'test-pattern' | 'live-camera';

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  duration?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  stream?: MediaStream;
  fileSize?: string;
  format?: string;
}

export interface TimelineClip {
  instanceId: string; // タイムライン上のユニークID
  mediaId: string;
  name: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  duration: number; // 秒数（動画の長さ、静止画はデフォルト5秒など）
}

export interface OutputChannelState {
  id: number; // 1, 2, 3, 4
  name: string;
  assignedMediaId: string | null;
  playlist: TimelineClip[];
  activeClipIndex: number;
  autoAdvance: boolean; // 次のクリップへ自動遷移するか
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 1
  isMuted: boolean;
  isLoop: boolean;
  isBlackout: boolean; // FTB (Fade to black)
  aspectRatio: 'contain' | 'cover' | 'fill';
  targetWindowId: number; // 送出先ウィンドウ番号 (1〜4)
}

export interface BroadcastMessage {
  type: 'SYNC_STATE' | 'PLAY' | 'PAUSE' | 'SEEK' | 'ASSIGN' | 'SET_VOLUME' | 'BLACKOUT' | 'NEXT_CLIP' | 'SWITCH_CHANNEL';
  channelId: number;
  payload?: any;
  timestamp: number;
}
