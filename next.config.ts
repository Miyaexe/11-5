import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // 複数のMediaStream / WebAudioの初期化制御を簡潔にするため
};

export default nextConfig;
