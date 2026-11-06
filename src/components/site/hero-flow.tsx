"use client";

import * as React from "react";

// Animation du haut de page, dessinée sur un canvas (léger, aucune bibliothèque 3D).
// La matière du métier : des lignes de documents, des cellules de tableau et des chiffres
// dérivent en désordre sur la gauche, portés par un courant lent ; en avançant, ils se redressent,
// s'alignent et se rangent en bandes nettes : le livrable propre. Aucun objet, aucun symbole :
// seulement le passage du désordre à l'ordre. Une teinte discrète n'apparaît que du côté ordonné.
// - Le titre et le bouton sont rendus par le serveur : l'animation ne retarde jamais le premier affichage.
// - « Réduire les animations » : une seule image fixe de la même scène.
// - Mobile : moins d'éléments, résolution plafonnée.
// - En pause quand la scène n'est pas visible ou que l'onglet est caché.

const TINTS = ["#d9a38c", "#d6bf8a", "#a9c4a0", "#8fbcc3", "#a3b1cf"];
const NUMBERS = ["12 480", "−3,2 %", "0,87", "1 254,00", "41", "+18 %", "7 903", "315,20", "−912", "64 %", "8,1", "27 650", "N-1", "0,4"];

type Item = { lane: number; x: number; w: number; kind: 0 | 1 | 2; text: string; off: number; ph: number; fr: number; r0: number; a: number };
type Geo = { W: number; H: number; lanes: number[]; laneH: number; x0: number; x1: number; k: number; speed: number; mobile: boolean };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function rand(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function geometry(W: number, H: number): Geo {
  const mobile = W < 768;
  const k = mobile ? 0.85 : Math.min(1.2, Math.max(0.85, W / 1440));
  const n = mobile ? 7 : 11;
  const top = H * (mobile ? 0.11 : 0.12);
  const bottom = H * (mobile ? 0.36 : 0.5);
  const laneH = (bottom - top) / n;
  const lanes = Array.from({ length: n }, (_, i) => top + laneH * (i + 0.5));
  // Zone de passage du désordre à l'ordre.
  const x0 = W * (mobile ? 0.18 : 0.3);
  const x1 = W * (mobile ? 0.62 : 0.66);
  return { W, H, lanes, laneH, x0, x1, k, speed: 24 * k, mobile };
}

function make(lane: number, x: number, g: Geo, r: () => number): Item {
  const k = r();
  const kind: Item["kind"] = k < 0.55 ? 0 : k < 0.75 ? 1 : 2;
  // Largeurs « au carreau » : alignées sur une grille de 24 px une fois rangées.
  const w = Math.round((kind === 2 ? 2 + r() * 2 : 1 + r() * 4)) * 24 * g.k;
  return {
    lane,
    x,
    w,
    kind,
    text: NUMBERS[Math.floor(r() * NUMBERS.length)],
    off: (r() * 2 - 1) * g.H * (g.mobile ? 0.2 : 0.3),
    ph: r() * Math.PI * 2,
    fr: 0.25 + r() * 0.35,
    r0: (r() * 2 - 1) * 0.6,
    a: 0.2 + r() * 0.28,
  };
}

function draw(ctx: CanvasRenderingContext2D, g: Geo, items: Item[], t: number) {
  const { W, H, x0, x1, laneH } = g;
  ctx.clearRect(0, 0, W, H);

  // Bandes de fond, seulement du côté ordonné.
  g.lanes.forEach((y, i) => {
    const grad = ctx.createLinearGradient(x0, 0, W, 0);
    grad.addColorStop(0, "rgba(255,248,236,0)");
    grad.addColorStop(0.45, hexA(TINTS[i % TINTS.length], 0.06));
    grad.addColorStop(1, hexA(TINTS[i % TINTS.length], 0.03));
    ctx.fillStyle = grad;
    ctx.fillRect(x0, y - laneH * 0.42, W - x0, laneH * 0.84);
  });

  ctx.textBaseline = "middle";
  ctx.font = `500 ${Math.round(13 * g.k)}px "Plus Jakarta Sans Variable", ui-sans-serif, system-ui, sans-serif`;
  for (const it of items) {
    if (it.x > W + 20 || it.x + it.w < -20) continue;
    const o = smooth(x0, x1, it.x + it.w * 0.5); // 0 : désordre, 1 : rangé
    const laneY = g.lanes[it.lane];
    // Courant lent : chaque élément ondule tant qu'il n'est pas rangé.
    const drift = Math.sin(t * it.fr + it.ph + it.x * 0.004) * 26 * g.k;
    const y = laneY + (it.off + drift) * (1 - o) * (1 - o);
    const rot = (it.r0 + Math.sin(t * it.fr * 0.7 + it.ph) * 0.25) * (1 - o);
    const fadeIn = smooth(-20, W * 0.12, it.x);
    const alpha = lerp(it.a, 0.85, o) * fadeIn;
    const color = o > 0.02 ? mix("#f4eee4", TINTS[it.lane % TINTS.length], o) : "#f4eee4";
    ctx.save();
    ctx.translate(it.x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    const h = lerp(it.kind === 0 ? 5 : 14, 6, o) * g.k;
    if (it.kind === 0 || (it.kind === 1 && o > 0.6)) {
      ctx.beginPath();
      ctx.roundRect(0, -h / 2, it.w, h, h / 2);
      ctx.fill();
    } else if (it.kind === 1) {
      ctx.lineWidth = 1.2;
      ctx.strokeRect(0, -h / 2, it.w, h);
    } else {
      ctx.fillText(it.text, 0, 0);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function mix(a: string, b: string, t: number) {
  const p = parseInt(a.slice(1), 16);
  const q = parseInt(b.slice(1), 16);
  const c = (s: number) => Math.round(lerp((p >> s) & 255, (q >> s) & 255, t));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

export function HeroFlow({ className }: { className?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const r = rand(20261106);
    let g = geometry(1, 1);
    let items: Item[] = [];
    let raf = 0;
    let visible = true;
    let last = 0;
    let t = 0;
    const GAP = 14;

    // Chaque bande est une file : les éléments s'y suivent à intervalle régulier, d'où des rangées nettes.
    const fill = () => {
      items = [];
      g.lanes.forEach((_, lane) => {
        let x = g.W + 40 - r() * 120;
        while (x > -g.W * 0.15) {
          const it = make(lane, 0, g, r);
          x -= it.w + GAP * g.k + (r() < 0.25 ? 48 * g.k : 0);
          it.x = x;
          items.push(it);
        }
      });
    };

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, rect.width < 768 ? 1.5 : 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      g = geometry(rect.width, rect.height);
      fill();
    };

    const step = (dt: number) => {
      t += dt;
      const dx = g.speed * dt;
      const minX = new Array(g.lanes.length).fill(Infinity);
      for (const it of items) {
        it.x += dx;
        if (it.x < minX[it.lane]) minX[it.lane] = it.x;
      }
      // Ce qui sort à droite revient à gauche, derrière le dernier élément de sa file.
      for (const it of items) {
        if (it.x > g.W + 30) {
          const n = make(it.lane, 0, g, r);
          Object.assign(it, n, { x: minX[it.lane] - n.w - GAP * g.k - (r() < 0.25 ? 48 * g.k : 0) });
          minX[it.lane] = it.x;
        }
      }
    };

    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      step(dt);
      draw(ctx, g, items, t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduce || raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    setup();
    draw(ctx, g, items, t);
    setReady(true);
    start();

    const ro = new ResizeObserver(() => {
      setup();
      draw(ctx, g, items, t);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ opacity: ready ? 1 : 0, transition: "opacity 900ms cubic-bezier(0.16,1,0.3,1)" }}
    />
  );
}
