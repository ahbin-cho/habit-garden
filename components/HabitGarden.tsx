"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HABITS,
  IDENTITIES,
  STATE_META,
  buildDiagnosis,
  clearState,
  dateKey,
  getDailyQuestions,
  loadState,
  recentGrid,
  saveState,
  summarizeGarden,
  type CustomHabit,
  type GardenState,
  type HabitStatus
} from "@/lib/garden";

const GRID_DAYS = 21;
const PACKET_TILTS = [
  "-rotate-[1.2deg]",
  "rotate-[0.8deg]",
  "-rotate-[0.5deg]",
  "rotate-[1.1deg]",
  "-rotate-[0.9deg]",
  "rotate-[0.4deg]"
];

type GrowthPlant = "seed" | "sprout" | "leafy" | "flower" | "dry";

const PLANT_ASSETS: Record<GrowthPlant, string> = {
  seed: "/assets/plant-stage-seed.png",
  sprout: "/assets/plant-stage-sprout.png",
  leafy: "/assets/plant-stage-leafy.png",
  flower: "/assets/plant-stage-flower.png",
  dry: "/assets/plant-stage-dry.png"
};

function gridColor(ratio: number): string {
  if (ratio <= 0) return "bg-[#eee7da]";
  if (ratio < 0.34) return "bg-[#dce8bf]";
  if (ratio < 0.67) return "bg-[#abc985]";
  if (ratio < 1) return "bg-[#79aa69]";
  return "bg-[#4f8d60]";
}

function cleanHeadline(headline: string): string {
  return headline.replace(/[🌸🌿🍂]/g, "").trim();
}

function growthStage(st: HabitStatus): {
  label: string;
  plant: GrowthPlant;
  progress: number;
} {
  if (st.wateredToday && st.streak >= 21) {
    return { label: "꽃 피는 중", plant: "flower", progress: 100 };
  }
  if (st.wateredToday && st.streak >= 7) {
    return { label: "잎이 풍성해요", plant: "leafy", progress: 76 };
  }
  if (st.wateredToday) {
    return {
      label: "새싹 올라옴",
      plant: "sprout",
      progress: Math.max(36, st.automation)
    };
  }
  if (st.state === "wither" || st.state === "thirsty") {
    return {
      label: "물 기다림",
      plant: "dry",
      progress: Math.max(10, Math.min(30, st.automation))
    };
  }
  return { label: "씨앗 준비", plant: "seed", progress: 16 };
}

function statusTone(st: HabitStatus): {
  dot: string;
  card: string;
  label: string;
} {
  if (st.wateredToday) {
    return {
      dot: "bg-[#5f9867]",
      card: "border-[#bfd8b6] bg-[#f6fbef]",
      label: "text-[#4f8d60]"
    };
  }
  if (st.state === "wither" || st.state === "thirsty") {
    return {
      dot: "bg-[#c69351]",
      card: "border-[#ead0ab] bg-[#fff8ed]",
      label: "text-[#a36e36]"
    };
  }
  return {
    dot: "bg-[#cfc1a0]",
    card: "border-[#e8dece] bg-white",
    label: "text-[#7a705f]"
  };
}

const SUB_CATS = [
  "/assets/garden-cat-read.png",
  "/assets/garden-cat-stretch.png"
];

// Safe zones: areas that won't overlap with the center mascot.
// Each zone = { left: [min, max], top: [min, max] } in percent.
const SAFE_ZONES = [
  { left: [2, 15], top: [15, 50] }, // left-top
  { left: [2, 15], top: [45, 65] }, // left-bottom
  { left: [75, 88], top: [15, 50] }, // right-top
  { left: [75, 88], top: [45, 65] } // right-bottom
] as const;

