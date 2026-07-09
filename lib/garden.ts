// ───────────────────────────────────────────────────────────
//  습관 정원 (Habit Garden) — 데일리 트래커 로직 & 데이터
//  매일 '물주기' 체크인 → 날짜 기준 연속일(streak)이 실제로 누적/리셋.
//  행동과학(습관 쌓기 / 2분 규칙 / 신호-루틴-보상 / 정체성 / 자동화 66일)
//  근거. 저장은 localStorage. AI 없이 완결.
// ───────────────────────────────────────────────────────────

export type Habit = {
  key: string;
  label: string;
  emoji: string;
  anchor: string; // 습관 쌓기 앵커(After X → Y)
  tiny: string; // 2분 규칙: 최소 실천
  reward: string; // 즉각 보상
  cue: string; // 환경 신호 배치
};

export const HABITS: Habit[] = [
  { key: "water", label: "물 마시기", emoji: "💧", anchor: "책상에 앉은 직후", tiny: "딱 한 모금", reward: "시원한 개운함", cue: "물병을 모니터 옆 눈높이에" },
  { key: "stretch", label: "스트레칭", emoji: "🤸", anchor: "알람을 끈 직후", tiny: "목·어깨 10초", reward: "몸이 풀리는 느낌", cue: "머리맡에 밴드를 둔다" },
  { key: "read", label: "독서", emoji: "📖", anchor: "불을 끄기 직전", tiny: "딱 한 페이지", reward: "'오늘도 읽었다'", cue: "베개 위에 책을 펼쳐 둔다" },
  { key: "sleep", label: "일찍 자기", emoji: "🌙", anchor: "23시 알림 직후", tiny: "10분 일찍 눕기", reward: "다음 날 컨디션", cue: "폰 충전기를 침대 두 걸음 밖에" },
  { key: "walk", label: "산책", emoji: "🚶", anchor: "점심 직후", tiny: "건물 한 바퀴", reward: "햇빛 + 환기", cue: "신발을 현관 정중앙에" },
  { key: "diary", label: "감사일기", emoji: "📔", anchor: "이불에 들어간 직후", tiny: "감사 한 줄", reward: "하루가 정리되는 안도", cue: "머리맡에 펜·노트를" },
  { key: "nophone", label: "폰 덜 보기", emoji: "📵", anchor: "식사를 시작할 때", tiny: "화면 뒤집기", reward: "온전한 몰입", cue: "화면을 흑백 모드로" },
  { key: "workout", label: "운동", emoji: "🏋️", anchor: "퇴근 후 옷 갈아입기 전", tiny: "스쿼트 5개", reward: "성취 + 개운함", cue: "운동복을 전날 밤 꺼내 둔다" },
  { key: "study", label: "공부", emoji: "📚", anchor: "아침 커피 내리는 동안", tiny: "5분 타이머", reward: "작은 진전", cue: "책을 펼친 채 덮어둔다" },
  { key: "clean", label: "정리정돈", emoji: "🧹", anchor: "잠들기 전 알람 맞춘 직후", tiny: "물건 3개 제자리", reward: "깔끔한 아침", cue: "정리함을 손 닿는 곳에" },
];

export const HABIT_MAP: Record<string, Habit> = Object.fromEntries(
  HABITS.map((h) => [h.key, h])
);

/** 프리셋 + 커스텀 습관을 합친 조회 맵 */
export function buildHabitMap(state: GardenState): Record<string, Habit> {
  const map = { ...HABIT_MAP };
  for (const c of state.customHabits ?? []) {
    if (!map[c.key]) {
      map[c.key] = {
        key: c.key,
        label: c.label,
        emoji: "🌱",
        anchor: c.anchor,
        tiny: c.tiny,
        reward: "작은 성취감",
        cue: "눈에 보이는 곳에 메모",
      };
    }
  }
  return map;
}

export type Identity = {
  key: string;
  label: string;
  phrase: string;
  role: string;
  nudge: string;
  reward: string;
  cardHint: string;
};

