import { useState } from 'react';
import {
  CATEGORIES, INGREDIENTS, fmt, ingredientBuyable, ingredientUnlocked,
} from '../lib/game';

const BONUS_LABEL = {
  expPct: (v) => `경험치 +${Math.round(v * 100)}%`,
  sellGoldPct: (v) => `판매가 +${Math.round(v * 100)}%`,
  steamTime: (v) => `찜 시간 −${v}초`,
  gradeChance: (v, b) => `${b.minGrade}급↑ 확률 +${Math.round(v * 100)}%`,
  legendChance: (v) => `전설 확률 +${Math.round(v * 100)}%`,
  failDown: (v) => `하위등급 −${Math.round(v * 100)}%`,
  clickPower: (v) => `클릭당 −${v}초 추가`,
  extraAdjective: () => `형용사 +1`,
  randomGold: (v) => `랜덤 골드 +최대${v}`,
  eatBuff: () => `먹기 버프 강화`,
};

function bonusText(b) {
  const fn = BONUS_LABEL[b.type];
  return fn ? fn(b.value, b) : '';
}

export default function Shop({ snap, buyIngredient }) {
  const [tab, setTab] = useState(CATEGORIES[0].id);

  return (
    <aside className="shop">
      <div className="shopHead"><span>🛒 재료 상점</span><span className="shopGold">🪙 {fmt(snap.gold)}</span></div>
      <div className="tabs">
        {CATEGORIES.map((c) => (
          <button key={c.id} className={'tab' + (c.id === tab ? ' active' : '')} onClick={() => setTab(c.id)}>
            {c.emoji}
          </button>
        ))}
      </div>

      <div className="items">
        {INGREDIENTS.filter((g) => g.cat === tab).map((g) => {
          const owned = ingredientUnlocked(snap, g);
          const buyable = ingredientBuyable(snap, g);
          const levelLocked = snap.level.lvl < g.unlockLevel;
          return (
            <div
              key={g.id}
              className={'item' + (buyable ? ' afford' : '') + (!owned && !buyable ? ' locked' : '') + (owned ? ' owned' : '')}
              onClick={() => buyIngredient(g.id)}
            >
              <div className="emoji">{g.emoji}</div>
              <div className="body">
                <div className="name">
                  <span>{g.name}</span>
                  <span className="cnt">{owned ? '✓ 보유' : `Lv.${g.unlockLevel}`}</span>
                </div>
                <div className="desc">{bonusText(g.bonus)} · {g.adjectives.join('/')}</div>
                {owned
                  ? <div className="cost owned">해금 완료</div>
                  : levelLocked
                    ? <div className="cost no">Lv.{g.unlockLevel} 필요</div>
                    : <div className={'cost' + (buyable ? '' : ' no')}>🪙 {fmt(g.price)}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="stats">
        총 찜 <b>{snap.totalSteamed}</b> · 보유 골드 <b>{fmt(snap.gold)}</b><br />
        보관함 <b>{snap.inventory.length}</b>개 · 클릭당 <b>−{snap.clickPower.toFixed(1)}</b>초
      </div>
    </aside>
  );
}
