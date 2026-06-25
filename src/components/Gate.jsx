// 로그인 / 등록 게이트 오버레이
export default function Gate({ gate, deviceCode, onGoogle, onStart, onRetry, onDemo, onLogout, onCopy }) {
  const { state, msg, secret } = gate;

  let body = null;
  if (state === 'loading') {
    body = (<>
      <div className="logo">🥟</div><h1>클리커 키우기</h1>
      <div className="spinner" /><p>{msg || '불러오는 중...'}</p>
    </>);
  } else if (state === 'register') {
    body = (<>
      <div className="logo">🥟</div><h1>처음 오셨네요!</h1>
      <p>이 기기를 내 계정에 등록하려면 구글로 로그인하세요.<br />기기: <b>{deviceCode}</b></p>
      <button className="gbtn" onClick={onGoogle}>🔐 구글로 시작하기</button>
    </>);
  } else if (state === 'login') {
    body = (<>
      <div className="logo">🥟</div><h1>로그인이 필요해요</h1>
      <p>이 기기는 등록돼 있어요. 구글로 로그인하면 게임이 시작됩니다.</p>
      <button className="gbtn" onClick={onGoogle}>🔐 구글로 로그인</button>
    </>);
  } else if (state === 'secret') {
    body = (<>
      <div className="logo">✅</div><h1>등록 완료!</h1>
      <p>아래 <b>기기 키</b>를 ESP32 펌웨어(Poke)에 입력하세요.<br />이 화면에서만 보여요.</p>
      <div className="secret">{secret}</div>
      <button className="gbtn" onClick={() => onCopy(secret)}>📋 키 복사</button>
      <button className="gbtn ghost" onClick={onStart}>시작하기 →</button>
      <p className="warn">⚠️ 키는 안전하게 보관하세요. 분실 시 재발급이 필요합니다.</p>
    </>);
  } else if (state === 'owned') {
    body = (<>
      <div className="logo">🚫</div><h1>다른 계정의 기기</h1>
      <p>이 기기는 이미 다른 구글 계정에 등록되어 있어요.</p>
      <button className="gbtn ghost" onClick={onLogout}>다른 계정으로 로그인</button>
    </>);
  } else if (state === 'nocode') {
    body = (<>
      <div className="logo">🥟</div><h1>딤섬 찜기</h1>
      <p>클리커 기기의 링크로 접속하면 친구와 연결돼요.<br />지금은 기기 코드가 없어요.</p>
      {onDemo && <button className="gbtn ghost" onClick={onDemo}>데모로 시작하기 →</button>}
    </>);
  } else if (state === 'error') {
    body = (<>
      <div className="logo">⚠️</div><h1>문제가 발생했어요</h1>
      <p>{msg || '잠시 후 다시 시도해주세요.'}</p>
      <button className="gbtn ghost" onClick={onRetry}>다시 시도</button>
    </>);
  }

  return <div className="gate"><div className="card">{body}</div></div>;
}