export const IDENTITIES: Identity[] = [
  {
    key: "healthy",
    label: "건강을 챙기는 사람",
    phrase: "몸을 돌볼 줄 아는 사람",
    role: "몸 정원사",
    nudge: "컨디션이 먼저라서, 오늘은 가장 작은 몸 루틴부터 물 줘요.",
    reward: "개운함 보상",
    cardHint: "건강 습관 팁이 먼저 떠요",
  },
  {
    key: "steady",
    label: "꾸준한 사람",
    phrase: "매일 한 걸음씩 나아가는 사람",
    role: "출석 정원사",
    nudge: "완벽보다 출석. 하나만 살려도 정원은 계속 이어져요.",
    reward: "연속 성장 보상",
    cardHint: "스트릭과 작은 완료를 강조해요",
  },
  {
    key: "selfcare",
    label: "나를 아끼는 사람",
    phrase: "스스로를 다정히 대하는 사람",
    role: "다정 정원사",
    nudge: "시든 화분도 혼내지 말고, 물 한 모금만 다시 줘요.",
    reward: "다정한 휴식 보상",
    cardHint: "쉬운 재시작 문구가 많아요",
  },
  {
    key: "growth",
    label: "성장하는 사람",
    phrase: "어제보다 조금 더 나아지는 사람",
    role: "실험 정원사",
    nudge: "오늘의 1cm를 기록해요. 작은 변화가 다음 재배 계획이 돼요.",
    reward: "성장 기록 보상",
    cardHint: "성장 단계와 실험 기록을 강조해요",
  },
];

// ── 저장 모델 ──────────────────────────────────────────────
export type CustomHabit = {
  key: string;
  label: string;
  anchor: string;
  tiny: string;
};

export type GardenState = {
  version: 1;
  habitKeys: string[];
  identityKey: string;
  customHabits?: CustomHabit[];
  // logs["2026-07-09"] = { water: true, read: true }
  logs: Record<string, Record<string, boolean>>;
  // 오늘의 정원 진단 답변(하루 1회). diagnoses["2026-07-09"] = [0,2,1,...]
  diagnoses?: Record<string, number[]>;
  createdAt: string;
};

const STORAGE_KEY = "habit-garden:v1";

export function loadState(): GardenState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GardenState;
    if (!parsed.habitKeys) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state: GardenState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 저장 실패는 조용히 무시 */
  }
}

export function clearState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

// ── 날짜 유틸(로컬 타임존) ─────────────────────────────────
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}

// ── 식물 상태 ──────────────────────────────────────────────
export type PlantState = "bloom" | "growing" | "sprout" | "thirsty" | "wither";

export const STATE_META: Record<
  PlantState,
  { emoji: string; label: string; color: string; bar: number }
> = {
  bloom: { emoji: "🌸", label: "만개", color: "text-pink-500", bar: 100 },
  growing: { emoji: "🌿", label: "쑥쑥", color: "text-emerald-600", bar: 75 },
  sprout: { emoji: "🌱", label: "새싹", color: "text-lime-600", bar: 45 },
  thirsty: { emoji: "🥀", label: "목마름", color: "text-amber-600", bar: 25 },
  wither: { emoji: "🍂", label: "시듦", color: "text-stone-500", bar: 10 },
};

export type HabitStatus = {
  habit: Habit;
  wateredToday: boolean;
  streak: number; // 오늘(물 줬으면) 또는 어제까지의 연속일
  bestStreak: number;
  totalDays: number; // 누적 물 준 날 수
  state: PlantState;
  automation: number; // 자동화 진행률 %(66일 기준)
};

// 특정 습관의 연속일/상태 계산
export function computeHabitStatus(
  state: GardenState,
  habit: Habit,
  today: Date
): HabitStatus {
  const todayK = dateKey(today);
  const yestK = dateKey(addDays(today, -1));
  const wateredToday = !!state.logs[todayK]?.[habit.key];

  // 연속일: 물 줬으면 오늘부터, 아니면 어제부터 거꾸로 카운트
  const end = wateredToday ? today : addDays(today, -1);
  let streak = 0;
  let cursor = end;
  while (state.logs[dateKey(cursor)]?.[habit.key]) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  // 누적 & 최고 연속
  let totalDays = 0;
  const doneDates: string[] = [];
  for (const [dk, m] of Object.entries(state.logs)) {
    if (m[habit.key]) {
      totalDays += 1;
      doneDates.push(dk);
    }
  }
  doneDates.sort();
  let bestStreak = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const dk of doneDates) {
    const cur = new Date(dk + "T00:00:00");
    if (prev && dateKey(addDays(prev, 1)) === dk) run += 1;
    else run = 1;
    if (run > bestStreak) bestStreak = run;
    prev = cur;
  }

  // 상태 판정
  let ps: PlantState;
  if (wateredToday) {
    if (streak >= 21) ps = "bloom";
    else if (streak >= 7) ps = "growing";
    else ps = "sprout";
  } else {
    const wateredYest = !!state.logs[yestK]?.[habit.key];
    if (wateredYest) ps = "thirsty"; // 어제까진 살아있음, 오늘 물 필요
    else if (totalDays === 0) ps = "sprout"; // 갓 심은 새싹(아직 시들 것도 없음)
    else ps = "wither"; // 이틀 이상 방치
  }

  const automation = Math.min(100, Math.round((streak / 66) * 100));

  return {
    habit,
    wateredToday,
    streak,
    bestStreak,
    totalDays,
    state: ps,
    automation,
  };
}

