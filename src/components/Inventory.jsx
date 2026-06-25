import { DIMSUM_TYPE_MAP, GRADE_MAP, fmt } from '../lib/game';

// 보관 중인 완성 딤섬 목록 + 먹기/판매. buffs는 표시 전용(cosmetic).
export default function Inventory({ snap, game }) {
  const { inventory } = snap;
  const now = Date.now();
  const activeBuffs = (snap.buffs || []).filter((b) => b.until > now);

  return (
    <div className="inventory">
      <div className="invHead"><span>🍱 보관함</span><span className="invCnt">{inventory.length}</span></div>

      {activeBuffs.length > 0 && (
        <div className="buffRow">
          {activeBuffs.map((b, i) => (
            <span key={i} className="buffChip" title={b.label}>✨ {b.label}</span>
          ))}
        </div>
      )}

      {inventory.length === 0 ? (
        <div className="emptyHint">아직 완성된 딤섬이 없어요.</div>
      ) : (
        <div className="invGrid">
          {inventory.map((d) => {
            const type = DIMSUM_TYPE_MAP[d.typeId];
            const g = GRADE_MAP[d.grade];
            return (
              <div key={d.id} className="invCard">
                <div className="invTop">
                  <span className="invEmoji">{type?.emoji}</span>
                  <span className="gradeBadge" style={{ background: g?.color }}>{d.grade}</span>
                </div>
                <div className="invName">{d.adjectives.join(' ')} {type?.name}</div>
                <div className="invActions">
                  <button className="invBtn eat" onClick={() => game.eat(d.id)}>먹기</button>
                  <button className="invBtn sell" onClick={() => game.sell(d.id)}>🪙 {fmt(d.sellPrice)}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
