// ===== 딤섬 찜 게임 상수 / 순수 로직 =====
export const saveKey = (deviceCode) => `dumpling-steam-v1:${deviceCode || 'local'}`;

// 찜 대상 딤섬 타입 (각자 기본 찜 시간 보유, 초 단위 — 프로토타입 검증을 빠르게 하려고 짧게)
export const DIMSUM_TYPES = [
  { id: 'har_gow', name: '하가우', emoji: '🥟', baseTime: 30 },
  { id: 'siu_mai', name: '슈마이', emoji: '🥠', baseTime: 35 },
  { id: 'char_siu_bao', name: '차슈바오', emoji: '🥖', baseTime: 45 },
  { id: 'xlb', name: '샤오롱바오', emoji: '🍲', baseTime: 60 },
];

// 재료 카테고리
export const CATEGORIES = [
  { id: 'seafood', name: '새우/해산물', emoji: '🦐' },
  { id: 'meat', name: '고기류', emoji: '🥩' },
  { id: 'bao', name: '바오류', emoji: '🍞' },
  { id: 'veggie', name: '채소/버섯', emoji: '🍄' },
  { id: 'fantasy', name: '판타지', emoji: '✨' },
];

// 재료 카탈로그 — 영구 해금형(구매=해금, 사용은 무료). 밸런스는 이 한 곳에서 조정.
// bonus.type: expPct | sellGoldPct | steamTime | gradeChance{minGrade} | legendChance
//             | failDown | clickPower | extraAdjective | randomGold | eatBuff
export const INGREDIENTS = [
  // 새우/해산물 🦐
  { id: 'shrimp', cat: 'seafood', name: '새우살', emoji: '🦐', price: 0, unlockLevel: 1,
    adjectives: ['탱글한', '촉촉한'], bonus: { type: 'sellGoldPct', value: 0.15 } },
  { id: 'crab', cat: 'seafood', name: '게살', emoji: '🦀', price: 120, unlockLevel: 3,
    adjectives: ['고소한', '담백한'], bonus: { type: 'gradeChance', minGrade: 'B', value: 0.1 } },
  { id: 'scallop', cat: 'seafood', name: '관자', emoji: '🐚', price: 300, unlockLevel: 6,
    adjectives: ['입에서 녹는', '깊은 맛의'], bonus: { type: 'expPct', value: 0.2 } },

  // 고기류 🥩
  { id: 'pork', cat: 'meat', name: '다진돼지', emoji: '🐖', price: 0, unlockLevel: 1,
    adjectives: ['육즙 가득한', '쫀득한'], bonus: { type: 'steamTime', value: 3 } },
  { id: 'char_siu', cat: 'meat', name: '차슈', emoji: '🍖', price: 150, unlockLevel: 4,
    adjectives: ['윤기나는', '깊은 맛의'], bonus: { type: 'failDown', value: 0.15 } },
  { id: 'wagyu', cat: 'meat', name: '한우', emoji: '🥩', price: 500, unlockLevel: 8,
    adjectives: ['명품', '장인의'], bonus: { type: 'gradeChance', minGrade: 'A', value: 0.12 } },

  // 바오류 🍞
  { id: 'dough', cat: 'bao', name: '밀가루피', emoji: '🍥', price: 0, unlockLevel: 1,
    adjectives: ['말랑한', '따끈한'], bonus: { type: 'clickPower', value: 0.2 } },
  { id: 'sesame', cat: 'bao', name: '흑임자', emoji: '⚫', price: 100, unlockLevel: 3,
    adjectives: ['고소한', '담백한'], bonus: { type: 'extraAdjective', value: 1 } },
  { id: 'custard', cat: 'bao', name: '커스터드', emoji: '🟡', price: 280, unlockLevel: 6,
    adjectives: ['입에서 녹는', '황금빛'], bonus: { type: 'eatBuff', value: 1 } },

  // 채소/버섯 🍄
  { id: 'chive', cat: 'veggie', name: '부추', emoji: '🌿', price: 0, unlockLevel: 2,
    adjectives: ['정갈한', '담백한'], bonus: { type: 'steamTime', value: 2 } },
  { id: 'shiitake', cat: 'veggie', name: '표고', emoji: '🍄', price: 140, unlockLevel: 4,
    adjectives: ['깊은 맛의', '고소한'], bonus: { type: 'expPct', value: 0.15 } },
  { id: 'truffle', cat: 'veggie', name: '송로버섯', emoji: '🟤', price: 900, unlockLevel: 12,
    adjectives: ['명품', '황실의'], bonus: { type: 'legendChance', value: 0.04 } },

  // 판타지 ✨
  { id: 'stardust', cat: 'fantasy', name: '별가루', emoji: '⭐', price: 2000, unlockLevel: 15,
    adjectives: ['별빛 머금은', '무지개빛'], bonus: { type: 'gradeChance', minGrade: 'S', value: 0.2 } },
  { id: 'dragon_breath', cat: 'fantasy', name: '용의숨결', emoji: '🐉', price: 5000, unlockLevel: 20,
    adjectives: ['용의 숨결이 깃든', '찜기의 축복을 받은'], bonus: { type: 'legendChance', value: 0.1 } },
  { id: 'elixir', cat: 'fantasy', name: '불로초', emoji: '🌟', price: 8000, unlockLevel: 25,
    adjectives: ['신선이 먹던', '딤섬신의 선택을 받은'], bonus: { type: 'randomGold', value: 500 } },
];

