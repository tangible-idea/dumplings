import { useRef, useState } from 'react';
import { ASSET, DISH_MAP, QUALITY, fmt } from '../lib/shop';

// 키친(완성 대기) → 서빙(고객 판매 대기) 드래그앤드롭.
// 모바일 터치를 위해 Pointer 이벤트 + setPointerCapture 사용.
// 드래그가 어려운 경우를 위해 각 항목에 '서빙' 버튼 폴백 제공.
function KitchenDish({ dish, dropRef, onServe }) {
  const [drag, setDrag] = useState(null); // { x, y } or null
  const startRef = useRef(null);
  const movedRef = useRef(false);

  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
    setDrag({ x: e.clientX, y: e.clientY });
  };
  const onMove = (e) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.hypot(dx, dy) > 6) movedRef.current = true;
    setDrag({ x: e.clientX, y: e.clientY });
  };
  const onUp = (e) => {
    const wasDrag = movedRef.current;
    startRef.current = null;
    setDrag(null);
    if (!wasDrag) return; // 그냥 탭 → 무시(폴백 버튼 사용)
    const r = dropRef.current?.getBoundingClientRect();
    if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      onServe(dish.id);
    }
  };

  const q = QUALITY[dish.quality] || QUALITY.bad;
  return (
    <div className="kdish">
      <button
        className="kdish-grab"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={drag ? { position: 'fixed', left: drag.x - 32, top: drag.y - 32, zIndex: 200, touchAction: 'none', opacity: 0.9 } : { touchAction: 'none' }}
      >
        <img src={ASSET(dish.asset)} alt={dish.name} draggable={false} />
      </button>
      <div className="kdish-meta">
        <span style={{ color: q.color }}>●</span> 🪙{fmt(dish.price)}
      </div>
      <button className="kdish-serve" onClick={() => onServe(dish.id)}>서빙 →</button>
    </div>
  );
}

export default function KitchenServing({ kitchen, serving, onServe }) {
  const dropRef = useRef(null);
  return (
    <div className="kitchen-serving">
      <div className="panel">
        <div className="panel-title">🍳 키친 <span className="muted">{kitchen.length}</span></div>
        <div className="kgrid">
          {kitchen.length === 0 && <div className="empty">찐 딤섬이 여기 쌓여요</div>}
          {kitchen.map((d) => (
            <KitchenDish key={d.id} dish={withAsset(d)} dropRef={dropRef} onServe={onServe} />
          ))}
        </div>
      </div>

      <div className="panel serving-panel" ref={dropRef}>
        <div className="panel-title">🧺 서빙대 <span className="muted">{serving.length}</span></div>
        <div className="kgrid">
          {serving.length === 0 && <div className="empty">여기로 드래그하면 손님이 사가요</div>}
          {serving.map((d) => {
            const dd = withAsset(d);
            return (
              <div key={d.id} className="sdish">
                <img src={ASSET(dd.asset)} alt={dd.name} draggable={false} />
                <div className="kdish-meta">🪙{fmt(d.price)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// DB 행에는 asset/name 이 있지만, 누락 대비 type_id로 보강.
function withAsset(d) {
  const t = DISH_MAP[d.type_id || d.typeId];
  return {
    id: d.id,
    name: d.name || t?.name || '딤섬',
    asset: d.asset || t?.asset || 'dimsum_har_gow.png',
    quality: d.quality,
    price: d.price,
  };
}
