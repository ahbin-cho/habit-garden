import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "습관 정원 · Habit Garden",
  description:
    "매일 물을 주며 키우는 나의 습관들. 오늘 내 정원엔 무엇이 자라고 무엇이 시들었을까?",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preload" href="/assets/garden-scene-bg.png" as="image" />
        <link rel="preload" href="/assets/garden-cat-mascot.png" as="image" />
        <link rel="preload" href="/assets/garden-cat-read.png" as="image" />
        <link rel="preload" href="/assets/garden-cat-stretch.png" as="image" />
        <link rel="preload" href="/assets/garden-cat-seeds.png" as="image" />
        <link rel="preload" href="/assets/garden-cat-tip.png" as="image" />
        <link rel="preload" href="/assets/seed-packet-button.png" as="image" />
        <link rel="preload" href="/assets/plant-stage-seed.png" as="image" />
        <link rel="preload" href="/assets/plant-stage-sprout.png" as="image" />
        <link rel="preload" href="/assets/plant-stage-leafy.png" as="image" />
        <link rel="preload" href="/assets/plant-stage-flower.png" as="image" />
        <link rel="preload" href="/assets/plant-stage-dry.png" as="image" />
      </head>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
