import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 180;
const CONNECT_DIST   = 120;
const MOUSE_DIST     = 150;
const REPULSE_FORCE  = 0.018;
const SPEED_BASE     = 0.25;
const SPEED_SPREAD   = 0.35;

const PALETTE = [
  [120, 200, 255],
  [80,  180, 255],
  [160, 230, 255],
  [200, 240, 255],
  [100, 160, 230],
  [60,  140, 220],
  [220, 245, 255],
];

function rand(min, max) { return min + Math.random() * (max - min); }
function pick(arr)      { return arr[Math.floor(Math.random() * arr.length)]; }

export default function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    let W, H, animId;
    let frame     = 0;
    let particles = [];
    const mouse   = { x: -9999, y: -9999 };

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x  = rand(0, W);
        this.y  = rand(0, H);
        const angle = rand(0, Math.PI * 2);
        const speed = SPEED_BASE + rand(0, SPEED_SPREAD);
        this.vx  = Math.cos(angle) * speed;
        this.vy  = Math.sin(angle) * speed;
        this.r   = rand(1.5, 3.0);
        this.rgb = pick(PALETTE);
        this.alpha       = rand(0.35, 0.9);
        this.pulseOffset = rand(0, Math.PI * 2);
        this.pulseSpeed  = rand(0.005, 0.02);
        this.currentAlpha = this.alpha;
      }

      update() {
        const dx    = this.x - mouse.x;
        const dy    = this.y - mouse.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < MOUSE_DIST * MOUSE_DIST && dist2 > 0.001) {
          const dist  = Math.sqrt(dist2);
          const force = (MOUSE_DIST - dist) / MOUSE_DIST;
          this.vx += (dx / dist) * force * REPULSE_FORCE * 60;
          this.vy += (dy / dist) * force * REPULSE_FORCE * 60;
        }
        const spd    = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpd = SPEED_BASE + SPEED_SPREAD + 1.5;
        if (spd > maxSpd) { this.vx = (this.vx / spd) * maxSpd; this.vy = (this.vy / spd) * maxSpd; }
        const naturalSpd = SPEED_BASE + SPEED_SPREAD * 0.4;
        if (spd > naturalSpd) { this.vx *= 0.995; this.vy *= 0.995; }

        this.x += this.vx;
        this.y += this.vy;
        const m = this.r + 1;
        if (this.x < m)     { this.x = m;     this.vx =  Math.abs(this.vx); }
        if (this.x > W - m) { this.x = W - m; this.vx = -Math.abs(this.vx); }
        if (this.y < m)     { this.y = m;     this.vy =  Math.abs(this.vy); }
        if (this.y > H - m) { this.y = H - m; this.vy = -Math.abs(this.vy); }

        this.currentAlpha = this.alpha * (0.75 + 0.25 * Math.sin(frame * this.pulseSpeed + this.pulseOffset));
      }

      draw() {
        const [r, g, b] = this.rgb;
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 3);
        grd.addColorStop(0,   `rgba(${r},${g},${b},${this.currentAlpha})`);
        grd.addColorStop(0.4, `rgba(${r},${g},${b},${this.currentAlpha * 0.5})`);
        grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, this.currentAlpha * 1.4)})`;
        ctx.fill();
      }
    }

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function build() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
    }

    function tick() {
      animId = requestAnimationFrame(tick);
      frame++;
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < particles.length; i++) particles[i].update();

      ctx.lineCap = 'round';
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b   = particles[j];
          const dx  = a.x - b.x;
          const dy  = a.y - b.y;
          const d2  = dx * dx + dy * dy;
          if (d2 < CONNECT_DIST * CONNECT_DIST) {
            const t  = 1 - Math.sqrt(d2) / CONNECT_DIST;
            const r  = (a.rgb[0] + b.rgb[0]) >> 1;
            const g  = (a.rgb[1] + b.rgb[1]) >> 1;
            const bl = (a.rgb[2] + b.rgb[2]) >> 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.lineWidth   = 0.5 + t * 0.5;
            ctx.strokeStyle = `rgba(${r},${g},${bl},${t * t * 0.55 * Math.min(a.currentAlpha, b.currentAlpha)})`;
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < particles.length; i++) particles[i].draw();
    }

    const onResize  = () => resize();
    const onMove    = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave   = () => { mouse.x = -9999; mouse.y = -9999; };
    const onTouch   = e => { if (e.touches.length > 0) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; } };
    const onTouchEnd = () => { mouse.x = -9999; mouse.y = -9999; };

    window.addEventListener('resize',     onResize);
    window.addEventListener('mousemove',  onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchmove',  onTouch,    { passive: true });
    window.addEventListener('touchend',   onTouchEnd);

    resize();
    build();
    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize',     onResize);
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('touchmove',  onTouch);
      window.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: '#050d16',
        display: 'block',
      }}
    />
  );
}
