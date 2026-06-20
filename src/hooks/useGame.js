import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clickPower, clickUpgradeCost, genCost, levelInfo, loadState, perSec, saveState,
} from '../lib/game';
import { deviceCode } from '../lib/supabase';

// 게임 상태는 ref(권위본)에 두고 60fps 루프로 갱신, UI 표시는 100ms마다 스냅샷.
export function useGame() {
  const sRef = useRef(null);
  const offlineRef = useRef(0);
  if (sRef.current === null) {
    const { state, offlineReward } = loadState(deviceCode);
    sRef.current = state;
    offlineRef.current = offlineReward;
  }
  // combo: { v: 1.0~2.5, decay }
  const comboRef = useRef({ v: 1, decay: 0 });

  const snapshot = () => {
    const S = sRef.current;
    return {
      coins: S.coins,
      totalEarned: S.totalEarned,
      totalClicks: S.totalClicks,
      clickLevel: S.clickLevel,
      gens: S.gens.slice(),
      perSec: perSec(S),
      clickPower: clickPower(S),
      combo: comboRef.current.v,
      level: levelInfo(S),
    };
  };

  const [snap, setSnap] = useState(snapshot);

  useEffect(() => {
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const S = sRef.current;
      const ps = perSec(S);
      if (ps > 0) { const g = ps * dt; S.coins += g; S.totalEarned += g; }
      const c = comboRef.current;
      if (c.decay > 0) { c.decay -= dt; if (c.decay <= 0) c.v = Math.max(1, c.v - 0.5); }
      else if (c.v > 1) c.v = Math.max(1, c.v - dt * 0.4);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const ui = setInterval(() => setSnap(snapshot()), 100);
    const sv = setInterval(() => saveState(sRef.current, deviceCode), 5000);
    const onLeave = () => saveState(sRef.current, deviceCode);
    window.addEventListener('beforeunload', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(ui);
      clearInterval(sv);
      window.removeEventListener('beforeunload', onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const click = useCallback(() => {
    const S = sRef.current;
    const c = comboRef.current;
    const power = clickPower(S) * c.v;
    S.coins += power; S.totalEarned += power; S.totalClicks++;
    c.v = Math.min(2.5, c.v + 0.03);
    c.decay = 1.2;
    return power;
  }, []);

  const buyGen = useCallback((i) => {
    const S = sRef.current;
    const cost = genCost(i, S.gens[i]);
    if (S.coins < cost) return false;
    S.coins -= cost; S.gens[i] += 1;
    setSnap(snapshot());
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buyClickUpgrade = useCallback(() => {
    const S = sRef.current;
    const cost = clickUpgradeCost(S);
    if (S.coins < cost) return false;
    S.coins -= cost; S.clickLevel += 1;
    setSnap(snapshot());
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seedFromCloud = useCallback((gs) => {
    if (!gs) return;
    const S = sRef.current;
    if ((gs.coins || 0) > S.coins) S.coins = gs.coins;
    if ((gs.total_clicks || 0) > S.totalClicks) S.totalClicks = gs.total_clicks;
    if ((gs.exp || 0) > S.totalEarned) S.totalEarned = gs.exp;
    setSnap(snapshot());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { snap, sRef, click, buyGen, buyClickUpgrade, seedFromCloud, offlineReward: offlineRef.current };
}
