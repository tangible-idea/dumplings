import { ASSET, QUALITY, fmt } from '../lib/shop';

// 라운드 결과 — 도달 존/품질/예상가. 닫으면 키친에 딤섬이 추가된다.
export default function ShopResultPopup({ result, onClose }) {
  if (!result) return null;
  const q = QUALITY[result.quality];
  return (
    <div className="gate" onClick={onClose}>
      <div className="card result-card" onClick={(e) => e.stopPropagation()}>
        <img className="result-dish" src={ASSET(result.asset)} alt={result.name} />
        <h1 style={{ color: q.color }}>{q.label} {result.name}</h1>
        <p>
          게이지 <b>{Math.round(result.pct)}%</b> · 버튼 <b>{result.clicks}</b>회<br />
          <span style={{ color: q.color }}>{result.zone.label}</span> 존 도달
        </p>
        <div className="result-price">예상 판매가 🪙 {fmt(result.price)}</div>
        <button className="gbtn" onClick={onClose}>키친에 올리기 →</button>
      </div>
    </div>
  );
}
