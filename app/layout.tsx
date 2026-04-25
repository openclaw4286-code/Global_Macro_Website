import type { Metadata } from "next";
import localFont from "next/font/local";
import "../908-doha-ui/styles/908-doha.tokens.css";
import "./globals.css";

const pretendard = localFont({
  src: [
    { path: "../908-doha-ui/fonts/Pretendard-Regular.otf", weight: "400", style: "normal" },
    { path: "../908-doha-ui/fonts/Pretendard-Medium.otf", weight: "500", style: "normal" },
    { path: "../908-doha-ui/fonts/Pretendard-SemiBold.otf", weight: "600", style: "normal" },
    { path: "../908-doha-ui/fonts/Pretendard-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export const metadata: Metadata = {
  title: "macromap",
  description: "매크로경제 학습 사이트",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="font-sans bg-bg text-fg min-h-screen antialiased">{children}</body>
    </html>
  );
}
