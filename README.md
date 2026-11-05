# 🎥 Pro Video Playout & Multiview System

Vercelに直接デプロイ可能な、Web技術（Next.js + React + WebGL + Web Audio API）によるプロフェッショナル向けマルチチャンネル映像送出・監視システム。

![Broadcasting Dark Theme](https://img.shields.io/badge/Platform-Vercel%20%2F%20Web-000000?style=flat-square&logo=vercel)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwind-css)

---

## 🌟 主な機能

### 1. 映像素材の取り込み（Media Pool）
- **ローカル動画・静止画の取り込み**: MP4, WebM, MOV, PNG, JPG などをドラッグ＆ドロップまたはファイル選択で一括追加
- **内蔵テストパターン**: SMPTE 75% カラーバー（1kHz テストトーン付き）、フルスペクトラムグラデーション
- **ライブ映像入力**: Webカメラ、HDMIキャプチャカード、USBキャプチャデバイスからのリアルタイム映像取り込み（`getUserMedia`）
- **ワンクリックマトリクスルーティング**: 素材カードの `CH1` 〜 `CH4` ボタンを押すだけで対象チャンネルへ瞬時に送出割り当て

### 2. 1〜4つの個別アウトプット（Output Channels 1 ~ 4）
- **独立プレビュー＆コントロール**: 4チャンネルそれぞれで再生・一時停止・先頭戻し・ループ・音量調整・シークが可能
- **FTB (Fade To Black)**: 現場での緊急停止や演出切り替え用のワンタッチ黒フェードアウト機能
- **個別ウィンドウ送出（ポップアウト）**:
  - `CH1`〜`CH4` の専用アウトプットウィンドウ（`/output/1` 〜 `/output/4`）をポップアップ生成
  - プロジェクターや外部サブモニターへ配置してダブルクリックでクリーンな全画面送出が可能
  - `BroadcastChannel` によるメインコントローラーと出力ウィンドウ間の超低遅延（ミリ秒未満）双方向同期
- **マルチモニター検出（Window Management API）**: 接続されている外部ディスプレイを自動検出し、対象ディスプレイへ全画面ウィンドウを直接展開

### 3. ベクトルスコープ（Vectorscope）
- **高精度リアルタイム色差解析**: 映像フレームから Y, Cb (B-Y), Cr (R-Y) をサンプリングして円形スコープ上にプロット
- **SMPTE レティクル**: Rec.709 / Rec.601 準拠の 75% カラーターゲット（Red, Magenta, Blue, Cyan, Green, Yellow）のボックス表示
- **スキントーンライン（I軸 / Q軸）**: 人物の肌色調整のための基準ガイドライン（123°）
- **オシロ管面エフェクト**: 燐光グリーン（Phosphor Green）、アンバー（Amber）、シアン（Cyan）、実色（True Color）のカラーモード切替
- **ゲイン調整**: 0.5x 〜 4.0x のズームイン/アウト

### 4. オーディオモニター（Audio Monitor）
- **デュアルチャンネル（L / R）**: Web Audio API（`AnalyserNode`）によるリアルタイム RMS & ピーク音量解析
- **dBFS スケール**: -inf 〜 0dB の正確なデシベル表示
- **Peak Hold & クリップ検知**: 最大音量を一定時間維持するピークバー、および 0dB 到達時に赤く点灯する CLIP インジケーター
- **モニター音声制御**: モニター音声のワンクリック LIVE / MUTED 切替

---

## 🚀 ローカル起動方法

```bash
# 開発サーバー起動
npm run dev
```
ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## 🌐 Vercelへのデプロイ方法

### 方法A: GitHub経由（おすすめ）
1. 本フォルダのコードを GitHub リポジトリにプッシュします。
2. [Vercel](https://vercel.com) にログインし、「**Add New... > Project**」を選択します。
3. リポジトリを選択し、「**Deploy**」ボタンをクリックするだけで、数十秒で全世界へ公開されます。

### 方法B: Vercel CLI を使って直接デプロイ
```bash
# Vercel CLI の実行
npx vercel
```
対話形式のプロンプトに沿って設定を完了すると、ワンコマンドで即座に本番URLが発行されます。
