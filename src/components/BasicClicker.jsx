import { useCallback, useEffect, useRef, useState } from 'react';
import { fmt } from '../lib/game';
import { supabase } from '../lib/supabase';

// 기본 클리커: 누른 횟수를 저장하고 친구들과 순위로 겨루는 단순 모드.
// 저장은 기존 clicker_game_states.total_clicks 컬럼을 재사용한다.
export default function BasicClicker({ myId, ready, profile, friends, initialClicks, toast }) {
  const [count, setCount] = useState(initialClicks || 0);
  const [pop, setPop] = useState(false);
  const [board, setBoard] = useState([]);
  const countRef = useRef(count);
  const dirtyRef = useRef(false);
  countRef.current = count;

  const bump = useCallback(() => {
    setCount((c) => c + 1);
    dirtyRef.current = true;
    setPop(true);
    setTimeout(() => setPop(false), 180);
  }, []);

  // 스페이스/엔터로도 클릭
  useEffect(() => {
    const h = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== ' ' && e.key !== 'Enter') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      bump();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [bump]);

  // 주기적 클라우드 저장 (변경분 있을 때만)
  useEffect(() => {
    if (!ready || !myId) return undefined;
    const save = async () => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      try {
        await supabase.from('clicker_game_states')
          .update({ total_clicks: Math.round(countRef.current) })
          .eq('owner_id', myId);
      } catch (e) { /* ignore */ }
    };
    const id = setInterval(save, 5000);
    window.addEventListener('beforeunload', save);
    return () => { clearInterval(id); save(); window.removeEventListener('beforeunload', save); };
  }, [ready, myId]);

  // 친구 + 내 점수로 랭킹 구성 (친구 점수는 클라우드에서 조회)
  const refreshBoard = useCallback(async () => {
    const ids = (friends || []).map((f) => f.id).filter(Boolean);
    let rows = [];
    if (ids.length) {
      const { data } = await supabase
        .from('clicker_game_states')
        .select('owner_id,total_clicks')
        .in('owner_id', ids);
      const byId = Object.fromEntries((data || []).map((r) => [r.owner_id, r.total_clicks || 0]));
      rows = (friends || []).map((f) => ({ id: f.id, name: f.nickname || '친구', score: byId[f.id] || 0 }));
    }
    rows.push({ id: myId, name: profile?.nickname || '나', score: countRef.current, me: true });
    rows.sort((a, b) => b.score - a.score);
    setBoard(rows);
  }, [friends, myId, profile]);

  useEffect(() => {
    if (!ready) return undefined;
    refreshBoard();
    const id = setInterval(refreshBoard, 8000);
    return () => clearInterval(id);
  }, [ready, refreshBoard]);

  const myRank = board.findIndex((r) => r.me) + 1;

  return (
    <div className="bc-wrap">
      <div className="bc-count">
        <div className={'bc-num' + (pop ? ' pop' : '')}>{fmt(count)}</div>
        <div className="bc-label">
          총 클릭 {myRank > 0 && `· 현재 ${myRank}위`}
        </div>
      </div>

      <button className="bc-btn" onClick={bump}>
        <span className="bc-btn-emoji">👆</span>
        <span className="bc-btn-sub">눌러!</span>
      </button>

      <div className="bc-board">
        <div className="bc-board-head">
          <span>🏆 랭킹</span>
          <span className="muted" style={{ fontSize: 12, fontWeight: 500 }}>친구 {(friends || []).length}명</span>
        </div>
        {board.length === 0 ? (
          <div className="bc-empty">친구를 추가하면 순위를 겨룰 수 있어요.</div>
        ) : (
          board.map((r, i) => (
            <div key={r.id || i} className={'bc-row' + (r.me ? ' me' : '')}>
              <span className={'bc-rank' + (i < 3 ? ' top' : '')}>{i + 1}</span>
              <span className="bc-name">
                {r.name}
                {r.me && <span className="bc-you">나</span>}
              </span>
              <span className="bc-score">{fmt(r.score)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