export type GardenSummary = {
  statuses: HabitStatus[];
  wateredCount: number; // 오늘 물 준 습관 수
  total: number;
  gardenStreak: number; // 하나라도 물 준 날의 연속(정원 전체)
  headline: string;
  identityPhrase: string;
  identity: Identity;
  worst: HabitStatus | null; // 가장 뒤처진 습관(오늘 처방 대상)
  prescriptionHabit: Habit | null;
};

// 정원 전체 요약
export function summarizeGarden(
  state: GardenState,
  today: Date
): GardenSummary {
  const allHabits = buildHabitMap(state);
  const habits = state.habitKeys
    .map((k) => allHabits[k])
    .filter(Boolean) as Habit[];
  const statuses = habits.map((h) => computeHabitStatus(state, h, today));

  const todayK = dateKey(today);
  const wateredCount = statuses.filter((s) => s.wateredToday).length;
  const total = statuses.length;

  // 정원 전체 연속일: '하루에 최소 1개라도 물 준 날'의 연속
  const wateredToday = wateredCount > 0;
  let end = wateredToday ? today : addDays(today, -1);
  let gardenStreak = 0;
  let cursor = end;
  while (true) {
    const dk = dateKey(cursor);
    const any = state.logs[dk] && Object.values(state.logs[dk]).some(Boolean);
    if (any) {
      gardenStreak += 1;
      cursor = addDays(cursor, -1);
    } else break;
  }
  void todayK;

  const bloom = statuses.filter((s) => s.state === "bloom").length;
  const wilt = statuses.filter(
    (s) => s.state === "wither" || s.state === "thirsty"
  ).length;
  let headline: string;
  if (total > 0 && wateredCount === total) headline = "🌸 오늘 정원을 완벽히 돌봤어요";
  else if (bloom >= Math.ceil(total / 2)) headline = "🌸 꽃이 만발한 정원";
  else if (wilt >= Math.ceil(total / 2)) headline = "🍂 물이 필요한 정원";
  else headline = "🌿 무럭무럭 자라는 정원";

  const identity =
    IDENTITIES.find((i) => i.key === state.identityKey) ?? IDENTITIES[1];

  // 처방 대상: 아직 오늘 물 안 줬고 상태가 나쁜 것 우선, 없으면 streak 최저
  const notWatered = statuses.filter((s) => !s.wateredToday);
  const pool = notWatered.length ? notWatered : statuses;
  const worst =
    [...pool].sort((a, b) => a.streak - b.streak)[0] ?? null;

  return {
    statuses,
    wateredCount,
    total,
    gardenStreak,
    headline,
    identityPhrase: identity.phrase,
    identity,
    worst,
    prescriptionHabit: worst ? worst.habit : null,
  };
}

// 최근 N일 잔디(정원 전체 물 준 비율)
export function recentGrid(
  state: GardenState,
  today: Date,
  days: number
): { key: string; ratio: number; count: number; total: number }[] {
  const total = state.habitKeys.length || 1;
  const out: { key: string; ratio: number; count: number; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const dk = dateKey(d);
    const m = state.logs[dk] ?? {};
    const count = state.habitKeys.filter((k) => m[k]).length;
    out.push({ key: dk, ratio: count / total, count, total });
  }
  return out;
}

// ───────────────────────────────────────────────────────────
//  오늘의 정원 진단 (10개 상황 질문) + 정원 정령 캐릭터
//  물주기(하드 트래킹) 위에 얹는 '캐릭터 + 정원사 팁' 레이어.
// ───────────────────────────────────────────────────────────

