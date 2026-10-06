import { useEffect, useRef } from "react";

/** Subtle animated blueprint background: grid, drifting connected nodes, data pulses. */
export function Background() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext("2d")!;
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); window.addEventListener("resize", resize);
    const N = Math.min(60, Math.round((w * h) / 26000));
    const pts = Array.from({ length: N }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15 }));
    const pulses = Array.from({ length: 6 }, () => ({ row: Math.floor(Math.random() * 30), x: Math.random() * w, v: 0.6 + Math.random() * 1.2, vert: Math.random() > 0.5 }));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const g = 48;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(120,200,230,0.035)";
      ctx.beginPath();
      for (let x = 0; x < w; x += g) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
      for (let y = 0; y < h; y += g) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
      ctx.stroke();
      for (const p of pulses) {
        p.x += p.v; const lim = p.vert ? h : w; if (p.x > lim + 120) { p.x = -120; p.row = Math.floor(Math.random() * 30); }
        const grad = p.vert ? ctx.createLinearGradient(0, p.x - 120, 0, p.x) : ctx.createLinearGradient(p.x - 120, 0, p.x, 0);
        grad.addColorStop(0, "rgba(80,220,240,0)"); grad.addColorStop(1, "rgba(80,220,240,0.35)");
        ctx.strokeStyle = grad; ctx.beginPath();
        if (p.vert) { const x = p.row * g + 0.5; ctx.moveTo(x, p.x - 120); ctx.lineTo(x, p.x); } else { const y = p.row * g + 0.5; ctx.moveTo(p.x - 120, y); ctx.lineTo(p.x, y); }
        ctx.stroke();
      }
      for (const p of pts) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.hypot(dx, dy);
        if (d < 150) { ctx.strokeStyle = `rgba(110,210,240,${0.08 * (1 - d / 150)})`; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
      }
      ctx.fillStyle = "rgba(140,230,250,0.5)";
      for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2); ctx.fill(); }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 -top-40 size-[520px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute -bottom-52 right-0 size-[620px] rounded-full bg-info/10 blur-[140px]" />
      <canvas ref={ref} className="absolute inset-0 size-full" />
    </div>
  );
}
