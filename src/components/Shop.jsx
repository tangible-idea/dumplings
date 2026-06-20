import { useState } from 'react';
import { GENS, clickUpgradeCost, fmt, genCost } from '../lib/game';

const TABS = [
  { id: 'friends', label: '동료들' },
  { id: 'upgrade', label: '강화' },
  { id: 'achieve', label: '업적' },
  { id: 'rebirth', label: '환생' },
  { id: 'room', label: '방' },
  { id: 'summon', label: '소환' },
];

export default function Shop({ snap, buyGen, buyClickUpgrade }) {
  const [tab, setTab] = useState('friends');

  return (
    <aside className="shop">
      <div className="shopHead"><span>★ 상점 ★</span><span className="shopIcons">⚙️</span></div>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={'tab' + (t.id === tab ? ' active' : '')} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="items">
        {tab === 'friends' && GENS.map((g, i) => {
          const owned = snap.gens[i];
          const cost = genCost(i, owned);
          const can = snap.coins >= cost;
          return (
            <div
              key={i}
              className={'item' + (can ? ' afford' : '') + (!can && owned === 0 ? ' locked' : '')}
              onClick={() => buyGen(i)}
            >
              <div className="emoji">{g.emoji}</div>
              <div className="body">
                <div className="name"><span>{g.name}</span><span className="cnt">{owned}</span></div>
                <div className="desc">{g.desc}</div>
                <div className={'cost' + (can ? '' : ' no')}>🪙 {fmt(cost)}</div>
              </div>
            </div>
          );
        })}

        {tab === 'upgrade' && (() => {
          const cost = clickUpgradeCost(snap);
          const can = snap.coins >= cost;
          return (
            <div className={'item' + (can ? ' afford' : '')} onClick={buyClickUpgrade}>
              <div className="emoji">✊</div>
              <div className="body">
                <div className="name"><span>클릭 강화</span><span className="cnt">Lv.{snap.clickLevel}</span></div>
                <div className="desc">클릭당 코인이 +1 늘어나요</div>
                <div className={'cost' + (can ? '' : ' no')}>🪙 {fmt(cost)}</div>
              </div>
            </div>
          );
        })()}

        {!['friends', 'upgrade'].includes(tab) && (
          <div className="placeholder">곧 만나요! 🥟 (준비 중인 기능이에요)</div>
        )}
      </div>

      <div className="stats">
        총 클릭 <b>{snap.totalClicks}</b> · 누적 코인 <b>{fmt(snap.totalEarned)}</b><br />
        클릭당 <b>{fmt(snap.clickPower)}</b> 코인 · 초당 <b>{fmt(snap.perSec)}</b>
      </div>
    </aside>
  );
}
