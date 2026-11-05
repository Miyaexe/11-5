# 🎥 Pro Video Playout & Multiview System

Vercelに直接デプロイ可能な、Web技術（Next.js + React + WebGL + Web Audio API）によるプロフェッショナル向けマルチチャンネル映像送出・監視システム。
**Blackmagic Design DeckLinkシリーズ** および **AJA KONAシリーズ** のSDI/HDMI送出アーキテクチャに対応。

![Broadcasting Dark Theme](https://img.shields.io/badge/Platform-Vercel%20%2F%20Web-000000?style=flat-square&logo=vercel)
![DeckLink Support](https://img.shields.io/badge/Blackmagic-DeckLink%20SDI-blue?style=flat-square)
![AJA Support](https://img.shields.io/badge/AJA-KONA%20SDI-red?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)

---

## 🌟 主な機能

### 1. 放送用ハードウェア送出（Blackmagic DeckLink ＆ AJA KONA 対応）
- **Blackmagic Design DeckLink**:
  - 対応モデル: DeckLink Duo 2, Quad 2, 8K Pro, 4K Extreme 12G, Mini Monitor 4K, UltraStudio 4K Mini 等
  - 各アウトプットから独立した SDI 1〜4 ポートへ直接ルーティング
- **AJA KONA**:
  - 対応モデル: AJA KONA 5 (12G-SDI), KONA 4 (3G-SDI), KONA IP (SMPTE 2110), KONA 1, Io 4K Plus 等
  - 独立した SDI Out 1〜4 ポートへ割り当て
- **放送規格・色差フォーマット設定**:
  - ビデオ規格: 1080p59.94, 1080p60, 1080i59.94, 2160p59.94 (4K), 720p59.94
  - ピクセルフォーマット: 10-bit YUV 4:2:2（放送マスター標準）, 8-bit YUV 4:2:2, RGB 4:4:4
  - 外部同期（Genlock）: Ref In（BB / 三値シンク）, Internal, Free Run
- **ローカルハードウェアブリッジ**:
  PCローカルに搭載されたDeckLink / AJAカードとWebコントローラーを仲介する `bridge/decklink-aja-bridge.js` を同梱。

### 2. アウトプットごとのシーケンス・タイムライン（ドラッグ＆ドロップ対応）
- 各アウトプット（CH 1 〜 CH 4）に専用のタイムラインレーンを搭載。
- メディアプール内の動画・画像をドラッグ＆ドロップで追加し、プレイリスト形式で連続送出可能。
- AUTO ADVANCE（次クリップへの自動切り替え）ON/OFF機能。

### 3. 大型・線表示ベクトルスコープ（Large Trace Scope）
- 直径約190pxの大型円形管面オシロスコープ。
- 電子ビームが走る滑らかな「線表示（Vector Trace Line）」描画。
- 75% SMPTEカラーボックス（R, G, B, Cy, Mg, Yl）、スキントーンライン（I軸）、4色フォスファー切替。

### 4. 横向きオーディオメーター（Horizontal PPM / VU Meter）
- L / R ステレオチャンネルの横型LEDセグメントバー。
- -48dB 〜 0dBFS 目盛り、Peak Hold、CLIP OVER 警告ランプ。

### 5. 任意アウトプット先セレクター
- 送出先ウィンドウ番号（Window 1〜4）を任意に選択可能。
- ポップアップした送出ウィンドウ側でも、画面上部のメニューから表示するチャンネル（CH 1〜4）をいつでもワンタッチ切替可能。

---

## 🚀 ローカル起動方法

```bash
# 開発サーバー起動
npm run dev
```
ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### DeckLink / AJA 実機カード送出ブリッジの起動（任意）
```bash
node bridge/decklink-aja-bridge.js
```
