"use client";

import * as React from "react";

// Traînée de pixels qui suit la souris (et le doigt sur mobile), posée au-dessus d'un décor.
// Chaque case prend la couleur du décor à cet endroit (si une source est fournie : image ou toile),
// éclaircie et teintée, puis s'efface doucement. Rien si l'appareil demande moins d'animations.

type Props = {
  /** Image ou toile à échantillonner, alignée sur la zone (recadrage « cover »). */
  getSource?: () => HTMLImageElement | HTMLCanvasElement | null;
  /** Couleur de teinte des cases. */
  tint?: [number, number, number];
  /** Part de la teinte, de 0 (couleur du décor) à 1 (teinte pure). */
  mix?: number;
  /** Opacité maximale d'une case. */
  strength?: number;
  className?: string;
};

export function PixelTrail({ getSource, tint = [255, 244, 222], mix = 0.25, strength = 0.95, className }: Props) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const opts = React.useRef({ getSource, tint, mix, strength });
  React.useEffect(() => {
    opts.current = { getSource, tint, mix, strength };
  });

  React.useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tiny = document.createElement("canvas");
    const tctx = tiny.getContext("2d", { willReadFrequently: true })!;
    let colors: Uint8ClampedArray | null = null;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let cell = 22;
    const cells = new Map<number, number>();
    let raf = 0;
    let last = 0;
    let lastPt: { x: number; y: number } | null = null;

    const setup = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cell = w < 768 ? 16 : 22;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      tiny.width = Math.ceil(w / cell);
      tiny.height = Math.ceil(h / cell);
      colors = null;
    };
    const sample = () => {
      const src = opts.current.getSource?.();
      if (!src) return (colors = null);
      const sw = src instanceof HTMLImageElement ? src.naturalWidth : src.width;
      const sh = src instanceof HTMLImageElement ? src.naturalHeight : src.height;
      if (!sw || !sh) return (colors = null);
      // recadrage « cover », comme object-fit: cover
      const s = Math.max(tiny.width / sw, tiny.height / sh);
      const dw = sw * s;
      const dh = sh * s;
      try {
        tctx.drawImage(src, (tiny.width - dw) / 2, (tiny.height - dh) / 2, dw, dh);
        colors = tctx.getImageData(0, 0, tiny.width, tiny.height).data;
      } catch {
        colors = null;
      }
    };
    const paint = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { tint: tn, mix: mx, strength: st } = opts.current;
      for (const [key, life] of cells) {
        const cx = key % 10000;
        const cy = Math.floor(key / 10000);
        let r = tn[0];
        let g = tn[1];
        let b = tn[2];
        if (colors) {
          const i = (cy * tiny.width + cx) * 4;
          r = colors[i] + (tn[0] - colors[i]) * mx + 8;
          g = colors[i + 1] + (tn[1] - colors[i + 1]) * mx + 6;
          b = colors[i + 2] + (tn[2] - colors[i + 2]) * mx + 4;
        }
        ctx.fillStyle = `rgba(${Math.min(255, r) | 0},${Math.min(255, g) | 0},${Math.min(255, b) | 0},${(Math.min(1, life) * st).toFixed(3)})`;
        ctx.fillRect(cx * cell * dpr, cy * cell * dpr, Math.ceil(cell * dpr), Math.ceil(cell * dpr));
      }
    };
    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      for (const [k, life] of cells) {
        const n = life - dt * 0.9;
        if (n <= 0) cells.delete(k);
        else cells.set(k, n);
      }
      paint();
      raf = cells.size ? requestAnimationFrame(loop) : 0;
    };
    const add = (x: number, y: number) => {
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      if (cx < 0 || cy < 0 || cx >= tiny.width || cy >= tiny.height) return;
      const k = cy * 10000 + cx;
      cells.set(k, Math.max(cells.get(k) ?? 0, 0.8 + Math.random() * 0.25));
    };
    const host = canvas.parentElement ?? canvas;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (y < 0 || y > r.height) return;
      if (!colors) sample();
      const from = lastPt ?? { x, y };
      const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / (cell * 0.6)));
      for (let s = 0; s <= steps; s++) {
        const px = from.x + ((x - from.x) * s) / steps;
        const py = from.y + ((y - from.y) * s) / steps;
        add(px, py);
        if (Math.random() < 0.45) add(px + (Math.random() < 0.5 ? -cell : cell), py);
        if (Math.random() < 0.3) add(px, py + (Math.random() < 0.5 ? -cell : cell));
      }
      lastPt = { x, y };
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    const onLeave = () => (lastPt = null);
    setup();
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(setup);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
