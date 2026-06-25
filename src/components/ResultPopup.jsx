import { DIMSUM_TYPE_MAP, GRADE_MAP, fmt } from '../lib/game';

// 완성 결과 팝업: 수증기→뚜껑 열림→딤섬 등장→등급 배지 회전→능력치 카드 슬라이드업.
export default function ResultPopup({ result, onEat, onSell }) {
  if (!result) return null;
  const type = DIMSUM_TYPE_MAP[result.typeId];
  const g = GRADE_MAP[result.grade];

  return (
    <div className="resultOverlay">
      <div className="resultCard">
        <div className="resultSteam">
          <span className="rp s1" /><span className="rp s2" /><span className="rp s3" />
        </div>

        <div className="lid">🔺</div>
        <div className="resultDimsum">{type?.emoji}</div>

        <div className="resultBadge" style={{ background: g?.color, boxShadow: `0 0 30px ${g?.color}` }}>
          {result.grade}
        </div>

        <div className="resultName">{result.adjectives.join(' ')} {type?.name}</div>

        <div className="resultStats">
          <div className="rStat"><span>경험치</span><b>+{result.expGain}</b></div>
          <div className="rStat"><span>판매가</span><b>🪙 {fmt(result.sellPrice)}</b></div>
          <div className="rStat buffStat"><span>버프</span><b>{result.buff?.label}</b></div>
        </div>

        <div className="resultBtns">
          <button className="resultBtn eat" onClick={onEat}>🍽️ 먹기</button>
          <button className="resultBtn sell" onClick={onSell}>🪙 판매 ({fmt(result.sellPrice)})</button>
        </div>
      </div>
    </div>
  );
}
