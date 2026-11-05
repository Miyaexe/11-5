import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pro Video Playout & Multiview System",
  description: "Web-based multi-channel video playout with vectorscope and audio monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className="bg-background text-zinc-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
