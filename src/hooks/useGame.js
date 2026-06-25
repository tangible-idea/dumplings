import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clickPower, INGREDIENT_MAP, levelInfo, loadState, rollGrade, saveState, steamBaseTime,
} from '../lib/game';
import { deviceCode } from '../lib/supabase';

let _uid = 0;
const nextId = () => `d${Date.now().toString(36)}${(_uid++).toString(36)}`;

// 게임 상태는 ref(권위본)에 두고 rAF 루프로 갱신, UI 표시는 100ms마다 스냅샷.
export function useGame() {
  const sRef = useRef(null);
  if (sRef.current === null) {
    const { state } = loadState(deviceCode);
    sRef.current = state;
  }
  const completingRef = useRef(false);   // completeSteam 중복 방지
  const justRef = useRef(null);          // 방금 완성된 결과(팝업 트리거용)

  const snapshot = () => {
    const S = sRef.current;
    return {
      gold: S.gold,
      exp: S.exp,
      level: levelInfo(S),
      ownedIngredients: { ...S.ownedIngredients },
      inventory: S.inventory.slice(),
      selection: { typeId: S.selection.typeId, ingredientIds: S.selection.ingredientIds.slice() },
      buffs: S.buffs.slice(),
      totalSteamed: S.totalSteamed,
      steam: S.steam ? { ...S.steam } : null,
      clickPower: clickPower(S),
      justCompleted: justRef.current,
    };
  };

  const [snap, setSnap] = useState(snapshot);
  const sync = useCallback(() => setSnap(snapshot()), []); // eslint-disable-line react-hooks/exhaustive-deps

  // 찜 완성 처리
  const completeSteam = useCallback(() => {
    const S = sRef.current;
    if (!S.steam || completingRef.current) return;
    completingRef.current = true;
    const { typeId, ingredientIds } = S.steam;
    const result = rollGrade(ingredientIds, S);
    const dimsum = {
      id: nextId(),
      typeId,
      grade: result.gradeId,
      adjectives: result.adjectives,
      sellPrice: result.sellPrice,
      buff: result.buff,
      createdAt: Date.now(),
    };
    S.inventory.push(dimsum);
    S.exp += result.expGain;
    S.totalSteamed += 1;
    S.steam = null;
    justRef.current = { ...dimsum, expGain: result.expGain, ts: Date.now() };
    completingRef.current = false;
    sync();
  }, [sync]);

  useEffect(() => {
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const S = sRef.current;
      if (S.steam) {
        if (S.steam.remaining > 0) {
          S.steam.remaining = Math.max(0, S.steam.remaining - dt);
        }
        if (S.steam.remaining <= 0) completeSteam();
      }
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
  }, [completeSteam]);

  // 클릭 → 진행 중 찜의 남은시간 감소 (없으면 no-op)
  const click = useCallback(() => {
    const S = sRef.current;
    if (!S.steam || S.steam.remaining <= 0) return 0;
    const power = clickPower(S);
    S.steam.remaining = Math.max(0, S.steam.remaining - power);
    if (S.steam.remaining <= 0) completeSteam();
    return power;
  }, [completeSteam]);

  const selectType = useCallback((typeId) => {
    const S = sRef.current;
    if (S.steam) return;
    S.selection.typeId = typeId;
    sync();
  }, [sync]);

  const toggleIngredient = useCallback((id) => {
    const S = sRef.current;
    if (S.steam || !S.ownedIngredients[id]) return;
    const arr = S.selection.ingredientIds;
    const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else arr.push(id);
    sync();
  }, [sync]);

  const buyIngredient = useCallback((id) => {
    const S = sRef.current;
    const ing = INGREDIENT_MAP[id];
    if (!ing || S.ownedIngredients[id]) return false;
    if (levelInfo(S).lvl < ing.unlockLevel || S.gold < ing.price) return false;
    S.gold -= ing.price;
    S.ownedIngredients[id] = true;
    sync();
    return true;
  }, [sync]);

  const startSteam = useCallback(() => {
    const S = sRef.current;
    if (S.steam) return false;
    const { typeId, ingredientIds } = S.selection;
    if (!typeId || ingredientIds.length === 0) return false;
    const baseTime = steamBaseTime(typeId, ingredientIds);
    S.steam = {
      typeId,
      ingredientIds: ingredientIds.slice(),
      baseTime,
      remaining: baseTime,
      startedAt: Date.now(),
    };
    sync();
    return true;
  }, [sync]);

  const eat = useCallback((dimsumId) => {
    const S = sRef.current;
    const i = S.inventory.findIndex((d) => d.id === dimsumId);
    if (i < 0) return;
    const d = S.inventory[i];
    S.inventory.splice(i, 1);
    S.buffs.push({ label: d.buff.label, until: Date.now() + (d.buff.hours || 1) * 3600 * 1000 });
    sync();
  }, [sync]);

  const sell = useCallback((dimsumId) => {
    const S = sRef.current;
    const i = S.inventory.findIndex((d) => d.id === dimsumId);
    if (i < 0) return;
    S.gold += S.inventory[i].sellPrice;
    S.inventory.splice(i, 1);
    sync();
  }, [sync]);

  const clearJustCompleted = useCallback(() => {
    justRef.current = null;
    sync();
  }, [sync]);

  // 클라우드 시드 — 기존 clicker_game_states 스키마에 매핑(coins→gold, total_clicks→totalSteamed, exp→exp)
  const seedFromCloud = useCallback((gs) => {
    if (!gs) return;
    const S = sRef.current;
    if ((gs.coins || 0) > S.gold) S.gold = gs.coins;
    if ((gs.total_clicks || 0) > S.totalSteamed) S.totalSteamed = gs.total_clicks;
    if ((gs.exp || 0) > S.exp) S.exp = gs.exp;
    sync();
  }, [sync]);

  return {
    snap, sRef,
    click, selectType, toggleIngredient, buyIngredient, startSteam, eat, sell,
    clearJustCompleted, seedFromCloud,
  };
}
