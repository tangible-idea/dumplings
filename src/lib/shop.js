// ===== 딤섬 가게 운영 게임 — 순수 로직/상수 =====
// 클릭(=ESP32 버튼)으로 정해진 시간 동안 스팀 게이지를 채우고,
// 목표 존(빨/노/초/노/빨) 중 초록(perfect)에 멈추면 최고 품질의 딤섬이 완성된다.

export const ASSET = (file) => `/assets/${file}`;

// 찌기 한 라운드의 제한 시간(초). ESP32 OLED 카운트다운과 동일 값.
export const GAME_DURATION_S = 8;

// 딤섬 종류 — 레벨로 해금. asset 은 dimsum/public/assets 의 파일명.
export const DISH_TYPES = [
  { id: 'har_gow',      name: '하가우',     asset: 'dimsum_har_gow.png',        basePrice: 100, unlockLevel: 1 },
  { id: 'siu_mai',      name: '슈마이',     asset: 'dimsum_siu_mai.png',        basePrice: 120, unlockLevel: 1 },
  { id: 'baozi',        name: '바오즈',     asset: 'dimsum_baozi.png',          basePrice: 90,  unlockLevel: 2 },
  { id: 'char_siu_bao', name: '차슈바오',   asset: 'dimsum_char_siu_bao.png',   basePrice: 150, unlockLevel: 3 },
  { id: 'egg_tart',     name: '에그타르트', asset: 'dimsum_egg_tart_large.png', basePrice: 180, unlockLevel: 5 },
  { id: 'xlb',          name: '샤오롱바오', asset: 'dimsum_xiao_long_bao.png',  basePrice: 220, unlockLevel: 7 },
];
export const DISH_MAP = Object.fromEntries(DISH_TYPES.map((d) => [d.id, d]));

// 세로 목표바의 존 — [from,to) 퍼센트. 초록(perfect)이 한가운데이자 최고가.
// 0%        35%      45%        65%      75%       100%
// | 빨강  | 노랑  |   초록   | 노랑  | 빨강 |
export const ZONES = [
  { from: 0,   to: 35,  quality: 'bad',     label: '설익음',   color: '#e5484d' },
  { from: 35,  to: 45,  quality: 'good',    label: '괜찮음',   color: '#ffb224' },
  { from: 45,  to: 65,  quality: 'perfect', label: '완벽!',    color: '#46a758' },
  { from: 65,  to: 75,  quality: 'good',    label: '괜찮음',   color: '#ffb224' },
  { from: 75,  to: 100, quality: 'bad',     label: '과조리',   color: '#e5484d' },
];

// 품질별 가격 배수 / 경험치
export const QUALITY = {
  perfect: { mult: 1.0,  exp: 40, color: '#46a758', label: '완벽한' },
  good:    { mult: 0.5,  exp: 18, color: '#ffb224', label: '괜찮은' },
  bad:     { mult: 0.2,  exp: 6,  color: '#e5484d', label: '아쉬운' },
};

// 게이지 퍼센트 → 존/품질
export function zoneFromPct(pct) {
  const p = Math.max(0, Math.min(99.999, pct));
  return ZONES.find((z) => p >= z.from && p < z.to) || ZONES[ZONES.length - 1];
}

// 판매가 = 종류 기본가 × 품질배수 × (1 + (레벨-1)*0.04), 최소 5.
export function priceFor(typeId, quality, level = 1) {
  const t = DISH_MAP[typeId];
  if (!t) return 5;
  const q = QUALITY[quality] || QUALITY.bad;
  return Math.max(5, Math.round(t.basePrice * q.mult * (1 + (level - 1) * 0.04)));
}

// 라운드별 목표(게이지 100%에 해당하는 클릭 수) — 매 라운드 가변.
// 레벨이 오를수록 살짝 높아지고 ±30% 흔들려서 "목표가 매번 바뀐다".
export function rollTarget(level = 1) {
  const base = 18 + (level - 1) * 1.5;
  const jitter = 0.7 + Math.random() * 0.6; // 0.7 ~ 1.3
  return Math.max(8, Math.round(base * jitter));
}

// 해금된 딤섬 종류만
export function unlockedDishes(level = 1) {
  return DISH_TYPES.filter((d) => level >= d.unlockLevel);
}

// 경험치 → 레벨 (기존 공식 유지)
export function levelInfo(exp = 0) {
  let lvl = 1, need = 50, acc = 0;
  while (exp >= acc + need && lvl < 999) { acc += need; lvl++; need = Math.floor(need * 1.55); }
  return { lvl, cur: exp - acc, need };
}

export const LEVEL_NAMES = ['견습 점주', '동네 가게', '소문난 가게', '인기 맛집', '명소 맛집', '미슐랭 후보', '전설의 가게', '딤섬 명가'];

export function fmt(n) {
  if (n < 1000) return Math.round(n).toString();
  const units = ['', 'K', 'M', 'B', 'T'];
  let u = 0;
  while (n >= 1000 && u < units.length - 1) { n /= 1000; u++; }
  return n.toFixed(2) + units[u];
}