export type Spirit = {
  key: string;
  name: string;
  emoji: string;
  role: string;
  line: string;
};

// 정원 정령 7인 (모두 독립 캐릭터)
export const SPIRITS: Record<string, Spirit> = {
  gardener: { key: "gardener", name: "정원사 ‘흙손’", emoji: "👩‍🌾", role: "정원 총괄·팁", line: "오늘 물 한 번 줬으니 됐어요." },
  sprout: { key: "sprout", name: "새싹 ‘뾰족’", emoji: "🌱", role: "이제 막 심은 습관", line: "저 방금 심겼어요, 살살요." },
  weed: { key: "weed", name: "잡초 ‘또나’", emoji: "🌾", role: "자꾸 자라는 나쁜 습관", line: "저 또 왔어요~" },
  pot: { key: "pot", name: "화분 ‘시들’", emoji: "🪴", role: "방치된 습관", line: "…물 준 지 며칠 됐죠?" },
  bee: { key: "bee", name: "꿀벌 ‘붕붕’", emoji: "🐝", role: "보상·동기", line: "잘했으니 꿀 한 스푼!" },
  tree: { key: "tree", name: "큰나무 ‘든든’", emoji: "🌳", role: "정착된 습관", line: "이젠 흔들리지 않아요." },
  can: { key: "can", name: "물뿌리개 ‘촉촉’", emoji: "🚿", role: "출석·물주기 담당", line: "오늘도 왔네요! 촵촵." },
};

export type DiagOption = {
  label: string;
  // 이 선택으로 등장하는 정령 + 등장 이유
  trigger?: { spirit: string; reason: string };
  weed?: string; // 오늘의 잡초 정체
  careTip?: string; // 정원사 팁 후보
};

export type DiagQuestion = {
  id: string;
  prompt: string;
  emoji: string;
  options: DiagOption[];
};

