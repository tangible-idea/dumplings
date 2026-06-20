// ===== 게임 상수 / 순수 로직 =====
export const saveKey = (deviceCode) => `dumpling-clicker-v1:${deviceCode || 'local'}`;

export const GENS = [
  { name: '만두 친구',   emoji: '🥟', desc: '데굴데굴 코인을 모아요',        base: 15,      prod: 0.1 },
  { name: '찐빵 고양이', emoji: '🐱', desc: '낮잠 자면서도 코인을 벌어요',  base: 100,     prod: 1 },
  { name: '왕만두',     emoji: '🥠', desc: '큼직하게 코인을 벌어와요',      base: 1100,    prod: 8 },
  { name: '샤오롱바오', emoji: '🍲', desc: '육즙처럼 코인이 흘러나와요',    base: 12000,   prod: 47 },
  { name: '딤섬 셰프',  emoji: '👨‍🍳', desc: '쉴 새 없이 딤섬을 빚어요',     base: 130000,  prod: 260 },
  { name: '전설의 찜기', emoji: '♨️', desc: '전설급 생산량을 자랑해요',     base: 1400000, prod: 1400 },
];

export const LEVEL_NAMES = ['아기 딤섬', '말랑 딤섬', '포동 딤섬', '윤기 딤섬', '황금 딤섬', '전설 딤섬', '신화 딤섬', '우주 딤섬'];

export const NEWS = [
  '딤섬 뉴스 — "클릭은 사랑의 언어일지도."',
  '딤섬 뉴스 — 찜기 온도 100도 돌파, 김이 모락모락!',
  '딤섬 뉴스 — 만두 친구들이 야근을 자처했다고 합니다.',
  '딤섬 뉴스 — 오늘의 운세: 클릭할수록 부자가 됩니다.',
  '딤섬 뉴스 — 샤오롱바오, 육즙 보존의 비밀 공개?',
];

export function initialState() {
  return { coins: 0, totalEarned: 0, totalClicks: 0, clickLevel: 0, gens: GENS.map(() => 0), lastSave: Date.now() };
}

export function fmt(n) {
  if (n < 1000) return (Math.round(n * 10) / 10).toString();
  const units = ['', 'K', 'M', 'B', 'T', 'aa', 'bb', 'cc'];
  let u = 0;
  while (n >= 1000 && u < units.length - 1) { n /= 1000; u++; }
  return n.toFixed(2) + units[u];
}

export function clickPower(S) { return 1 + S.clickLevel; }
export function perSec(S) { return GENS.reduce((s, g, i) => s + g.prod * S.gens[i], 0); }
export function genCost(i, owned) { return Math.floor(GENS[i].base * Math.pow(1.15, owned)); }
export function clickUpgradeCost(S) { return Math.floor(25 * Math.pow(1.6, S.clickLevel)); }

export function levelInfo(S) {
  let lvl = 1, need = 50, acc = 0;
  while (S.totalEarned >= acc + need && lvl < 999) { acc += need; lvl++; need = Math.floor(need * 1.55); }
  return { lvl, cur: S.totalEarned - acc, need };
}

// localStorage 불러오기 + 오프라인 보상 계산
export function loadState(deviceCode) {
  const key = saveKey(deviceCode);
  const S = initialState();
  let offlineReward = 0;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const d = JSON.parse(raw);
      Object.assign(S, d);
      if (!Array.isArray(S.gens) || S.gens.length !== GENS.length) S.gens = GENS.map(() => 0);
      const elapsed = Math.min((Date.now() - (S.lastSave || Date.now())) / 1000, 8 * 3600);
      const off = perSec(S) * elapsed * 0.5;
      if (off > 0) { S.coins += off; S.totalEarned += off; offlineReward = off; }
    }
  } catch (e) { /* ignore */ }
  return { state: S, offlineReward };
}

export function saveState(S, deviceCode) {
  S.lastSave = Date.now();
  try { localStorage.setItem(saveKey(deviceCode), JSON.stringify(S)); } catch (e) { /* ignore */ }
}
