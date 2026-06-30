import { ZONES } from '../lib/shop';

// 세로 목표 프로그레스바. 아래(0%)→위(100%)로 스팀이 차오르고,
// 5색 존(빨/노/초/노/빨) 위에 현재 게이지 마커를 보여준다.
// frozen=true 면 종료 시점 도달 위치를 강조.
export default function GoalBar({ pct = 0, frozen = false }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="goalbar">
      <div className="goalbar-track">
        {/* 존 배경 (아래가 0%라 역순으로 쌓음) */}
        {[...ZONES].reverse().map((z, i) => (
          <div
            key={i}
            className="goalbar-zone"
            style={{ height: `${z.to - z.from}%`, background: z.color }}
            title={z.label}
          />
        ))}
        {/* 차오른 스팀 */}
        <div className="goalbar-fill" style={{ height: `${clamped}%` }} />
        {/* 현재 위치 마커 */}
        <div className={'goalbar-marker' + (frozen ? ' frozen' : '')} style={{ bottom: `${clamped}%` }}>
          <span className="goalbar-pct">{Math.round(clamped)}%</span>
        </div>
      </div>
    </div>
  );
}
