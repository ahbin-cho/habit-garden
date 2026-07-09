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
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
