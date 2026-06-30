import { useCallback, useEffect, useRef, useState } from 'react';
import { deviceAuth, deviceCode, deviceRegister, googleLogin, supabase } from './lib/supabase';
import { fmt, levelInfo, LEVEL_NAMES, unlockedDishes } from './lib/shop';
import { useShopGame } from './hooks/useShopGame';
import { useRealtime } from './hooks/useRealtime';
import Gate from './components/Gate';
import DishPicker from './components/DishPicker';
import SteamerStage from './components/SteamerStage';
import ShopResultPopup from './components/ShopResultPopup';
import KitchenServing from './components/KitchenServing';

function Toast({ data }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!data.ts) return undefined;
    setShow(true);
    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
  }, [data.ts]);
  return <div className={'toast' + (show ? ' show' : '')}>{data.msg}</div>;
}

export default function App() {
  const [gate, setGate] = useState({ state: 'loading' });
  const [auth, setAuth] = useState({ ready: false, session: null, myId: null, profile: null, coins: 0, exp: 0 });
  const [toastData, setToastData] = useState({ msg: '', ts: 0 });
  const toast = useCallback((msg) => setToastData({ msg, ts: Date.now() }), []);

  const level = levelInfo(auth.exp).lvl;

  // ---- 딤섬(키친/서빙) ----
  const [kitchen, setKitchen] = useState([]);
  const [serving, setServing] = useState([]);

  // ---- 선택된 딤섬 종류 + 게임 ----
  const [selected, setSelected] = useState(null);
  const game = useShopGame({ myId: auth.myId, level });

  // 해금된 종류 중 첫번째를 기본 선택
  useEffect(() => {
    if (!selected) {
      const u = unlockedDishes(level);
      if (u.length) setSelected(u[0].id);
    }
  }, [level, selected]);

  // 내 ESP32 기기 클릭 → 게임 게이지
  const onDeviceSignal = useCallback(() => { game.onDeviceClick(); }, [game]);
  useRealtime({ myId: auth.myId, friends: [], onSignal: () => {}, onDeviceSignal });

  // ---- 부팅 / 인증 ----
  const fnError = useCallback(async (error, data, fallback) => {
    const str = (v) => (v && typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''));
    if (data?.error) { console.error('[gate]', data.error); return str(data.error); }
    if (error?.context) {
      try { const j = await error.context.clone().json(); return str(j?.error ?? j?.message ?? fallback); } catch { /* ignore */ }
    }
    if (error) console.error('[gate]', error);
    return fallback;
  }, []);

  const bootRef = useRef(null);
  const register = useCallback(async () => {
    setGate({ state: 'loading', msg: '기기를 등록하는 중...' });
    const { data, error } = await deviceRegister();
    if (error || !data || !data.ok) { setGate({ state: 'error', msg: await fnError(error, data, '등록에 실패했어요.') }); return; }
    bootRef.current?.();
  }, [fnError]);

  const loadDishes = useCallback(async (myId) => {
    const { data, error } = await supabase
      .from('clicker_dishes')
      .select('*')
      .eq('owner_id', myId)
      .in('status', ['kitchen', 'serving'])
      .order('created_at', { ascending: true });
    if (error) { console.warn('[dishes]', error.message); return; }
    setKitchen((data || []).filter((d) => d.status === 'kitchen'));
    setServing((data || []).filter((d) => d.status === 'serving'));
  }, []);

  const boot = useCallback(async () => {
    if (!deviceCode) { setGate({ state: 'nocode' }); return; }
    setGate({ state: 'loading' });
    const { data: { session } } = await supabase.auth.getSession();
    const { data: res, error } = await deviceAuth();
    if (error || !res) { setGate({ state: 'error', msg: await fnError(error, res, '서버에 연결하지 못했어요.') }); return; }
    if (res.registered === false) {
      if (res.exists === false) { setGate({ state: 'notfound' }); return; }
      if (session) { setGate({ state: 'wifi' }); return; }
      setGate({ state: 'register' }); return;
    }
    if (res.needsLogin) { setGate({ state: 'login' }); return; }
    if (res.owner === false) { setGate({ state: 'owned' }); return; }

    const gs = res.gameState || {};
    setAuth({ ready: true, session, myId: session.user.id, profile: res.profile, coins: gs.coins || 0, exp: gs.exp || 0 });
    setGate(null);
    await loadDishes(session.user.id);
    toast(`${res.profile?.nickname || '사장님'}, 어서오세요! 🥟`);
  }, [fnError, loadDishes, toast]);
  bootRef.current = boot;

  useEffect(() => { boot(); /* eslint-disable-next-line */ }, []);

  // ---- 딤섬 판매 Realtime (cron이 status=sold 로 바꾸면 골드 반영) ----
  useEffect(() => {
    if (!auth.myId) return undefined;
    const ch = supabase
      .channel('dishes-' + auth.myId)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'clicker_dishes', filter: `owner_id=eq.${auth.myId}` },
        (payload) => {
          const row = payload.new;
          if (row.status === 'sold') {
            setServing((s) => s.filter((d) => d.id !== row.id));
            setKitchen((k) => k.filter((d) => d.id !== row.id));
            setAuth((a) => ({ ...a, coins: a.coins + (row.price || 0) }));
            toast(`손님이 ${row.asset ? '딤섬' : '딤섬'}을 샀어요! +🪙${fmt(row.price || 0)}`);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [auth.myId, toast]);

  // ---- 라운드 결과 닫기 → 키친에 딤섬 추가 + 경험치 ----
  const commitResult = useCallback(async () => {
    const r = game.result;
    game.reset();
    if (!r || !auth.myId) return;
    // 경험치 적립
    const newExp = auth.exp + r.exp;
    setAuth((a) => ({ ...a, exp: newExp }));
    supabase.from('clicker_game_states')
      .update({ exp: newExp, level: levelInfo(newExp).lvl })
      .eq('owner_id', auth.myId).then(({ error }) => { if (error) console.warn('[exp]', error.message); });
    // 딤섬 생성(키친)
    const { data, error } = await supabase.from('clicker_dishes')
      .insert({ owner_id: auth.myId, type_id: r.typeId, asset: r.asset, quality: r.quality, clicks: r.clicks, price: r.price, status: 'kitchen' })
      .select('*').single();
    if (error) { console.warn('[dish insert]', error.message); toast('딤섬 저장 실패'); return; }
    setKitchen((k) => [...k, data]);
  }, [game, auth.myId, auth.exp, toast]);

  // ---- 키친 → 서빙 ----
  const serveDish = useCallback(async (dishId) => {
    const dish = kitchen.find((d) => d.id === dishId);
    if (!dish) return;
    setKitchen((k) => k.filter((d) => d.id !== dishId));
    setServing((s) => [...s, { ...dish, status: 'serving' }]);
    const { error } = await supabase.from('clicker_dishes')
      .update({ status: 'serving', served_at: new Date().toISOString() }).eq('id', dishId);
    if (error) { console.warn('[serve]', error.message); toast('서빙 실패'); loadDishes(auth.myId); }
  }, [kitchen, auth.myId, loadDishes, toast]);

  const li = levelInfo(auth.exp);
  const pct = Math.min(100, (li.cur / li.need) * 100);
  const levelName = LEVEL_NAMES[Math.min(LEVEL_NAMES.length - 1, li.lvl - 1)];

  return (
    <>
      <Toast data={toastData} />
      {!gate && auth.ready && (
        <div className="shopgame">
          <header className="shopbar">
            <div>
              <div className="title">🥟 {auth.profile?.nickname || '딤섬'} 가게</div>
              <div className="level">Lv.{li.lvl} {levelName}</div>
            </div>
            <div className="coin"><span className="ic">🪙</span><span className="coins">{fmt(auth.coins)}</span></div>
          </header>

          <div className="progress"><div style={{ width: pct + '%' }} /></div>

          <DishPicker level={li.lvl} selected={selected} onSelect={setSelected} disabled={game.phase === 'steaming'} />

          <SteamerStage
            phase={game.phase}
            pct={game.pct}
            remaining={game.remaining}
            dishType={game.dishType}
            clicks={game.clicks}
            canStart={!!selected}
            onStart={() => game.start(selected)}
          />

          <KitchenServing kitchen={kitchen} serving={serving} onServe={serveDish} />
        </div>
      )}

      <ShopResultPopup result={game.phase === 'result' ? game.result : null} onClose={commitResult} />

      {gate && (
        <Gate
          gate={gate}
          deviceCode={deviceCode}
          onGoogle={googleLogin}
          onStart={boot}
          onRegister={register}
          onRetry={boot}
          onLogout={async () => { await supabase.auth.signOut(); googleLogin(); }}
          onCopy={(s) => { try { navigator.clipboard.writeText(s); toast('기기 키를 복사했어요'); } catch (e) { /* ignore */ } }}
        />
      )}
    </>
  );
}
