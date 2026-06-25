import { forwardRef } from 'react';
import Character from './Character';
import {
  DIMSUM_TYPE_MAP, DIMSUM_TYPES, INGREDIENTS, INGREDIENT_MAP, steamBaseTime,
} from '../lib/game';

// 찜 메인: steam 없으면 타입+재료 선택 화면, 진행 중이면 타이머/프로그레스/찜기.
const SteamStation = forwardRef(function SteamStation({ snap, game, onClick }, characterRef) {
  const { steam, selection } = snap;

  if (steam) {
    const type = DIMSUM_TYPE_MAP[steam.typeId];
    const pct = Math.min(100, Math.max(0, (1 - steam.remaining / steam.baseTime) * 100));
    return (
      <div className="steamStation steaming">
        <div className="steamHead">
          <span className="steamType">{type?.emoji} {type?.name} 찜는 중…</span>
        </div>
        <div className="stage" onClick={onClick} role="button" tabIndex={0}>
          <Character ref={characterRef} />
          <div className="steam-puff s1" /><div className="steam-puff s2" /><div className="steam-puff s3" />
        </div>
        <div className="steamTimer">{steam.remaining.toFixed(1)}<span>초</span></div>
        <div className="progress steamProgress"><div style={{ width: pct + '%' }} /></div>
        <div className="steamHint">👆 클릭/스페이스로 빨리 익혀요 (클릭당 −{snap.clickPower.toFixed(1)}초)</div>
      </div>
    );
  }

  const ids = selection.ingredientIds;
  const owned = INGREDIENTS.filter((g) => snap.ownedIngredients[g.id]);
  const est = ids.length ? steamBaseTime(selection.typeId, ids) : DIMSUM_TYPE_MAP[selection.typeId]?.baseTime;
  const canStart = !!selection.typeId && ids.length > 0;

  return (
    <div className="steamStation">
      <div className="steamHead"><span>🧺 무엇을 찔까요?</span></div>

      <div className="typePicker">
        {DIMSUM_TYPES.map((t) => (
          <button
            key={t.id}
            className={'typeChip' + (selection.typeId === t.id ? ' active' : '')}
            onClick={() => game.selectType(t.id)}
          >
            <span className="te">{t.emoji}</span>
            <span className="tn">{t.name}</span>
            <span className="tt">{t.baseTime}초</span>
          </button>
        ))}
      </div>

      <div className="ingredientLabel">재료 선택 {ids.length > 0 && `(${ids.length})`}</div>
      <div className="ingredientPick">
        {owned.length === 0 && <div className="emptyHint">상점에서 재료를 먼저 구매하세요 🛒</div>}
        {owned.map((g) => (
          <button
            key={g.id}
            className={'ingChip' + (ids.includes(g.id) ? ' on' : '')}
            onClick={() => game.toggleIngredient(g.id)}
            title={g.name}
          >
            <span className="ie">{g.emoji}</span><span className="in">{g.name}</span>
          </button>
        ))}
      </div>

      <div className="startRow">
        <span className="estTime">예상 {Math.round(est)}초</span>
        <button className="startBtn" disabled={!canStart} onClick={() => game.startSteam()}>
          🔥 찜 시작
        </button>
      </div>
      {ids.length > 0 && (
        <div className="selChosen">
          {ids.map((id) => INGREDIENT_MAP[id]?.emoji).join(' ')}
        </div>
      )}
    </div>
  );
});

export default SteamStation;