const _ALL_DIAGNOSIS_QUESTIONS: DiagQuestion[] = [
  // ── 기존 10개 ──
  {
    id: "morning",
    prompt: "오늘 아침 첫 루틴을 지켰나요?",
    emoji: "⏰",
    options: [
      { label: "완벽하게", trigger: { spirit: "can", reason: "아침부터 물을 줬어요" } },
      { label: "대충은 했다", trigger: { spirit: "can", reason: "그래도 출석은 했어요" } },
      { label: "그냥 스킵", trigger: { spirit: "pot", reason: "아침 화분이 목말라해요" } },
      { label: "루틴이 뭐죠", trigger: { spirit: "pot", reason: "루틴 화분이 바싹 말랐어요" } },
    ],
  },
  {
    id: "newhabit",
    prompt: "요즘 새로 심으려는 습관은?",
    emoji: "🌱",
    options: [
      { label: "운동", trigger: { spirit: "sprout", reason: "'운동' 새싹을 심었어요" } },
      { label: "독서", trigger: { spirit: "sprout", reason: "'독서' 새싹을 심었어요" } },
      { label: "일찍 자기", trigger: { spirit: "sprout", reason: "'일찍 자기' 새싹을 심었어요" } },
      { label: "폰 덜 보기", trigger: { spirit: "sprout", reason: "'폰 덜 보기' 새싹을 심었어요" } },
    ],
  },
  {
    id: "weed",
    prompt: "자꾸 다시 자라는 잡초 습관은?",
    emoji: "🌾",
    options: [
      { label: "야식", weed: "야식", trigger: { spirit: "weed", reason: "'야식' 잡초가 또 났어요" } },
      { label: "늦잠", weed: "늦잠", trigger: { spirit: "weed", reason: "'늦잠' 잡초가 또 났어요" } },
      { label: "미루기", weed: "미루기", trigger: { spirit: "weed", reason: "'미루기' 잡초가 또 났어요" } },
      { label: "폰 스크롤", weed: "폰 스크롤", trigger: { spirit: "weed", reason: "'폰 스크롤' 잡초가 또 났어요" } },
    ],
  },
  {
    id: "days",
    prompt: "계획을 며칠째 지키고 있나요?",
    emoji: "📅",
    options: [
      { label: "오늘 시작", trigger: { spirit: "sprout", reason: "이제 막 싹텄어요" } },
      { label: "3일쯤", trigger: { spirit: "sprout", reason: "새싹이 제법 폈어요" } },
      { label: "2주 넘게", trigger: { spirit: "tree", reason: "뿌리가 내리는 중이에요" } },
      { label: "이미 습관됨", trigger: { spirit: "tree", reason: "큰나무로 자랐어요" } },
    ],
  },
  {
    id: "day3",
    prompt: "작심삼일의 3일째, 지금 나는?",
    emoji: "🌗",
    options: [
      { label: "다시 도전", trigger: { spirit: "bee", reason: "재도전에 꿀벌이 응원해요" } },
      { label: "이미 넘겼다", trigger: { spirit: "tree", reason: "고비를 넘겼어요" } },
      { label: "일단 미룸", trigger: { spirit: "pot", reason: "화분이 시들 준비를 해요" } },
      { label: "포기 직전", trigger: { spirit: "pot", reason: "화분에 물이 급해요" } },
    ],
  },
  {
    id: "trigger",
    prompt: "습관이 무너지는 트리거는?",
    emoji: "💥",
    options: [
      { label: "피곤할 때", careTip: "피곤은 가장 흔한 붕괴 신호예요. '2분 버전'만 남겨두세요." },
      { label: "갑작스런 약속", careTip: "일정이 흔들릴 땐 '아침에 미리 물주기'로 시간을 당기세요." },
      { label: "날씨 탓", careTip: "날씨에 흔들리는 습관은 실내 대체 루틴을 하나 정해두면 좋아요." },
      { label: "그냥 무너져요", careTip: "이유가 없다면 '신호'가 없어서예요. 기존 행동 뒤에 딱 붙여보세요." },
    ],
  },
  {
    id: "reward",
    prompt: "나에게 물(보상)을 준다면?",
    emoji: "🎁",
    options: [
      { label: "군것질", trigger: { spirit: "bee", reason: "꿀벌이 달콤한 보상을 물어왔어요" } },
      { label: "넷플릭스", trigger: { spirit: "bee", reason: "꿀벌이 저녁 보상을 준비했어요" } },
      { label: "쇼핑", trigger: { spirit: "bee", reason: "꿀벌이 작은 보상을 챙겼어요" } },
      { label: "낮잠", trigger: { spirit: "bee", reason: "꿀벌이 달콤한 휴식을 권해요" } },
    ],
  },
  {
    id: "compare",
    prompt: "남이 하는 습관을 보면?",
    emoji: "👀",
    options: [
      { label: "자극받는다", careTip: "자극은 좋은 씨앗이에요. 딱 하나만 내 정원에 옮겨 심어보세요." },
      { label: "부담된다", careTip: "비교는 잡초를 키워요. 어제의 나와만 비교하는 게 정답이에요." },
      { label: "무관심", careTip: "내 페이스가 확실하다는 뜻. 지금 리듬을 지키세요." },
      { label: "따라 한다", careTip: "따라 하되 '2분 버전'부터. 남의 큰나무를 통째로 옮기면 시들어요." },
    ],
  },
  {
    id: "frequency",
    prompt: "정원을 돌보는 빈도는?",
    emoji: "🚿",
    options: [
      { label: "매일", trigger: { spirit: "can", reason: "매일 물뿌리개가 다녀가요" } },
      { label: "생각날 때", trigger: { spirit: "can", reason: "가끔이라도 촉촉이가 들러요" } },
      { label: "주말만", trigger: { spirit: "pot", reason: "평일 화분이 목말라해요" } },
      { label: "거의 방치", trigger: { spirit: "pot", reason: "화분이 바싹 말랐어요" } },
    ],
  },
  {
    id: "best",
    prompt: "지금 가장 잘 자란 습관 하나는?",
    emoji: "🏆",
    options: [
      { label: "물 마시기", trigger: { spirit: "tree", reason: "'물 마시기'가 큰나무가 됐어요" } },
      { label: "스트레칭", trigger: { spirit: "tree", reason: "'스트레칭'이 큰나무가 됐어요" } },
      { label: "감사일기", trigger: { spirit: "tree", reason: "'감사일기'가 큰나무가 됐어요" } },
      { label: "아직 없어요 ㅠ", trigger: { spirit: "sprout", reason: "괜찮아요, 새싹부터 시작해요" } },
    ],
  },
  // ── 추가 질문 12개 ──
  {
    id: "energy",
    prompt: "지금 에너지 레벨은?",
    emoji: "🔋",
    options: [
      { label: "충전 완료", trigger: { spirit: "can", reason: "에너지가 넘쳐요! 물 줄 힘이 충분해요" } },
      { label: "보통", trigger: { spirit: "can", reason: "평소 컨디션이에요" } },
      { label: "좀 피곤", trigger: { spirit: "pot", reason: "화분도 정원사도 지쳐있어요" }, careTip: "피곤할 땐 가장 쉬운 습관 하나만 물 줘보세요." },
      { label: "방전됨", trigger: { spirit: "pot", reason: "오늘은 쉬어도 괜찮아요" }, careTip: "방전된 날은 '1분 버전'이 최선이에요." },
    ],
  },
  {
    id: "evening",
    prompt: "어젯밤 마무리 루틴은?",
    emoji: "🌙",
    options: [
      { label: "잘 지켰다", trigger: { spirit: "tree", reason: "밤 루틴이 단단해졌어요" } },
      { label: "반만 했다", trigger: { spirit: "can", reason: "반이라도 출석 완료!" } },
      { label: "폰 보다 잠듦", trigger: { spirit: "weed", reason: "'밤 폰' 잡초가 자랐어요" }, weed: "밤 폰" },
      { label: "루틴 없음", trigger: { spirit: "sprout", reason: "밤 루틴 새싹을 심어볼까요?" } },
    ],
  },
  {
    id: "obstacle",
    prompt: "오늘 정원을 방해할 것 같은 건?",
    emoji: "🧱",
    options: [
      { label: "바쁜 일정", careTip: "바쁜 날일수록 '아침 5분'에 미리 물 주는 게 효과적이에요." },
      { label: "컨디션 난조", careTip: "몸이 안 좋은 날엔 가장 작은 버전만. 출석 자체가 승리예요." },
      { label: "의욕 바닥", careTip: "의욕이 없을 때는 환경을 바꿔보세요. 눈앞에 도구를 두는 것만으로도 달라져요." },
      { label: "별로 없다", trigger: { spirit: "bee", reason: "오늘은 순풍이에요! 꿀벌이 기뻐해요" } },
    ],
  },
  {
    id: "streak_feel",
    prompt: "연속 기록이 끊기면?",
    emoji: "💔",
    options: [
      { label: "다시 시작하면 됨", trigger: { spirit: "bee", reason: "회복력이 최고의 습관이에요" } },
      { label: "좀 속상하다", trigger: { spirit: "bee", reason: "마음이 아프다는 건 그만큼 신경 쓴다는 뜻이에요" } },
      { label: "자책한다", careTip: "끊긴 건 실패가 아니라 쉼표예요. 다음 날이 새 시작이에요." },
      { label: "별로 신경 안 씀", trigger: { spirit: "can", reason: "가벼운 마음도 좋아요. 부담 없이 물 줘보세요" } },
    ],
  },
  {
    id: "anchor_check",
    prompt: "습관 앵커(~한 직후)를 잘 지키고 있나요?",
    emoji: "⚓",
    options: [
      { label: "딱 붙어 있다", trigger: { spirit: "tree", reason: "앵커가 튼튼해요! 뿌리가 깊어지는 중" } },
      { label: "가끔 잊는다", trigger: { spirit: "can", reason: "앵커를 눈에 보이는 곳에 메모해보세요" } },
      { label: "앵커가 뭔지 모름", trigger: { spirit: "sprout", reason: "기존 행동 뒤에 습관을 붙이는 게 앵커예요" }, careTip: "'~한 직후에'라는 공식을 하나 정해보세요. 예: 양치 직후 스트레칭." },
      { label: "앵커를 바꿔야 할 것 같다", careTip: "앵커가 안 맞으면 과감히 바꾸세요. 좋은 앵커는 이미 매일 하는 행동이에요." },
    ],
  },
  {
    id: "tiny_version",
    prompt: "습관의 '2분 버전'을 써본 적 있나요?",
    emoji: "⏱️",
    options: [
      { label: "자주 쓴다", trigger: { spirit: "tree", reason: "2분 버전의 힘을 아는 정원사예요" } },
      { label: "가끔 쓴다", trigger: { spirit: "can", reason: "좋은 전략이에요. 더 자주 써보세요" } },
      { label: "필요 없다고 느낌", careTip: "2분 버전은 '보험'이에요. 완벽한 날엔 필요 없지만 무너지는 날 정원을 살려줘요." },
      { label: "2분 버전이 뭔가요", careTip: "어떤 습관이든 2분짜리 초소형으로 줄이는 거예요. 독서 → 1페이지, 운동 → 스쿼트 3개." },
    ],
  },
  {
    id: "environment",
    prompt: "습관 환경(신호)을 세팅했나요?",
    emoji: "🏠",
    options: [
      { label: "다 세팅됨", trigger: { spirit: "tree", reason: "환경이 습관을 끌어당기고 있어요" } },
      { label: "몇 개만", trigger: { spirit: "can", reason: "하나씩 더 세팅해보세요" } },
      { label: "안 했다", trigger: { spirit: "sprout", reason: "환경 신호를 하나 심어보세요" }, careTip: "물병을 책상 위에, 책을 베개 위에. 눈에 보이면 행동으로 이어져요." },
      { label: "뭘 세팅하라는 건지", careTip: "습관을 떠올리게 하는 물건을 눈에 띄는 곳에 두세요. 이게 '신호(cue)'예요." },
    ],
  },
  {
    id: "weekend",
    prompt: "주말에도 습관을 유지하나요?",
    emoji: "☀️",
    options: [
      { label: "주말도 같다", trigger: { spirit: "tree", reason: "주말에도 흔들리지 않는 큰나무예요" } },
      { label: "좀 느슨해진다", trigger: { spirit: "can", reason: "주말엔 가벼운 버전으로 물 줘도 돼요" } },
      { label: "주말은 쉰다", trigger: { spirit: "pot", reason: "주말 2일 공백이면 화분이 갈증을 느껴요" }, careTip: "주말엔 '1분 버전'만이라도 유지하면 월요일 재시작이 훨씬 쉬워요." },
      { label: "주말이 더 잘 됨", trigger: { spirit: "bee", reason: "여유가 습관에 좋은 비료가 되고 있어요" } },
    ],
  },
  {
    id: "mood",
    prompt: "지금 기분은?",
    emoji: "😊",
    options: [
      { label: "좋다", trigger: { spirit: "bee", reason: "기분 좋은 날엔 꿀벌이 신나요!" } },
      { label: "그저 그렇다", trigger: { spirit: "can", reason: "보통인 날에도 물 한 번이면 충분해요" } },
      { label: "우울하다", careTip: "기분이 가라앉은 날엔 가장 쉬운 습관 하나만. 그것만으로 대단한 거예요." },
      { label: "짜증난다", careTip: "짜증날 때는 몸을 움직이는 습관이 가장 효과적이에요. 스트레칭이나 짧은 산책 한 번." },
    ],
  },
  {
    id: "weed2",
    prompt: "요즘 새로 자라난 잡초 습관은?",
    emoji: "🌿",
    options: [
      { label: "간식 폭식", weed: "간식 폭식", trigger: { spirit: "weed", reason: "'간식 폭식' 잡초가 올라왔어요" } },
      { label: "SNS 비교", weed: "SNS 비교", trigger: { spirit: "weed", reason: "'SNS 비교' 잡초가 자라고 있어요" } },
      { label: "충동 구매", weed: "충동 구매", trigger: { spirit: "weed", reason: "'충동 구매' 잡초가 싹텄어요" } },
      { label: "없다", trigger: { spirit: "bee", reason: "잡초가 없는 깨끗한 정원이에요!" } },
    ],
  },
  {
    id: "support",
    prompt: "습관을 함께하는 사람이 있나요?",
    emoji: "🤝",
    options: [
      { label: "같이 하는 친구 있다", trigger: { spirit: "bee", reason: "함께하면 정원이 더 풍성해져요" } },
      { label: "가족이 도와준다", trigger: { spirit: "tree", reason: "가족의 응원이 뿌리를 단단하게 해요" } },
      { label: "혼자 한다", trigger: { spirit: "can", reason: "혼자서도 잘 하고 있어요. 물뿌리개가 응원해요" } },
      { label: "오히려 방해받는다", careTip: "주변 환경이 방해될 땐 '몰래 습관'도 괜찮아요. 나만의 시간과 장소를 만드세요." },
    ],
  },
  {
    id: "identity",
    prompt: "'나는 ~하는 사람이다'가 느껴지나요?",
    emoji: "🪞",
    options: [
      { label: "확실히 느껴진다", trigger: { spirit: "tree", reason: "정체성이 뿌리를 내렸어요" } },
      { label: "조금씩 느껴진다", trigger: { spirit: "sprout", reason: "정체성 새싹이 자라는 중이에요" } },
      { label: "아직 잘 모르겠다", trigger: { spirit: "sprout", reason: "괜찮아요. 행동이 정체성보다 먼저 와요" }, careTip: "정체성은 행동의 결과예요. 매일 책을 읽으면 어느 순간 '나는 독서하는 사람'이 돼요." },
      { label: "그런 거 생각 안 해봤다", careTip: "습관 뒤에 '이걸 하는 나'를 한 번 떠올려보세요. 작은 자부심이 습관을 지켜줘요." },
    ],
  },
];

