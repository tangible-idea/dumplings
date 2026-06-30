// 로그인/기기 등록 직후 클리커 방식을 고르는 카드 선택 화면
const MODES = [
  {
    id: 'dimsum',
    emoji: '🥟',
    title: '딤섬 찜 게임',
    desc: '재료를 골라 딤섬을 찌고, 클릭으로 빨리 익혀요. 완성할 때마다 등급과 버프가 랜덤으로 정해지는 수집형 게임이에요.',
    tags: ['🎲 랜덤 등급', '🍱 수집', '✨ 버프'],
  },
  {
    id: 'basic',
    emoji: '👆',
    title: '기본 클리커 게임',
    desc: '단순하게 누르고 또 눌러요. 클릭 횟수가 저장되고, 친구들과 누가 더 많이 눌렀는지 순위로 겨뤄요.',
    tags: ['🏆 랭킹', '💾 저장', '⚡ 심플'],
  },
];

export default function ModeSelect({ onSelect }) {
  return (
    <div className="gate">
      <div className="card mode-card">
        <div className="mode-head">
          <div className="logo">🎮</div>
          <h1>어떤 방식으로 즐길까요?</h1>
          <p>언제든 다시 바꿀 수 있어요.</p>
        </div>

        <div className="mode-grid">
          {MODES.map((m) => (
            <button key={m.id} className="mode-option" onClick={() => onSelect(m.id)}>
              <span className="mo-emoji">{m.emoji}</span>
              <div className="mo-title">{m.title}</div>
              <p className="mo-desc">{m.desc}</p>
              <div className="mo-tags">
                {m.tags.map((t) => <span key={t} className="badge">{t}</span>)}
              </div>
              <span className="mo-cta">이걸로 시작하기 →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
