import HabitGarden from "@/components/HabitGarden";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f7f3ea] px-2.5 py-4 sm:px-4 sm:py-9">
      <div className="mx-auto max-w-xl">
        <header className="mb-5 text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-[#e1d8ca] bg-[#fffdf7] px-3 py-1.5 text-[11px] font-black text-[#7d745f] shadow-sm">
            <span>Habit Garden</span>
          </div>
          <h1 className="text-[34px] font-black leading-tight tracking-tight text-gray-900 sm:text-4xl">
            습관 정원
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-gray-600">
            오늘의 습관을 작은 화분으로 살펴보고, 필요한 만큼만 물을 주는 조용한
            정원 실험.
          </p>
        </header>
        <HabitGarden />
        <p className="mt-8 text-center text-xs text-gray-400">
          고양이 정원사가 오늘의 기록을 이 기기에만 보관해요
        </p>
      </div>
    </div>
  );
}
