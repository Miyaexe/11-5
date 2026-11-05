// Web Audio API マネージャー

export interface AudioMetrics {
  peakL: number; // dBFS (-inf to 0)
  peakR: number;
  rmsL: number;
  rmsR: number;
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private elementMap = new Map<
    HTMLMediaElement,
    {
      source: MediaElementAudioSourceNode;
      splitter: ChannelSplitterNode;
      analyserL: AnalyserNode;
      analyserR: AnalyserNode;
      gainNode: GainNode;
    }
  >();

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public registerMediaElement(el: HTMLMediaElement) {
    if (this.elementMap.has(el)) return;

    try {
      const ctx = this.getContext();
      const source = ctx.createMediaElementSource(el);
      const splitter = ctx.createChannelSplitter(2);
      const analyserL = ctx.createAnalyser();
      const analyserR = ctx.createAnalyser();
      const gainNode = ctx.createGain();

      analyserL.fftSize = 1024;
      analyserR.fftSize = 1024;
      analyserL.smoothingTimeConstant = 0.6;
      analyserR.smoothingTimeConstant = 0.6;

      source.connect(splitter);
      splitter.connect(analyserL, 0); // Left channel
      splitter.connect(analyserR, 1); // Right channel

      // スピーカー出力へ
      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      this.elementMap.set(el, { source, splitter, analyserL, analyserR, gainNode });
    } catch (e) {
      // 既に接続済み等の例外ハンドリング
      console.warn("AudioManager registerMediaElement:", e);
    }
  }

  public setVolume(el: HTMLMediaElement, volume: number) {
    const entry = this.elementMap.get(el);
    if (entry) {
      entry.gainNode.gain.value = volume;
    }
  }

  public getMetrics(el: HTMLMediaElement): AudioMetrics {
    const entry = this.elementMap.get(el);
    if (!entry) {
      return { peakL: -Infinity, peakR: -Infinity, rmsL: -Infinity, rmsR: -Infinity };
    }

    const { analyserL, analyserR } = entry;
    const bufL = new Float32Array(analyserL.fftSize);
    const bufR = new Float32Array(analyserR.fftSize);
    analyserL.getFloatTimeDomainData(bufL);
    analyserR.getFloatTimeDomainData(bufR);

    return {
      peakL: this.calcPeakDb(bufL),
      peakR: this.calcPeakDb(bufR),
      rmsL: this.calcRmsDb(bufL),
      rmsR: this.calcRmsDb(bufR),
    };
  }

  private calcPeakDb(buffer: Float32Array): number {
    let max = 0;
    for (let i = 0; i < buffer.length; i++) {
      const abs = Math.abs(buffer[i]);
      if (abs > max) max = abs;
    }
    if (max <= 0.0001) return -100;
    return 20 * Math.log10(max);
  }

  private calcRmsDb(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);
    if (rms <= 0.0001) return -100;
    return 20 * Math.log10(rms);
  }
}

export const audioManager = typeof window !== 'undefined' ? new AudioManager() : ({} as AudioManager);
