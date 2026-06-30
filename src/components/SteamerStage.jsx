import { ASSET, GAME_DURATION_S } from '../lib/shop';
import GoalBar from './GoalBar';

// 가운데 찜기 + 세로 목표바. phase 에 따라 상태가 바뀐다.
//  idle    : 찜기 탭 → onStart
//  steaming: 카운트다운 + 스팀 게이지 상승
//  result  : 잠깐 결과 대기(팝업은 상위에서)
export default function SteamerStage({ phase, pct, remaining, dishType, clicks, onStart, canStart }) {
  const steaming = phase === 'steaming';
  return (
    <div className="gstage">
      <GoalBar pct={pct} frozen={phase === 'result'} />

      <div className="steamer-wrap">
        <button
          className={'steamer' + (steaming ? ' on' : '')}
          onClick={() => { if (phase === 'idle' && canStart) onStart(); }}
          disabled={phase !== 'idle' || !canStart}
        >
          <img
            className="steamer-img"
            src={ASSET(steaming ? 'dimsum_steamer_open.png' : 'dimsum_bamboo_steamer_empty.png')}
            alt="찜기"
            draggable={false}
          />
          {steaming && (
            <div className="steam-puffs">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="puff" style={{ animationDelay: `${i * 0.25}s` }} />
              ))}
            </div>
          )}
        </button>

        {steaming ? (
          <div className="stage-info">
            <div className="countdown">{remaining}s</div>
            <div className="clicks">버튼 {clicks}회 · 초록에서 멈춰요!</div>
          </div>
        ) : phase === 'idle' ? (
          <div className="stage-info">
            <div className="hint-big">{canStart ? '찜기를 눌러 찌기 시작' : '딤섬을 먼저 골라요'}</div>
            <div className="hint-sub">기기 버튼을 {GAME_DURATION_S}초간 연타!</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
