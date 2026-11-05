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
  instanceId: string;
  mediaId: string;
  name: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  duration: number;
}

export type HardwareDeviceBrand = 'Window' | 'Blackmagic DeckLink' | 'AJA KONA';
export type VideoStandard = '1080p59.94' | '1080p60' | '1080i59.94' | '2160p59.94' | '720p59.94';
export type SDIColorFormat = '10-bit YUV 4:2:2' | '8-bit YUV 4:2:2' | 'RGB 4:4:4';

export interface HardwareOutputConfig {
  enabled: boolean;
  brand: HardwareDeviceBrand;
  model: string; // e.g. 'DeckLink Duo 2 (SDI 1)', 'AJA KONA 5 (SDI Out 1)'
  port: number; // 1, 2, 3, 4
  videoStandard: VideoStandard;
  colorFormat: SDIColorFormat;
  status: 'offline' | 'standby' | 'active' | 'error';
  genlock: 'Free Run' | 'Ref In' | 'Internal';
}

export interface OutputChannelState {
  id: number; // 1, 2, 3, 4
  name: string;
  assignedMediaId: string | null;
  playlist: TimelineClip[];
  activeClipIndex: number;
  autoAdvance: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoop: boolean;
  isBlackout: boolean;
  aspectRatio: 'contain' | 'cover' | 'fill';
  targetWindowId: number;
  hardwareOutput: HardwareOutputConfig;
}

export interface BroadcastMessage {
  type: 'SYNC_STATE' | 'PLAY' | 'PAUSE' | 'SEEK' | 'ASSIGN' | 'SET_VOLUME' | 'BLACKOUT' | 'NEXT_CLIP' | 'HARDWARE_CONFIG';
  channelId: number;
  payload?: any;
  timestamp: number;
}