export const INGREDIENT_MAP = Object.fromEntries(INGREDIENTS.map((g) => [g.id, g]));
export const DIMSUM_TYPE_MAP = Object.fromEntries(DIMSUM_TYPES.map((t) => [t.id, t]));

// 등급 — weight(가중치), expReward(경험치), sellGold(기본 판매가), 형용사 풀
export const GRADES = [
  { id: 'D', name: 'D', weight: 30, expReward: 5, sellGold: 10, color: '#8a8597',
    adjectives: ['덜 익은', '터진', '질척한', '눌어붙은'] },
  { id: 'C', name: 'C', weight: 34, expReward: 12, sellGold: 25, color: '#9ad4ff',
    adjectives: ['평범한', '따끈한', '말랑한', '담백한'] },
  { id: 'B', name: 'B', weight: 20, expReward: 25, sellGold: 55, color: '#7ce0a3',
    adjectives: ['쫀득한', '촉촉한', '고소한', '탱글한', '육즙 가득한'] },
  { id: 'A', name: 'A', weight: 10, expReward: 50, sellGold: 120, color: '#ffd24a',
    adjectives: ['윤기나는', '정갈한', '깊은 맛의', '장인의', '완벽하게 찐'] },
  { id: 'S', name: 'S', weight: 4, expReward: 110, sellGold: 300, color: '#ff8a3d',
    adjectives: ['명품', '황실의', '입에서 녹는', '찜기의 축복을 받은'] },
  { id: 'SS', name: 'SS', weight: 1.5, expReward: 240, sellGold: 700, color: '#ff6ec7',
    adjectives: ['황금빛', '별빛 머금은', '무지개빛', '용의 숨결이 깃든'] },
  { id: 'LEGEND', name: 'LEGEND', weight: 0.2, expReward: 600, sellGold: 2000, color: '#b388ff',
    adjectives: ['전설의', '신선이 먹던', '딤섬신의 선택을 받은'] },
];

export const GRADE_MAP = Object.fromEntries(GRADES.map((g, i) => [g.id, { ...g, rank: i }]));

export const LEVEL_NAMES = ['견습 찜사', '초보 찜사', '능숙한 찜사', '숙련 찜사', '장인 찜사', '명장 찜사', '전설 찜사', '딤섬신'];

export const NEWS = [
  '딤섬 뉴스 — "클릭은 찜기를 데우는 사랑의 언어일지도."',
  '딤섬 뉴스 — 찜기 온도 100도 돌파, 김이 모락모락!',
  '딤섬 뉴스 — 오늘의 운세: 클릭할수록 등급이 오릅니다.',
  '딤섬 뉴스 — 송로버섯 한 조각이면 전설도 꿈이 아니다?',
  '딤섬 뉴스 — 샤오롱바오, 육즙 보존의 비밀 공개?',
];

export function initialState() {
  return {
    gold: 50,
    exp: 0,
    ownedIngredients: { shrimp: true, pork: true, dough: true }, // 기본 재료 해금 → 첫 찜 가능
    inventory: [],
    steam: null,        // { typeId, ingredientIds:[], baseTime, remaining, startedAt }
    selection: { typeId: DIMSUM_TYPES[0].id, ingredientIds: [] },
    buffs: [],          // [{ label, until }] — 표시 전용(cosmetic)
    totalSteamed: 0,
    lastSave: Date.now(),
  };
}

export function fmt(n) {
  if (n < 1000) return (Math.round(n * 10) / 10).toString();
  const units = ['', 'K', 'M', 'B', 'T', 'aa', 'bb', 'cc'];
  let u = 0;
  while (n >= 1000 && u < units.length - 1) { n /= 1000; u++; }
  return n.toFixed(2) + units[u];
}

// 진행 중인 찜에 쓰인(또는 선택된) 재료들의 특정 보너스 합산
function sumBonus(ingredientIds, type) {
  let acc = 0;
  for (const id of ingredientIds || []) {
    const ing = INGREDIENT_MAP[id];
    if (ing && ing.bonus.type === type) acc += ing.bonus.value;
  }
  return acc;
}

// 클릭 1회당 줄어드는 초 = 1 + 진행 중 재료의 clickPower 보너스 합
export function clickPower(S) {
  const ids = S.steam ? S.steam.ingredientIds : S.selection.ingredientIds;
  return 1 + sumBonus(ids, 'clickPower');
}

