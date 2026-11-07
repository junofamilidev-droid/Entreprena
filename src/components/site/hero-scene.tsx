"use client";

import * as React from "react";

// Haut de page : une scène peinte, dessinée en code (aucune image à télécharger).
// Une ville au lever du jour, un chemin de lumière qui la traverse jusqu'au soleil, et une
// professionnelle vue de dos, en haut des marches, qui le regarde : le métier change, voici le chemin.
// - Profondeur : la scène est faite de plans (ciel, nuages, ville lointaine, toits, chemin, premier plan)
//   qui se décalent plus ou moins selon la souris.
// - Pixels : la souris laisse une traînée de carrés, couleur de la scène, qui s'effacent doucement.
// - Le titre et le bouton sont rendus par le serveur et s'affichent avant la scène.
// - « Réduire les animations » : scène fixe, sans parallaxe ni pixels. Pause hors de l'écran.

type Layer = { c: HTMLCanvasElement; depth: number; pr: number };

function rand(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRGB = (a: number[], b: number[], t: number, alpha = 1) =>
  `rgba(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))},${alpha})`;

/**
 * Deux ambiances de la même scène :
 * - « aube » : nuit sarcelle qui s'ouvre sur un soleil doré, contrasté et cinématographique ;
 * - « matin » : ciel clair, brume lumineuse, personnage en couleurs, plus optimiste.
 */
export type SceneVariant = "aube" | "matin";

const PALETTES = {
  aube: {
    sky: ["#0a2023", "#16373a", "#4f6862", "#d8a56c", "#efcb94", "#22342f"],
    halo: ["rgba(255,240,205,1)", "rgba(255,222,165,0.85)", "rgba(240,176,110,0.35)", "rgba(240,176,110,0)"],
    sun: "rgba(255,246,222,0.95)",
    veil: ["rgba(5,16,18,0.7)", "rgba(5,16,18,0.18)", "rgba(5,16,18,0)"],
    ray: "255,226,170",
    rayA: 0.16,
    cloudFar: [36, 66, 66],
    cloudNear: [236, 180, 128],
    cloudLit: "255,215,160",
    farA: [44, 72, 70],
    farB: [231, 201, 156],
    hazeRGB: "238,200,150",
    midA: [10, 33, 36],
    midB: [62, 70, 58],
    rim: "255,210,150",
    windows: 6,
    path: ["246,206,145", "255,226,175", "250,214,155", "255,240,205"],
    ground: "#061416",
    edge: "255,210,150",
    legs: "#081a1c",
    coat: "#081a1c",
    hair: "#081a1c",
    bag: "#081a1c",
    figRim: "rgba(255,214,160,0.75)",
    pixel: [255, 238, 210],
    pixelMix: 0.22,
  },
  matin: {
    sky: ["#7fa9bd", "#a9c8d3", "#d7e3df", "#f4d9b2", "#fbe9cc", "#d6d9cc"],
    halo: ["rgba(255,252,240,1)", "rgba(255,240,205,0.9)", "rgba(255,222,170,0.35)", "rgba(255,222,170,0)"],
    sun: "rgba(255,253,245,1)",
    veil: ["rgba(250,248,242,0.82)", "rgba(250,248,242,0.35)", "rgba(250,248,242,0)"],
    ray: "255,250,235",
    rayA: 0.28,
    cloudFar: [236, 242, 244],
    cloudNear: [255, 232, 200],
    cloudLit: "255,246,225",
    farA: [150, 174, 182],
    farB: [246, 228, 200],
    hazeRGB: "252,240,220",
    midA: [104, 136, 142],
    midB: [222, 192, 152],
    rim: "255,248,230",
    windows: 2,
    path: ["255,236,200", "255,244,220", "255,240,210", "255,252,240"],
    ground: "#5d777a",
    edge: "255,246,225",
    legs: "#2b3a40",
    coat: "#1f5c60",
    hair: "#3b2a22",
    bag: "#b4895a",
    figRim: "rgba(255,248,232,0.9)",
    pixel: [214, 160, 92],
    pixelMix: 0.45,
  },
};
type Palette = (typeof PALETTES)["aube"];

/** Toute la composition, en proportions de la scène (w × h), pour s'adapter à l'écran. */
function compose(w: number, h: number, dpr: number, margin: number, P: Palette) {
  const portrait = h > w * 1.05;
  const sun = { x: portrait ? 0.72 : 0.77, y: portrait ? 0.36 : 0.55 };
  const hy = sun.y + 0.035; // ligne d'horizon
  const r = rand(31);
  const W = w + margin * 2;
  const H = h + margin * 2;
  const X = (f: number) => margin + f * w;
  const Y = (f: number) => margin + f * h;
  const U = Math.min(w, h * 1.6); // unité de taille

  // Chaque plan est dessiné une fois, dans sa propre toile. Les plans flous (ciel, nuages, rayons,
  // chemin) sont dessinés en basse résolution : invisible à l'œil, beaucoup moins de calcul.
  let pr = dpr;
  const blur = (px: number) => `blur(${Math.max(1, Math.round(px * pr))}px)`;
  const make = (draw: (ctx: CanvasRenderingContext2D) => void, scale = 1) => {
    pr = dpr * scale;
    const c = document.createElement("canvas");
    c.width = Math.round(W * pr);
    c.height = Math.round(H * pr);
    const ctx = c.getContext("2d")!;
    ctx.scale(pr, pr);
    draw(ctx);
    return { c, pr };
  };

  // 1. Ciel : nuit sarcelle en haut à gauche, aube dorée à l'horizon, halo du soleil.
  const sky = () => make((ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, P.sky[0]);
    g.addColorStop(0.3, P.sky[1]);
    g.addColorStop(Math.max(0.35, hy - 0.16), P.sky[2]);
    g.addColorStop(hy - 0.03, P.sky[3]);
    g.addColorStop(hy + 0.02, P.sky[4]);
    g.addColorStop(1, P.sky[5]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const halo = ctx.createRadialGradient(X(sun.x), Y(sun.y), 0, X(sun.x), Y(sun.y), U * 0.75);
    halo.addColorStop(0, P.halo[0]);
    halo.addColorStop(0.05, P.halo[1]);
    halo.addColorStop(0.22, P.halo[2]);
    halo.addColorStop(1, P.halo[3]);
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = P.sun;
    ctx.beginPath();
    ctx.arc(X(sun.x), Y(sun.y), U * 0.022, 0, Math.PI * 2);
    ctx.fill();
    const side = ctx.createLinearGradient(0, 0, W, 0);
    side.addColorStop(0, P.veil[0]);
    side.addColorStop(0.5, P.veil[1]);
    side.addColorStop(0.8, P.veil[2]);
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, W, H);
  }, 0.4);

  // 2. Rayons : quelques faisceaux très doux qui partent du soleil.
  const rays = () => make((ctx) => {
    ctx.filter = blur(U * 0.012);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i - 3) * 0.16 + (r() - 0.5) * 0.08;
      const len = U * (0.9 + r() * 0.5);
      const spread = 0.025 + r() * 0.03;
      const g = ctx.createLinearGradient(X(sun.x), Y(sun.y), X(sun.x) + Math.cos(a) * len, Y(sun.y) + Math.sin(a) * len);
      g.addColorStop(0, `rgba(${P.ray},${P.rayA})`);
      g.addColorStop(1, `rgba(${P.ray},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(X(sun.x), Y(sun.y));
      ctx.lineTo(X(sun.x) + Math.cos(a - spread) * len, Y(sun.y) + Math.sin(a - spread) * len);
      ctx.lineTo(X(sun.x) + Math.cos(a + spread) * len, Y(sun.y) + Math.sin(a + spread) * len);
      ctx.closePath();
      ctx.fill();
    }
  }, 0.35);

  // 3. Nuages : longues nappes peintes, éclairées par-dessous près du soleil.
  const clouds = () => make((ctx) => {
    ctx.filter = blur(U * 0.018);
    for (let i = 0; i < 14; i++) {
      const cx = r() * 1.1 - 0.05;
      const cy = 0.08 + r() * (hy - 0.18);
      const near = Math.max(0, 1 - Math.hypot(cx - sun.x, (cy - sun.y) * 1.6) / 0.7);
      ctx.fillStyle = mixRGB(P.cloudFar, P.cloudNear, near, 0.28 + r() * 0.3);
      ctx.beginPath();
      ctx.ellipse(X(cx), Y(cy), U * (0.12 + r() * 0.22), U * (0.012 + r() * 0.03), (r() - 0.5) * 0.08, 0, Math.PI * 2);
      ctx.fill();
      if (near > 0.3) {
        ctx.fillStyle = `rgba(${P.cloudLit},${0.25 * near})`;
        ctx.beginPath();
        ctx.ellipse(X(cx), Y(cy) + U * 0.012, U * (0.08 + r() * 0.1), U * 0.008, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, 0.35);

  // Silhouette de toits : immeubles, toits mansardés, quelques dômes et tours, pour une ville européenne.
  const skyline = (ctx: CanvasRenderingContext2D, base: number, minH: number, maxH: number, minW: number, maxW: number, color: (x: number) => string, rim: number, windows: number, gap: [number, number]) => {
    let x = -0.05;
    while (x < 1.05) {
      const bw = minW + r() * (maxW - minW);
      // Trouée : l'avenue de lumière passe entre les immeubles jusqu'au soleil.
      if (x + bw > gap[0] && x < gap[1]) {
        x = gap[1];
        continue;
      }
      let bh = minH + r() * (maxH - minH);
      const kind = r();
      if (kind > 0.94) bh *= 1.9; // une tour
      const left = X(x);
      const right = X(x + bw);
      const top = Y(base - bh);
      ctx.fillStyle = color(x + bw / 2);
      ctx.beginPath();
      ctx.moveTo(left, Y(base + 0.3));
      ctx.lineTo(left, top + (kind < 0.55 ? (right - left) * 0.18 : 0));
      if (kind < 0.55) {
        // toit mansardé
        ctx.lineTo(left + (right - left) * 0.15, top);
        ctx.lineTo(right - (right - left) * 0.15, top);
        ctx.lineTo(right, top + (right - left) * 0.18);
      } else if (kind < 0.62) {
        // dôme
        ctx.lineTo(left, top);
        ctx.arc((left + right) / 2, top, (right - left) / 2, Math.PI, 0);
      } else {
        ctx.lineTo(left, top);
        ctx.lineTo(right, top);
      }
      ctx.lineTo(right, Y(base + 0.3));
      ctx.closePath();
      ctx.fill();
      // cheminées
      if (kind < 0.55 && r() > 0.4) ctx.fillRect(left + (right - left) * (0.25 + r() * 0.4), top - U * 0.008, U * 0.006, U * 0.01);
      // liseré de lumière sur les toits, plus fort près du soleil
      const near = Math.max(0, 1 - Math.abs(x + bw / 2 - sun.x) / 0.45);
      if (rim > 0 && near > 0) {
        ctx.strokeStyle = `rgba(${P.rim},${rim * near})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right, top);
        ctx.stroke();
      }
      // fenêtres allumées, rares
      for (let k = 0; k < windows; k++) {
        if (r() > 0.55) continue;
        ctx.fillStyle = `rgba(255,${190 + Math.round(r() * 40)},120,${0.35 + r() * 0.4})`;
        ctx.fillRect(lerp(left, right, 0.15 + r() * 0.7), lerp(top + U * 0.02, Y(base), r()), U * 0.004, U * 0.006);
      }
      x += bw + (r() > 0.8 ? r() * 0.01 : 0);
    }
  };

  // 4. Ville lointaine : noyée dans la brume dorée.
  const far = () => make((ctx) => {
    skyline(ctx, hy + 0.012, 0.012, 0.05, 0.012, 0.03, (x) => mixRGB(P.farA, P.farB, Math.max(0, 1 - Math.abs(x - sun.x) / 0.55) * 0.85, 0.92), 0, 0, [sun.x - 0.025, sun.x + 0.025]);
    const haze = ctx.createLinearGradient(0, Y(hy - 0.08), 0, Y(hy + 0.05));
    haze.addColorStop(0, `rgba(${P.hazeRGB},0)`);
    haze.addColorStop(1, `rgba(${P.hazeRGB},0.35)`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, Y(hy - 0.08), W, Y(0.13));
  });

  // 5. Toits proches : plus sombres, liserés d'or, quelques fenêtres.
  const mid = () => make((ctx) => {
    skyline(ctx, hy + 0.11, 0.035, 0.1, 0.03, 0.07, (x) => mixRGB(P.midA, P.midB, Math.max(0, 1 - Math.abs(x - sun.x) / 0.5) * 0.7), 0.55, P.windows, [sun.x - 0.11, sun.x + 0.07]);
  });

  // 6. Le chemin de lumière : une avenue en perspective, au sol, qui part des pieds de la personne
  //    et file entre les immeubles jusqu'au soleil ; le sol reflète la lumière en son centre.
  const terrace = portrait ? 0.86 : 0.84;
  const walkerX = portrait ? 0.45 : 0.6;
  const path = () => make((ctx) => {
    const V = { x: X(sun.x), y: Y(hy + 0.008) };
    const by = Y(terrace);
    const bx = X(walkerX + (sun.x - walkerX) * 0.15);
    const road = (half: number, tip: number) => {
      ctx.beginPath();
      ctx.moveTo(V.x - tip, V.y);
      ctx.lineTo(V.x + tip, V.y);
      ctx.lineTo(bx + half, by);
      ctx.lineTo(bx - half, by);
      ctx.closePath();
    };
    // Halo large et très doux, puis le reflet central, plus vif : un chemin de lumière, pas une route dessinée.
    const soft = ctx.createLinearGradient(0, by, 0, V.y);
    soft.addColorStop(0, `rgba(${P.path[0]},0)`);
    soft.addColorStop(0.5, `rgba(${P.path[0]},0.14)`);
    soft.addColorStop(1, `rgba(${P.path[1]},0.5)`);
    ctx.filter = blur(U * 0.03);
    ctx.fillStyle = soft;
    road(U * 0.2, U * 0.01);
    ctx.fill();
    const glow = ctx.createLinearGradient(0, by, 0, V.y);
    glow.addColorStop(0, `rgba(${P.path[0]},0.05)`);
    glow.addColorStop(0.55, `rgba(${P.path[2]},0.38)`);
    glow.addColorStop(1, `rgba(${P.path[3]},0.9)`);
    ctx.filter = blur(U * 0.008);
    ctx.fillStyle = glow;
    road(U * 0.06, U * 0.003);
    ctx.fill();
  }, 0.4);

  // 7. Premier plan : la terrasse, les marches, et la personne vue de dos.
  const fg = () => make((ctx) => {
    const top = terrace;
    ctx.fillStyle = P.ground;
    ctx.beginPath();
    ctx.moveTo(0, Y(top - 0.02));
    ctx.lineTo(X(0.5), Y(top));
    ctx.lineTo(W, Y(top - 0.015));
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    // bord éclairé de la terrasse
    const edge = ctx.createLinearGradient(0, 0, W, 0);
    edge.addColorStop(0, `rgba(${P.edge},0)`);
    edge.addColorStop(sun.x, `rgba(${P.edge},0.55)`);
    edge.addColorStop(1, `rgba(${P.edge},0.2)`);
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, Y(top - 0.02));
    ctx.lineTo(X(0.5), Y(top));
    ctx.lineTo(W, Y(top - 0.015));
    ctx.stroke();
    // marches qui descendent vers le chemin
    const sx = walkerX;
    for (let i = 0; i < 5; i++) {
      const y = Y(top + 0.025 + i * 0.03);
      const half = U * (0.05 + i * 0.016);
      ctx.strokeStyle = `rgba(${P.edge},${0.35 - i * 0.05})`;
      ctx.beginPath();
      ctx.moveTo(X(sx) - half, y);
      ctx.lineTo(X(sx) + half, y);
      ctx.stroke();
    }
    // la personne, de trois-quarts dos, sac à l'épaule
    const px = X(sx);
    const py = Y(top);
    const s = U * (portrait ? 0.2 : 0.17); // hauteur
    ctx.fillStyle = P.legs;
    ctx.beginPath(); // jambes
    ctx.moveTo(px - s * 0.06, py - s * 0.3);
    ctx.lineTo(px - s * 0.05, py);
    ctx.lineTo(px - s * 0.015, py);
    ctx.lineTo(px, py - s * 0.28);
    ctx.lineTo(px + s * 0.02, py);
    ctx.lineTo(px + s * 0.055, py);
    ctx.lineTo(px + s * 0.06, py - s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.coat;
    ctx.beginPath(); // manteau
    ctx.moveTo(px - s * 0.085, py - s * 0.74);
    ctx.quadraticCurveTo(px, py - s * 0.8, px + s * 0.085, py - s * 0.74);
    ctx.lineTo(px + s * 0.11, py - s * 0.28);
    ctx.lineTo(px - s * 0.105, py - s * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.hair;
    ctx.beginPath(); // tête et chignon
    ctx.arc(px + s * 0.004, py - s * 0.85, s * 0.07, 0, Math.PI * 2);
    ctx.arc(px - s * 0.01, py - s * 0.91, s * 0.035, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.coat;
    ctx.fillRect(px - s * 0.025, py - s * 0.8, s * 0.05, s * 0.06); // col
    // sac sur l'épaule gauche (côté sombre)
    ctx.fillStyle = P.bag;
    ctx.beginPath();
    ctx.moveTo(px - s * 0.07, py - s * 0.74);
    ctx.lineTo(px - s * 0.13, py - s * 0.48);
    ctx.lineTo(px - s * 0.08, py - s * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(px - s * 0.17, py - s * 0.5, s * 0.1, s * 0.13);
    // liseré de lumière côté soleil
    ctx.strokeStyle = P.figRim;
    ctx.lineWidth = Math.max(1, U * 0.0016);
    ctx.beginPath();
    ctx.arc(px + s * 0.004, py - s * 0.85, s * 0.07, -1.3, 0.6);
    ctx.moveTo(px + s * 0.085, py - s * 0.74);
    ctx.lineTo(px + s * 0.11, py - s * 0.28);
    ctx.stroke();
  });

  // Grain de peinture, très léger, fixe.
  const grain = () => make((ctx) => {
    const n = document.createElement("canvas");
    n.width = n.height = 160;
    const nctx = n.getContext("2d")!;
    const img = nctx.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.round(r() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 14;
    }
    nctx.putImageData(img, 0, 0);
    ctx.fillStyle = ctx.createPattern(n, "repeat")!;
    ctx.fillRect(0, 0, W, H);
  });

  // Du fond vers l'avant. depth : décalage maximal (px) quand la souris est au bord de l'écran.
  return [
    { build: sky, depth: 4 },
    { build: rays, depth: 8 },
    { build: clouds, depth: 12 },
    { build: far, depth: 16 },
    { build: mid, depth: 26 },
    { build: path, depth: 30 },
    { build: fg, depth: 46 },
    { build: grain, depth: 0 },
  ];
}

export function HeroScene({ className, variant = "aube" }: { className?: string; variant?: SceneVariant }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: false });
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const palette = PALETTES[variant];
    const MARGIN = 56;
    let layers: Layer[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let cell = 20;
    let raf = 0;
    let visible = true;
    let last = 0;
    let frame = 0;
    // parallaxe
    let tx = 0;
    let ty = 0;
    let mx = 0;
    let my = 0;
    // pixels : clé « colonne,ligne » → durée de vie restante (1 → 0)
    const cells = new Map<string, number>();
    const tiny = document.createElement("canvas");
    const tctx = tiny.getContext("2d", { willReadFrequently: true })!;
    let colors: Uint8ClampedArray | null = null;
    let lastPt: { x: number; y: number } | null = null;

    let token = 0;
    let built = false;
    // Prépare les plans un par un, en rendant la main au navigateur entre deux : la page ne se fige jamais.
    const setup = async () => {
      const my = ++token;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio || 1, w < 768 ? 1.25 : 1.5);
      cell = w < 768 ? 16 : 22;
      const plan = compose(w, h, dpr, MARGIN, palette);
      const next: Layer[] = [];
      for (const step of plan) {
        await new Promise((r) => setTimeout(r, 0));
        if (my !== token) return;
        const { c, pr } = step.build();
        next.push({ c, pr, depth: step.depth });
      }
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      tiny.width = Math.ceil(w / cell);
      tiny.height = Math.ceil(h / cell);
      layers = next;
      colors = null;
      built = true;
      paint();
      setReady(true);
    };

    const paint = () => {
      if (!built) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (const l of layers) {
        const dx = -MARGIN - mx * l.depth * 2;
        const dy = -MARGIN - my * l.depth * 1.2;
        ctx.drawImage(l.c, dx * dpr, dy * dpr, (l.c.width / l.pr) * dpr, (l.c.height / l.pr) * dpr);
      }
      // Échantillon basse résolution de la scène : la couleur de chaque pixel de la traînée.
      if (!colors || frame % 12 === 0) {
        tctx.drawImage(canvas, 0, 0, tiny.width, tiny.height);
        colors = tctx.getImageData(0, 0, tiny.width, tiny.height).data;
      }
      for (const [key, life] of cells) {
        const [cx, cy] = key.split(",").map(Number);
        const i = (cy * tiny.width + cx) * 4;
        // Couleur de la scène à cet endroit, éclaircie : une mosaïque lumineuse, pas une tache.
        const [pr0, pg0, pb0] = palette.pixel;
        const cr = Math.min(255, lerp(colors[i], pr0, palette.pixelMix) + 10);
        const cg = Math.min(255, lerp(colors[i + 1], pg0, palette.pixelMix) + 8);
        const cb = Math.min(255, lerp(colors[i + 2], pb0, palette.pixelMix) + 4);
        ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${Math.min(1, life * 1.1).toFixed(3)})`;
        ctx.fillRect(cx * cell * dpr, cy * cell * dpr, Math.ceil(cell * dpr), Math.ceil(cell * dpr));
      }
    };

    // L'animation ne tourne que lorsqu'il se passe quelque chose : souris qui bouge, pixels qui s'effacent.
    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      frame++;
      mx = lerp(mx, tx, 0.07);
      my = lerp(my, ty, 0.07);
      for (const [key, life] of cells) {
        const nl = life - dt * 0.9;
        if (nl <= 0) cells.delete(key);
        else cells.set(key, nl);
      }
      paint();
      const settled = Math.abs(mx - tx) < 0.001 && Math.abs(my - ty) < 0.001 && cells.size === 0;
      raf = settled ? 0 : requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduce || raf || !visible || document.hidden || !built) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const addCell = (x: number, y: number) => {
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      if (cx < 0 || cy < 0 || cx >= tiny.width || cy >= tiny.height) return;
      const key = `${cx},${cy}`;
      cells.set(key, Math.max(cells.get(key) ?? 0, 0.75 + Math.random() * 0.25));
    };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (y < 0 || y > rect.height) return;
      tx = x / rect.width - 0.5;
      ty = y / rect.height - 0.5;
      // traînée : on relie la position précédente à la nouvelle, avec quelques voisins au hasard
      const from = lastPt ?? { x, y };
      const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / (cell * 0.6)));
      for (let s = 0; s <= steps; s++) {
        const px = lerp(from.x, x, s / steps);
        const py = lerp(from.y, y, s / steps);
        addCell(px, py);
        if (Math.random() < 0.45) addCell(px + (Math.random() < 0.5 ? -cell : cell), py);
        if (Math.random() < 0.3) addCell(px, py + (Math.random() < 0.5 ? -cell : cell));
      }
      lastPt = { x, y };
      start();
    };
    const onLeave = () => {
      lastPt = null;
      tx = 0;
      ty = 0;
      start();
    };

    // On attend que la page soit au repos pour préparer la scène : le texte s'affiche d'abord.
    const idle = (cb: () => void) => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(cb, { timeout: 1200 });
      else setTimeout(cb, 200);
    };
    idle(() => void setup());

    const host = canvas.parentElement ?? canvas;
    if (!reduce) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
    }
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      void setup();
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
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [variant]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ opacity: ready ? 1 : 0, transition: "opacity 1200ms cubic-bezier(0.16,1,0.3,1)" }}
    />
  );
}