/** 날짜 기반 시드로 전체 풀에서 10개 질문을 뽑아 반환 */
function seededShuffle(arr: DiagQuestion[], seed: number): DiagQuestion[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getDailyQuestions(today: Date): DiagQuestion[] {
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const shuffled = seededShuffle(_ALL_DIAGNOSIS_QUESTIONS, seed);
  return shuffled.slice(0, 10);
}

/** 하위 호환: 기존 코드가 DIAGNOSIS_QUESTIONS를 참조하는 곳용 (오늘 날짜 기준) */
export const DIAGNOSIS_QUESTIONS: DiagQuestion[] = _ALL_DIAGNOSIS_QUESTIONS.slice(0, 10);

// 잡초별 관리 팁 (신호 차단 + 대체 행동)
const DIAG_WEED_TIP: Record<string, string> = {
  "야식": "잡초 '야식'은 밤 10시에 잘 자라요. 주방 조명을 끄고, 허기엔 따뜻한 차로 대체하세요.",
  "늦잠": "잡초 '늦잠'은 알람을 침대 두 걸음 밖에 두면 시들어요.",
  "미루기": "잡초 '미루기'는 '딱 2분만 손대기'로 뿌리를 자를 수 있어요.",
  "폰 스크롤": "잡초 '폰 스크롤'은 화면을 흑백으로 바꾸면 물기가 마릅니다.",
  "밤 폰": "잡초 '밤 폰'은 취침 30분 전에 충전기에 꽂아두면 시들어요.",
  "간식 폭식": "잡초 '간식 폭식'은 간식 대신 따뜻한 차 한 잔으로 대체하면 줄어들어요.",
  "SNS 비교": "잡초 'SNS 비교'는 타이머를 걸어두면 자라기 어려워요.",
  "충동 구매": "잡초 '충동 구매'는 장바구니에 넣고 24시간 기다리기로 뿌리를 자를 수 있어요.",
};

export type DiagnosisResult = {
  spirits: { spirit: Spirit; reason: string }[];
  weedLabel: string | null;
  gardenerTip: string;
};

export function buildDiagnosis(answers: number[], questions?: DiagQuestion[]): DiagnosisResult {
  const qs = questions ?? DIAGNOSIS_QUESTIONS;
  const picked: DiagOption[] = answers
    .map((idx, qi) => qs[qi]?.options[idx])
    .filter(Boolean) as DiagOption[];

  // 등장 정령 수집 (중복 제거, 첫 등장 이유 사용). 정원사는 항상 등장.
  const order: string[] = [];
  const reasonOf: Record<string, string> = {};
  for (const o of picked) {
    if (o.trigger && !reasonOf[o.trigger.spirit]) {
      reasonOf[o.trigger.spirit] = o.trigger.reason;
      order.push(o.trigger.spirit);
    }
  }
  const spirits = order
    .map((k) => ({ spirit: SPIRITS[k], reason: reasonOf[k] }))
    .filter((s) => s.spirit);

  const weedLabel = picked.find((o) => o.weed)?.weed ?? null;

  // 정원사 팁: 잡초 팁 + 상황 팁 하나
  const weedTip = weedLabel
    ? DIAG_WEED_TIP[weedLabel] ?? `잡초 ‘${weedLabel}’를 신호부터 끊어보세요.`
    : "오늘은 잡초가 조용하네요. 이 틈에 새싹에 물을 한 번 더 주세요.";
  const careTip = picked.find((o) => o.careTip)?.careTip ?? "";
  const gardenerTip = careTip ? `${weedTip} ${careTip}` : weedTip;

  return { spirits, weedLabel, gardenerTip };
}