// 찜 기본 시간 = 타입 baseTime − Σ steamTime (하한 5초)
export function steamBaseTime(typeId, ingredientIds) {
  const t = DIMSUM_TYPE_MAP[typeId];
  if (!t) return 0;
  return Math.max(5, t.baseTime - sumBonus(ingredientIds, 'steamTime'));
}

export function ingredientUnlocked(S, ing) {
  return !!S.ownedIngredients[ing.id];
}

export function ingredientBuyable(S, ing) {
  return !ingredientUnlocked(S, ing)
    && levelInfo(S).lvl >= ing.unlockLevel
    && S.gold >= ing.price;
}

export function levelInfo(S) {
  let lvl = 1, need = 50, acc = 0;
  while (S.exp >= acc + need && lvl < 999) { acc += need; lvl++; need = Math.floor(need * 1.55); }
  return { lvl, cur: S.exp - acc, need };
}

// 가중 랜덤 등급 굴림 + 형용사/판매가/경험치/버프 계산
export function rollGrade(ingredientIds, _S) {
  const ids = ingredientIds || [];
  // 가중치 테이블 복제
  const weights = GRADES.map((g) => g.weight);

  // gradeChance: 특정 등급 이상의 가중치를 합산값 비율로 상향
  for (const id of ids) {
    const ing = INGREDIENT_MAP[id];
    if (!ing) continue;
    const b = ing.bonus;
    if (b.type === 'gradeChance') {
      const minRank = GRADE_MAP[b.minGrade]?.rank ?? GRADES.length;
      const total = weights.reduce((s, w) => s + w, 0);
      for (let i = minRank; i < GRADES.length; i++) weights[i] += total * b.value;
    } else if (b.type === 'legendChance') {
      const total = weights.reduce((s, w) => s + w, 0);
      weights[GRADES.length - 1] += total * b.value;
    } else if (b.type === 'failDown') {
      // D/C 가중치 하향
      weights[0] *= Math.max(0, 1 - b.value);
      weights[1] *= Math.max(0, 1 - b.value);
    }
  }

  // 가중 추출
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  let idx = 0;
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break; } }
  const grade = GRADES[idx];

  // 형용사: 재료 형용사 중 등급 풀과 겹치는 것 우선, 없으면 등급 풀에서 랜덤
  const ingAdjs = [];
  for (const id of ids) { const ing = INGREDIENT_MAP[id]; if (ing) ingAdjs.push(...ing.adjectives); }
  const matched = ingAdjs.filter((a) => grade.adjectives.includes(a));
  const pickFrom = matched.length ? matched : grade.adjectives;
  const adjectives = [pickFrom[Math.floor(Math.random() * pickFrom.length)]];

  // extraAdjective 보너스 → 등급 풀에서 1개 추가(중복 회피)
  const extra = sumBonus(ids, 'extraAdjective');
  for (let k = 0; k < extra; k++) {
    const pool = grade.adjectives.filter((a) => !adjectives.includes(a));
    if (pool.length) adjectives.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  const sellPrice = Math.round(grade.sellGold * (1 + sumBonus(ids, 'sellGoldPct')) + sumBonus(ids, 'randomGold') * Math.random());
  const expGain = Math.round(grade.expReward * (1 + sumBonus(ids, 'expPct')));

  // 먹기 버프(표시 전용). eatBuff 보너스가 있으면 지속시간 강화 표시.
  const eatBoost = sumBonus(ids, 'eatBuff');
  const buff = {
    label: `${grade.name}급 포만감 — 다음 찜 행운 +${(GRADE_MAP[grade.id].rank + 1) * (eatBoost ? 2 : 1)}`,
    hours: (GRADE_MAP[grade.id].rank + 1) * (eatBoost ? 2 : 1),
  };

  return { gradeId: grade.id, gradeName: grade.name, color: grade.color, adjectives, sellPrice, expGain, buff };
}

// localStorage 불러오기 + 진행 중 찜의 경과시간 차감
export function loadState(deviceCode) {
  const key = saveKey(deviceCode);
  const S = initialState();
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const d = JSON.parse(raw);
      Object.assign(S, d);
      if (!S.ownedIngredients || typeof S.ownedIngredients !== 'object') S.ownedIngredients = {};
      if (!Array.isArray(S.inventory)) S.inventory = [];
      if (!Array.isArray(S.buffs)) S.buffs = [];
      if (!S.selection) S.selection = { typeId: DIMSUM_TYPES[0].id, ingredientIds: [] };
      // 진행 중 찜은 벽시계 경과만큼 차감
      if (S.steam) {
        const elapsed = Math.max(0, (Date.now() - (S.steam.startedAt || Date.now())) / 1000);
        S.steam.remaining = Math.max(0, S.steam.remaining - elapsed);
        S.steam.startedAt = Date.now() - (S.steam.baseTime - S.steam.remaining) * 1000;
      }
    }
  } catch (e) { /* ignore */ }
  return { state: S };
}

export function saveState(S, deviceCode) {
  S.lastSave = Date.now();
  try { localStorage.setItem(saveKey(deviceCode), JSON.stringify(S)); } catch (e) { /* ignore */ }
}
