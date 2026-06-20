import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { fmt } from '../lib/game';

function drawDumpling(ctx, cx, cy, scale, sq) {
  const w = 150 * scale, h = w * 0.78;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1 + (1 - sq) * 0.5, sq);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, h * 0.46, w * 0.46, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f0d6ad';
  ctx.beginPath();
  ctx.ellipse(0, h * 0.06, w * 0.5, h * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff4dd';
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.48, h * 0.44, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#e7caa0';
  ctx.lineWidth = Math.max(2, w * 0.02);
  ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * w * 0.07, -h * 0.42);
    ctx.quadraticCurveTo(i * w * 0.15, -h * 0.2, i * w * 0.2, -h * 0.02);
    ctx.stroke();
  }
  ctx.fillStyle = '#e7caa0';
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.44, w * 0.09, h * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,140,160,0.45)';
  ctx.beginPath();
  ctx.ellipse(-w * 0.24, h * 0.08, w * 0.07, h * 0.05, 0, 0, Math.PI * 2);
  ctx.ellipse(w * 0.24, h * 0.08, w * 0.07, h * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4b3829';
  ctx.beginPath();
  ctx.arc(-w * 0.15, -h * 0.02, w * 0.035, 0, Math.PI * 2);
  ctx.arc(w * 0.15, -h * 0.02, w * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-w * 0.135, -h * 0.04, w * 0.012, 0, Math.PI * 2);
  ctx.arc(w * 0.165, -h * 0.04, w * 0.012, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4b3829';
  ctx.lineWidth = Math.max(1.5, w * 0.016);
  ctx.beginPath();
  ctx.arc(0, h * 0.02, w * 0.05, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

function drawStar(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    const a2 = a + Math.PI / 5;
    ctx.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function spawnClickFx(s, power) {
  const cx = s.CW / 2 + (Math.random() - 0.5) * 60;
  const cy = s.CH / 2 - 40;
  s.floaters.push({ x: cx, y: cy, vy: -70, life: 1, text: '+' + fmt(power) });
  const n = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 120;
    s.stars.push({ x: s.CW / 2, y: s.CH / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 1, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, sz: 8 + Math.random() * 8 });
  }
}

function render(ctx, s, dt) {
  ctx.clearRect(0, 0, s.CW, s.CH);
  s.squash += (1 - s.squash) * Math.min(1, dt * 12);
  const bob = Math.sin(s.t * 2) * 6;
  const sc = Math.min(s.CW, s.CH) / 240;
  drawDumpling(ctx, s.CW / 2, s.CH / 2 + bob, sc, s.squash);

  for (const st of s.stars) {
    st.vy += 260 * dt; st.x += st.vx * dt; st.y += st.vy * dt; st.rot += st.vr * dt; st.life -= dt * 1.3;
    ctx.fillStyle = `rgba(255,210,74,${Math.max(0, st.life)})`;
    drawStar(ctx, st.x, st.y, st.sz, st.rot);
  }
  s.stars = s.stars.filter((st) => st.life > 0);

  for (const f of s.floaters) {
    f.y += f.vy * dt; f.vy *= 0.96; f.life -= dt * 1.1;
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = f.color || '#ffe89a';
    ctx.font = `bold ${Math.round(24 * sc)}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }
  s.floaters = s.floaters.filter((f) => f.life > 0);
}

const Character = forwardRef(function Character(_props, ref) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const stRef = useRef({ CW: 0, CH: 0, DPR: 1, squash: 1, floaters: [], stars: [], t: 0 });

  useImperativeHandle(ref, () => ({
    triggerClick(power) {
      const s = stRef.current;
      s.squash = 0.74;
      spawnClickFx(s, power);
    },
    triggerFriend(name, poke) {
      const s = stRef.current;
      s.floaters.push({
        x: s.CW / 2, y: s.CH / 2 - 70, vy: -50, life: 1.4,
        text: (poke ? '👉 ' : '🖱️ ') + name, color: poke ? '#ffb37a' : '#9ad4ff',
      });
    },
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const ctx = canvas.getContext('2d');
    const s = stRef.current;

    const resize = () => {
      const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = stage.clientWidth, h = stage.clientHeight;
      if (w <= 0 || h <= 0) return;
      s.CW = w; s.CH = h; s.DPR = DPR;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    let ro;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(stage); }

    let raf;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now; s.t += dt;
      render(ctx, s, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', resize);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <div className="stage" ref={stageRef}>
      <canvas id="char" ref={canvasRef} />
    </div>
  );
});

export default Character;
