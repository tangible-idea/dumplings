import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME_DURATION_S, rollTarget, zoneFromPct, priceFor, QUALITY, DISH_MAP } from '../lib/shop';
import { publish, ctrlTopic } from '../lib/mqtt';

// 찌기 한 라운드의 상태머신.
//  idle → (찜기 탭) → steaming(타이머 + 기기클릭 수신) → result
// 클릭 입력은 ESP32 버튼만(onDeviceClick). 웹 탭 입력 없음.
export function useShopGame({ myId, level = 1 }) {
  const [phase, setPhase] = useState('idle'); // idle | steaming | result
  const [clicks, setClicks] = useState(0);
  const [remaining, setRemaining] = useState(GAME_DURATION_S);
  const [dishType, setDishType] = useState(null);
  const [result, setResult] = useState(null);

  const phaseRef = useRef('idle');  phaseRef.current = phase;
  const levelRef = useRef(level);   levelRef.current = level;
  const targetRef = useRef(0);
  const clicksRef = useRef(0);
  const endAtRef = useRef(0);
  const dishRef = useRef(null);
  const timerRef = useRef(null);

  const pct = targetRef.current ? Math.min(100, (clicks / targetRef.current) * 100) : 0;

  const finish = useCallback(() => {
    if (phaseRef.current !== 'steaming') return;
    clearInterval(timerRef.current);
    const t = targetRef.current || 1;
    const finalPct = Math.min(100, (clicksRef.current / t) * 100);
    const zone = zoneFromPct(finalPct);
    const dish = dishRef.current;
    const price = priceFor(dish.id, zone.quality, levelRef.current);
    setResult({
      typeId: dish.id, asset: dish.asset, name: dish.name,
      quality: zone.quality, pct: finalPct, clicks: clicksRef.current,
      price, exp: QUALITY[zone.quality].exp, zone,
    });
    setPhase('result');
  }, []);

  const start = useCallback((typeId) => {
    if (phaseRef.current === 'steaming') return;
    const type = DISH_MAP[typeId];
    if (!type) return;
    dishRef.current = type;
    setDishType(type);
    targetRef.current = rollTarget(levelRef.current);
    clicksRef.current = 0;
    setClicks(0);
    setResult(null);
    setRemaining(GAME_DURATION_S);
    setPhase('steaming');
    endAtRef.current = Date.now() + GAME_DURATION_S * 1000;

    // ESP32에 게임 시작 알림 (OLED 카운트다운)
    if (myId) publish(ctrlTopic(myId), { e: 'start', dur: GAME_DURATION_S });

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemaining(rem);
      if (Date.now() >= endAtRef.current) finish();
    }, 200);
  }, [myId, finish]);

  // 내 ESP32 기기가 보낸 클릭 신호 → steaming 중이면 게이지 상승.
  const onDeviceClick = useCallback(() => {
    if (phaseRef.current !== 'steaming') return;
    clicksRef.current += 1;
    setClicks(clicksRef.current);
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setResult(null);
    setClicks(0);
    setDishType(null);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  return { phase, clicks, pct, remaining, target: targetRef.current, dishType, result, start, onDeviceClick, reset };
}
