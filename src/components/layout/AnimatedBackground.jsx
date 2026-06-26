import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../lib/ThemeContext';

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const cfg = {
      light: {
        bg:        'rgba(255,252,247,1)',
        orbs: [
          { r:210, g:155, b:60,  opacity:0.07, size:340 },
          { r:60,  g:130, b:100, opacity:0.045,size:290 },
          { r:230, g:190, b:100, opacity:0.055,size:260 },
        ],
        particle:  'rgba(180,120,40,',
        pOpacity:  [0.06, 0.22],
        line:      '180,120,40',
        lineAlpha: 0.06,
        lineLen:   130,
        numPts:    40,
        ptSize:    [0.4, 1.6],
        ptSpeed:   0.22,
      },
      dark: {
        bg:        'rgba(12,9,5,1)',
        orbs: [
          { r:220, g:155, b:55,  opacity:0.08, size:360 },
          { r:45,  g:120, b:90,  opacity:0.055,size:310 },
          { r:200, g:120, b:30,  opacity:0.065,size:250 },
        ],
        particle:  'rgba(220,155,55,',
        pOpacity:  [0.08, 0.32],
        line:      '220,155,55',
        lineAlpha: 0.08,
        lineLen:   125,
        numPts:    40,
        ptSize:    [0.4, 1.6],
        ptSpeed:   0.22,
      },
    };

    const t = isDark ? cfg.dark : cfg.light;

    const orbs = t.orbs.map(o => ({
      ...o,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.14,
      phase: Math.random() * Math.PI * 2,
    }));

    const pts = Array.from({ length: t.numPts }, () => ({
      x:   Math.random() * canvas.width,
      y:   Math.random() * canvas.height,
      vx:  (Math.random() - 0.5) * t.ptSpeed,
      vy:  (Math.random() - 0.5) * t.ptSpeed,
      r:   t.ptSize[0] + Math.random() * (t.ptSize[1] - t.ptSize[0]),
      op:  t.pOpacity[0] + Math.random() * (t.pOpacity[1] - t.pOpacity[0]),
      pulse:  Math.random() * Math.PI * 2,
      pulseS: 0.006 + Math.random() * 0.010,
    }));

    let raf;
    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;

      // Fill full background every frame
      ctx.fillStyle = t.bg;
      ctx.fillRect(0, 0, W, H);

      // Orbs
      orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -o.size) o.x = W + o.size;
        if (o.x > W + o.size) o.x = -o.size;
        if (o.y < -o.size) o.y = H + o.size;
        if (o.y > H + o.size) o.y = -o.size;
        o.phase += 0.003;

        const sz = o.size * (1 + Math.sin(o.phase) * 0.07);
        const g  = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, sz);
        g.addColorStop(0,   `rgba(${o.r},${o.g},${o.b},${o.opacity})`);
        g.addColorStop(0.5, `rgba(${o.r},${o.g},${o.b},${o.opacity * 0.38})`);
        g.addColorStop(1,   `rgba(${o.r},${o.g},${o.b},0)`);
        ctx.beginPath();
        ctx.arc(o.x, o.y, sz, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // Connection lines
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < t.lineLen) {
            const a = (1 - d / t.lineLen) * t.lineAlpha;
            ctx.strokeStyle = `rgba(${t.line},${a})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      // Particles
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        p.pulse += p.pulseS;
        const a = p.op * (0.65 + Math.sin(p.pulse) * 0.35);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${t.particle}${a})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1,
        display: 'block',
      }}
    />
  );
}
