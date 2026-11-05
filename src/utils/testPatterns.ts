// テストパターン生成用ユーティリティ

export function createSMPTEColorBars(width = 1280, height = 720): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const topH = height * 0.67;
  const midH = height * 0.08;
  const botH = height * 0.25;

  // 上段: 7本のカラーバー (75% Gray, Yellow, Cyan, Green, Magenta, Red, Blue)
  const topColors = [
    '#BFBFBF', // 75% White
    '#BFBF00', // 75% Yellow
    '#00BFBF', // 75% Cyan
    '#00BF00', // 75% Green
    '#BF00BF', // 75% Magenta
    '#BF0000', // 75% Red
    '#0000BF', // 75% Blue
  ];
  const barW = width / 7;
  topColors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i * barW, 0, barW, topH);
  });

  // 中段: 交互の補色バー (Blue, Black, Magenta, Black, Cyan, Black, Gray)
  const midColors = [
    '#0000BF',
    '#131313',
    '#BF00BF',
    '#131313',
    '#00BFBF',
    '#131313',
    '#BFBFBF',
  ];
  midColors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i * barW, topH, barW, midH);
  });

  // 下段: I, White 100%, Q, Black (PLUGE: -2%, 0%, +2%), Black
  const botY = topH + midH;
  // I signal
  ctx.fillStyle = '#00214C';
  ctx.fillRect(0, botY, barW * 1.25, botH);

  // 100% White
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(barW * 1.25, botY, barW * 1.25, botH);

  // Q signal
  ctx.fillStyle = '#32006A';
  ctx.fillRect(barW * 2.5, botY, barW * 1.25, botH);

  // Black
  ctx.fillStyle = '#131313';
  ctx.fillRect(barW * 3.75, botY, barW * 1.25, botH);

  // PLUGE pulses
  const plugeStartX = barW * 5;
  const plugeW = barW * 2;
  ctx.fillStyle = '#131313';
  ctx.fillRect(plugeStartX, botY, plugeW, botH);

  const subW = plugeW / 3;
  ctx.fillStyle = '#080808'; // -2% Superblack
  ctx.fillRect(plugeStartX, botY, subW, botH);
  ctx.fillStyle = '#131313'; // 0% Black
  ctx.fillRect(plugeStartX + subW, botY, subW, botH);
  ctx.fillStyle = '#1F1F1F'; // +2% Above Black
  ctx.fillRect(plugeStartX + subW * 2, botY, subW, botH);

  return canvas.toDataURL('image/png');
}

export function createColorGradient(width = 1280, height = 720): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#ff0055');
  grad.addColorStop(0.3, '#7928ca');
  grad.addColorStop(0.6, '#0070f3');
  grad.addColorStop(1, '#00dfd8');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // テキスト
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VIDEO TEST GRADIENT (1080p)', width / 2, height / 2);

  return canvas.toDataURL('image/png');
}

// 1kHz テストトーン（SMPTEカラーバー用）の音声Blob URLを生成
export function create1kHzTestToneBlob(durationSec = 10): string {
  if (typeof window === 'undefined') return '';
  const sampleRate = 44100;
  const numSamples = sampleRate * durationSec;
  const buffer = new Float32Array(numSamples);
  const freq = 1000; // 1kHz

  // -20dBFS (放送標準ラインレベル) = 10^(-20/20) = 0.1
  const amplitude = 0.1;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    buffer[i] = Math.sin(2 * Math.PI * freq * t) * amplitude;
  }

  // WAVヘッダー作成
  const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 for Mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // PCMサンプルの書き込み
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