function useRandomCatPositions(count: number) {
  return useMemo(() => {
    const zones = [...SAFE_ZONES];
    // Shuffle zones
    for (let i = zones.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [zones[i], zones[j]] = [zones[j], zones[i]];
    }
    return zones.slice(0, count).map((z) => ({
      left: z.left[0] + Math.random() * (z.left[1] - z.left[0]),
      top: z.top[0] + Math.random() * (z.top[1] - z.top[0])
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
}

function MascotScene({
  wateredCount,
  total
}: {
  wateredCount: number;
  total: number;
}) {
  const done = total > 0 && wateredCount === total;
  const catCount = total >= 3 ? 2 : total >= 2 ? 1 : 0;
  const positions = useRandomCatPositions(catCount);

  return (
    <div className="relative mx-auto mb-5 h-72 overflow-hidden rounded-[34px] border-2 border-[#dfd0b7] bg-[#fffaf0] shadow-[0_12px_28px_rgba(54,45,30,0.10)]">
      <img
        src="/assets/garden-scene-bg.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[#fff7df]/10" />
      <img
        src="/assets/garden-cat-mascot.png"
        alt=""
        className="absolute bottom-[-16px] left-1/2 h-[245px] w-[245px] -translate-x-1/2 object-contain drop-shadow-[0_20px_28px_rgba(54,45,30,0.18)]"
      />
      {positions.map((pos, i) => (
        <img
          key={SUB_CATS[i]}
          src={SUB_CATS[i]}
          alt=""
          className="absolute h-24 w-24 object-contain drop-shadow-[0_12px_16px_rgba(54,45,30,0.14)]"
          style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
        />
      ))}
      <div className="absolute left-5 top-5 rounded-full border border-[#e2d3b8] bg-[#fffaf0]/90 px-3 py-1.5 text-[12px] font-black text-[#6f6657] shadow-sm">
        {done
          ? "오늘 정원 완벽해요"
          : wateredCount > 0
            ? "조금씩 자라는 중"
            : "물 줄 시간이에요"}
      </div>
    </div>
  );
}

export default function HabitGarden() {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const [state, setState] = useState<GardenState | null>(null);
  const [editing, setEditing] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);

  useEffect(() => {
    setToday(new Date());
    setState(loadState());
    setMounted(true);
  }, []);

  const todayK = today ? dateKey(today) : "";

  const summary = useMemo(
    () => (state && today ? summarizeGarden(state, today) : null),
    [state, today]
  );
  const grid = useMemo(
    () => (state && today ? recentGrid(state, today, GRID_DAYS) : []),
    [state, today]
  );
  const dailyQuestions = useMemo(
    () => (today ? getDailyQuestions(today) : []),
    [today]
  );

  const toggleWater = (key: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const logs = { ...prev.logs };
      const day = { ...(logs[todayK] || {}) };
      if (day[key]) delete day[key];
      else day[key] = true;
      logs[todayK] = day;
      const next = { ...prev, logs };
      saveState(next);
      return next;
    });
  };

  const commitOnboard = (
    habitKeys: string[],
    identityKey: string,
    customHabits: CustomHabit[]
  ) => {
    setState((prev) => {
      const base: GardenState = prev ?? {
        version: 1,
        habitKeys: [],
        identityKey: "steady",
        logs: {},
        createdAt: new Date().toISOString()
      };
      const next: GardenState = {
        ...base,
        habitKeys,
        identityKey,
        customHabits: customHabits.length > 0 ? customHabits : undefined
      };
      saveState(next);
      return next;
    });
    setEditing(false);
  };

  const resetAll = () => {
    clearState();
    setState(null);
    setEditing(false);
    setDiagnosing(false);
  };

  const saveDiagnosis = (answers: number[]) => {
    setState((prev) => {
      if (!prev) return prev;
      const diagnoses = { ...(prev.diagnoses || {}) };
      diagnoses[todayK] = answers;
      const next = { ...prev, diagnoses };
      saveState(next);
      return next;
    });
    setDiagnosing(false);
  };

  if (!mounted || !today) {
    return (
      <div className="rounded-[32px] border border-[#e5dac8] bg-[#fffdf7] p-10 text-center shadow-[0_24px_60px_rgba(54,45,30,0.08)]">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#eadfce] border-t-[#6f9b62]" />
        <p className="mt-4 text-sm font-semibold text-gray-400">
          정원 문을 여는 중...
        </p>
      </div>
    );
  }

  if (!state || editing) {
    return (
      <Onboarding
        initialHabits={state?.habitKeys ?? []}
        initialIdentity={state?.identityKey ?? "steady"}
        initialCustomHabits={state?.customHabits ?? []}
        onDone={commitOnboard}
        onCancel={state ? () => setEditing(false) : undefined}
      />
    );
  }

  if (diagnosing) {
    return (
      <DiagnosisQuiz
        today={today}
        onDone={saveDiagnosis}
        onCancel={() => setDiagnosing(false)}
      />
    );
  }

  const s = summary!;
  const dateLabel = today.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short"
  });
  const thirsty = s.statuses.filter((st) => !st.wateredToday).length;
  const todaysDiagnosis = state.diagnoses?.[todayK];
  const diagnosis = todaysDiagnosis ? buildDiagnosis(todaysDiagnosis, dailyQuestions) : null;

  return (
    <div className="space-y-5">
      <section className="sketch-panel animate-fade-in-up overflow-hidden rounded-[34px] bg-[#fffdf7] shadow-[0_24px_70px_rgba(54,45,30,0.10)]">
        <div className="bg-[#f1eadc] px-3 py-5 text-center sm:px-5 sm:py-6">
          <MascotScene wateredCount={s.wateredCount} total={s.total} />
          <p className="text-xs font-bold text-[#8b806f]">
            오늘의 정원 · {dateLabel}
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#202722]">
            {cleanHeadline(s.headline)}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#6d6558]">
            정원사 고양이가 기록 중: 당신은 <b>{s.identityPhrase}</b>이 되어가는
            중
          </p>
          <div className="mx-auto mt-3 rounded-2xl border border-[#dfd2bd] bg-[#fffaf0]/78 px-4 py-3 text-left shadow-sm">
            <p className="text-[11px] font-black text-[#8b806f]">
              {s.identity.role} · {s.identity.reward}
            </p>
            <p className="mt-1 text-xs font-bold leading-relaxed text-[#5f634f]">
              {s.identity.nudge}
            </p>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <span className="rounded-full border border-[#d9d0bf] bg-[#fffdf7] px-3 py-1 text-xs font-bold text-[#5f634f]">
              연속 {s.gardenStreak}일
            </span>
            <span className="rounded-full border border-[#d9d0bf] bg-[#fffdf7] px-3 py-1 text-xs font-bold text-[#5f634f]">
              오늘 {s.wateredCount}/{s.total}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-[#faf6ed] px-3 py-3 text-center sm:px-5 sm:py-4">
          <div className="mini-sign px-2 py-3">
            <div className="mx-auto mb-2 h-2 w-8 rounded-full bg-[#7faa68]" />
            <div className="text-[11px] font-black text-gray-700">
              자란 습관
            </div>
            <div className="text-sm font-black text-[#4f8d60]">
              {s.wateredCount}개
            </div>
          </div>
          <div className="mini-sign px-2 py-3">
            <div className="mx-auto mb-2 h-2 w-8 rounded-full bg-[#c89b5a]" />
            <div className="text-[11px] font-black text-gray-700">
              목마른 화분
            </div>
            <div className="text-sm font-black text-[#a36e36]">{thirsty}개</div>
          </div>
          <div className="mini-sign px-2 py-3">
            <div className="mx-auto mb-2 h-2 w-8 rounded-full bg-[#8aa6bd]" />
            <div className="text-[11px] font-black text-gray-700">
              오늘 보상
            </div>
            <div className="text-sm font-black text-[#426f95]">
              {s.wateredCount > 0 ? "도착" : "대기"}
            </div>
          </div>
        </div>

        <div className="space-y-2.5 p-3 sm:p-5">
          <h3 className="text-sm font-extrabold text-gray-800">오늘의 화분</h3>
          {s.statuses.map((st) => {
            const meta = STATE_META[st.state];
            const tone = statusTone(st);
            const growth = growthStage(st);
            return (
              <div
                key={st.habit.key}
                className={`pot-row flex items-center gap-3 px-4 py-3 transition ${tone.card}`}
              >
                <div className="habit-plot shrink-0">
                  <img
                    src={PLANT_ASSETS[growth.plant]}
                    alt=""
                    className="habit-plant-img"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-bold text-gray-800">
                      {st.habit.label}
                    </span>
                    <span
                      className={`shrink-0 rounded-full bg-white/80 px-2 py-1 text-xs font-black ${tone.label}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-gray-400">
                    <span>
                      Lv.{Math.max(1, Math.floor(st.totalDays / 3) + 1)}
                    </span>
                    <span>·</span>
                    <span>{growth.label}</span>
                    <span>·</span>
                    <span>{st.streak}일 연속</span>
                    <span>·</span>
                    <span>최고 {st.bestStreak}일</span>
                  </div>
                  <div className="growth-track mt-2">
                    <span
                      className="growth-track__fill"
                      style={{ width: `${growth.progress}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => toggleWater(st.habit.key)}
                  aria-pressed={st.wateredToday}
                  className={`water-button shrink-0 px-4 py-2 text-sm font-bold transition active:scale-95 ${
                    st.wateredToday
                      ? "water-button--done text-white"
                      : "text-[#395d3d]"
                  }`}
                >
                  {st.wateredToday ? "완료" : "물주기"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
      <section className="sketch-panel animate-fade-in-up rounded-[28px] bg-[#fffdf7] p-3.5 shadow-sm sm:p-5">
        <div className="flex items-center gap-4">
          <img
            src="/assets/garden-cat-tip.png"
            alt=""
            className="h-24 w-24 shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <h3 className="mt-0.5 text-base font-black text-[#202722]">
              오늘 정원 스캔
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              {diagnosis
                ? diagnosis.gardenerTip
                : "아침 루틴, 잡초 습관, 보상, 무너지는 트리거를 보고 오늘의 정원 상태를 그려요."}
            </p>
          </div>
        </div>
        {diagnosis && (
          <div className="mt-4 grid gap-2">
            {diagnosis.spirits.slice(0, 3).map((sp) => (
              <div
                key={sp.spirit.key}
                className="rounded-2xl border border-[#e5dccd] bg-[#fffaf0] px-4 py-3 text-sm"
              >
                <b className="text-[#314235]">{sp.spirit.name}</b>
                <span className="ml-2 text-gray-500">{sp.reason}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setDiagnosing(true)}
          className="start-button start-button--ready mt-4 w-full rounded-2xl px-6 py-4 text-base font-bold text-white transition active:scale-[0.99]"
        >
          {diagnosis ? "오늘 스캔 다시하기" : "오늘 정원 스캔하기"}
        </button>
      </section>

      {s.prescriptionHabit && s.worst && !s.worst.wateredToday && (
        <section className="sketch-panel animate-fade-in-up rounded-[28px] bg-[#fffdf7] p-3.5 shadow-sm sm:p-5">
          <div className="flex gap-4">
            <img
              src="/assets/garden-cat-tip.png"
              alt=""
              className="h-24 w-24 shrink-0 object-contain"
            />
            <div>
              <h3 className="text-sm font-extrabold text-[#314235]">
                정원사 고양이의 한마디
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                <b>{s.prescriptionHabit.label}</b> 화분은 오늘 딱{" "}
                <b>{s.prescriptionHabit.tiny}</b>만 해도 충분해요.
              </p>
              <p className="mt-2 text-xs font-bold text-[#7d745f]">
                {s.prescriptionHabit.anchor}에 붙여두기
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="sketch-panel animate-fade-in-up rounded-[28px] bg-[#fffdf7] p-3.5 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-gray-800">
            21일 정원 기록
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <span>쉼</span>
            <span className="h-3 w-3 rounded-sm bg-[#eee7da]" />
            <span className="h-3 w-3 rounded-sm bg-[#dce8bf]" />
            <span className="h-3 w-3 rounded-sm bg-[#abc985]" />
            <span className="h-3 w-3 rounded-sm bg-[#79aa69]" />
            <span className="h-3 w-3 rounded-sm bg-[#4f8d60]" />
            <span>완료</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((g) => (
            <div
              key={g.key}
              title={`${g.key} · ${g.count}/${g.total}`}
              className={`aspect-square rounded-lg ${gridColor(g.ratio)} ${
                g.key === todayK ? "ring-2 ring-[#5f8f64] ring-offset-1" : ""
              }`}
            />
          ))}
        </div>
      </section>

      <div className="flex justify-center gap-4 pb-2 text-xs font-semibold text-gray-400">
        <button
          onClick={() => setEditing(true)}
          className="hover:text-[#5f8f64]"
        >
          습관 다시 심기
        </button>
        <button
          onClick={() => {
            if (confirm("모든 기록을 지우고 처음부터 다시 시작할까요?"))
              resetAll();
          }}
          className="hover:text-rose-500"
        >
          기록 지우기
        </button>
      </div>
    </div>
  );
}

function Onboarding({
  initialHabits,
  initialIdentity,
  initialCustomHabits,
  onDone,
  onCancel
}: {
  initialHabits: string[];
  initialIdentity: string;
  initialCustomHabits: CustomHabit[];
  onDone: (
    habitKeys: string[],
    identityKey: string,
    customHabits: CustomHabit[]
  ) => void;
  onCancel?: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(initialHabits);
  const [identity, setIdentity] = useState<string>(initialIdentity);
  const [customs, setCustoms] = useState<CustomHabit[]>(initialCustomHabits);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customAnchor, setCustomAnchor] = useState("");
  const [customTiny, setCustomTiny] = useState("");

  const toggle = (key: string) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 5) return prev;
      return [...prev, key];
    });
  };

  const addCustom = () => {
    if (!customLabel.trim()) return;
    const key = `custom_${Date.now()}`;
    const habit: CustomHabit = {
      key,
      label: customLabel.trim(),
      anchor: customAnchor.trim() || "하고 싶을 때",
      tiny: customTiny.trim() || "딱 1분만"
    };
    setCustoms((prev) => [...prev, habit]);
    setSelected((prev) => (prev.length >= 5 ? prev : [...prev, key]));
    setCustomLabel("");
    setCustomAnchor("");
    setCustomTiny("");
    setShowCustomForm(false);
  };

  const removeCustom = (key: string) => {
    setCustoms((prev) => prev.filter((c) => c.key !== key));
    setSelected((prev) => prev.filter((k) => k !== key));
  };

  const ready = selected.length >= 3;

  return (
    <div className="sketch-panel animate-fade-in-up space-y-6 rounded-[32px] bg-[#fffdf7] p-4 shadow-[0_24px_70px_rgba(54,45,30,0.10)] sm:p-8">
      <div className="text-center">
        <img
          src="/assets/garden-cat-seeds.png"
          alt="습관 정원 마스코트"
          className="mx-auto h-44 w-44 object-contain drop-shadow-[0_18px_24px_rgba(54,45,30,0.14)]"
        />
        <h2 className="mt-2 text-xl font-black text-gray-900">
          심을 습관을 골라주세요
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          3~5개 선택하거나 직접 만들어요. ({selected.length}/5)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {HABITS.map((h, idx) => {
          const on = selected.includes(h.key);
          return (
            <button
              key={h.key}
              onClick={() => toggle(h.key)}
              className={`seed-packet min-h-[132px] px-4 py-4 text-sm font-black transition-transform ${PACKET_TILTS[idx % PACKET_TILTS.length]} ${
                on ? "seed-packet--on text-[#26352a]" : "text-gray-700"
              }`}
            >
              {on && <span className="seed-packet__badge">심음</span>}
              <span className="relative z-10 block pt-11">{h.label}</span>
              <span className="relative z-10 mt-1 block text-[10px] font-black text-[#9a8d75]">
                seed no.{String(idx + 1).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>

      {/* 커스텀 습관 영역 */}
      <div>
        <h3 className="text-sm font-extrabold text-gray-800">
          직접 만든 습관
        </h3>
        {customs.length > 0 && (
          <div className="mt-2 space-y-2">
            {customs.map((c) => {
              const on = selected.includes(c.key);
              return (
                <div
                  key={c.key}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    on
                      ? "border-[#bfd8b6] bg-[#f6fbef]"
                      : "border-[#e8dece] bg-white"
                  }`}
                >
                  <button
                    onClick={() => toggle(c.key)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block text-sm font-bold text-gray-800">
                      {c.label}
                    </span>
                    <span className="block text-[11px] text-gray-400">
                      {c.anchor} · {c.tiny}
                    </span>
                  </button>
                  <button
                    onClick={() => removeCustom(c.key)}
                    className="shrink-0 text-xs font-bold text-gray-400 hover:text-rose-500"
                  >
                    삭제
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {showCustomForm ? (
          <div className="mt-3 space-y-2 rounded-2xl border border-[#e2d3b8] bg-[#fffaf0] p-4">
            <input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="습관 이름 (예: 명상)"
              className="w-full rounded-xl border border-[#e2d3b8] bg-white px-3 py-2.5 text-sm font-bold text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#5f8f64]"
            />
            <input
              value={customAnchor}
              onChange={(e) => setCustomAnchor(e.target.value)}
              placeholder="언제 할지 (예: 아침에 일어난 직후)"
              className="w-full rounded-xl border border-[#e2d3b8] bg-white px-3 py-2.5 text-sm font-bold text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#5f8f64]"
            />
            <input
              value={customTiny}
              onChange={(e) => setCustomTiny(e.target.value)}
              placeholder="최소 실천 (예: 딱 1분만)"
              className="w-full rounded-xl border border-[#e2d3b8] bg-white px-3 py-2.5 text-sm font-bold text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#5f8f64]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 transition hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={addCustom}
                disabled={!customLabel.trim()}
                className="flex-1 rounded-xl bg-[#5f8f64] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#548a59] disabled:opacity-40"
              >
                추가하기
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomForm(true)}
            disabled={selected.length >= 5}
            className="mt-3 w-full rounded-2xl border-2 border-dashed border-[#d9d0bf] px-4 py-3 text-sm font-bold text-[#8b806f] transition hover:border-[#5f8f64] hover:text-[#5f8f64] disabled:opacity-40"
          >
            + 직접 만들기
          </button>
        )}
      </div>

      <div>
        <h3 className="text-sm font-extrabold text-gray-800">
          이 정원을 가꾸는 나는
        </h3>
        <p className="mt-1 text-xs font-bold leading-relaxed text-[#8b806f]">
          선택한 정원사 유형에 따라 오늘 문장, 보상 이름, 추천 말투가 달라져요.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {IDENTITIES.map((i, idx) => {
            const on = identity === i.key;
            return (
              <button
                key={i.key}
                onClick={() => setIdentity(i.key)}
                className={`identity-card min-h-[112px] px-4 py-4 text-left transition-transform ${PACKET_TILTS[idx % PACKET_TILTS.length]} ${
                  on ? "identity-card--on text-[#26352a]" : "text-gray-700"
                }`}
              >
                <span className="identity-card__pin" />
                {on && <span className="identity-card__badge">선택됨</span>}
                <span className="relative z-10 block text-sm font-black">
                  {i.label}
                </span>
                <span className="relative z-10 mt-1 block text-[11px] font-black text-[#6f6657]">
                  {i.role} · {i.reward}
                </span>
                <span className="relative z-10 mt-2 block text-[11px] font-bold leading-relaxed text-[#8b806f]">
                  {i.cardHint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="secondary-button px-5 py-4 text-base font-bold text-gray-600 transition"
          >
            닫기
          </button>
        )}
        <button
          disabled={!ready}
          onClick={() => onDone(selected, identity, customs)}
          className={`start-button flex-1 rounded-2xl px-6 py-4 text-base font-bold text-white transition ${
            ready
              ? "start-button--ready active:scale-[0.99]"
              : "cursor-not-allowed opacity-50"
          }`}
        >
          {ready
            ? "정원 시작하기"
            : `${Math.max(0, 3 - selected.length)}개 더 골라주세요`}
        </button>
      </div>
    </div>
  );
}

function DiagnosisQuiz({
  today,
  onDone,
  onCancel
}: {
  today: Date;
  onDone: (answers: number[]) => void;
  onCancel: () => void;
}) {
  const questions = useMemo(() => getDailyQuestions(today), [today]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const question = questions[step];
  const total = questions.length;
  const progress = Math.round(((step + 1) / total) * 100);

  const choose = (idx: number) => {
    const next = [...answers];
    next[step] = idx;
    setAnswers(next);
    if (step + 1 >= total) onDone(next);
    else setStep(step + 1);
  };

  return (
    <div className="sketch-panel animate-fade-in-up overflow-hidden rounded-[32px] bg-[#fffdf7] shadow-[0_24px_70px_rgba(54,45,30,0.10)]">
      <div className="relative bg-[#f1eadc] px-6 py-6">
        <img
          src="/assets/garden-cat-tip.png"
          alt=""
          className="absolute right-4 top-1 h-28 w-28 object-contain opacity-95"
        />
        <p className="text-xs font-black text-[#8b806f]">
          오늘 정원 스캔 {step + 1}/{total}
        </p>
        <h2 className="mt-2 max-w-[360px] text-xl font-black leading-snug text-[#202722]">
          {question.prompt}
        </h2>
        <div className="mt-5 h-3 overflow-hidden rounded-full border border-[#d9d0bf] bg-[#fffdf7]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#abc985] to-[#5f8f64] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3 p-5">
        {question.options.map((option, idx) => (
          <button
            key={option.label}
            onClick={() => choose(idx)}
            className={`quiz-option px-5 py-4 text-left text-sm font-black text-gray-700 transition ${PACKET_TILTS[idx % PACKET_TILTS.length]}`}
          >
            <span className="quiz-option__seed" />
            <span className="relative z-10 block">{option.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-5 pb-5">
        <button
          onClick={() => setStep((prev) => Math.max(0, prev - 1))}
          disabled={step === 0}
          className="secondary-button px-5 py-3 text-sm font-bold text-gray-500 disabled:opacity-40"
        >
          이전
        </button>
        <button
          onClick={onCancel}
          className="secondary-button px-5 py-3 text-sm font-bold text-gray-500"
        >
          나중에
        </button>
      </div>
    </div>
  );
}
