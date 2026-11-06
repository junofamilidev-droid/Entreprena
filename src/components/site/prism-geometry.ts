// Géométrie de la scène du haut de page : des fragments de documents (lignes, cellules, chiffres)
// arrivent en désordre par la gauche, traversent un prisme, et ressortent en bandes ordonnées.
// Tirage pseudo-aléatoire à graine fixe : le serveur et le navigateur dessinent exactement la même scène.

export const VIEW = { w: 1200, h: 640 };

/** Prisme : sommet, base gauche, base droite. */
export const PRISM = { top: [600, 150], left: [495, 480], right: [705, 480] } as const;
/** Point d'entrée (face gauche) et de sortie (face droite) de la matière. */
export const ENTRY = { x: 552, y: 330 };
export const EXIT = { x: 648, y: 330 };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Fragment =
  | { kind: "line"; x: number; y: number; w: number; r: number; o: number }
  | { kind: "cell"; x: number; y: number; w: number; r: number; o: number }
  | { kind: "num"; x: number; y: number; text: string; r: number; o: number };

const NUMBERS = ["12 480", "−3,2 %", "0,87", "1 254,00", "41", "+18 %", "7 903", "2026", "0,4", "315,20", "−912", "64 %", "8,1", "27 650"];

/** Fragments en désordre, plus dispersés loin du prisme, resserrés près de son entrée. */
export function fragments(count: number, seed = 7): Fragment[] {
  const r = rng(seed);
  const out: Fragment[] = [];
  for (let i = 0; i < count; i++) {
    const x = 10 + r() * 470;
    // Entonnoir : l'écart vertical diminue en approchant du prisme.
    const spread = 40 + (1 - x / 500) * 270;
    const y = ENTRY.y + (r() * 2 - 1) * spread;
    const rot = (r() * 2 - 1) * 28 * (1 - x / 640);
    const o = 0.22 + r() * 0.3;
    const k = r();
    if (k < 0.5) out.push({ kind: "line", x, y, w: 22 + r() * 70, r: rot, o });
    else if (k < 0.72) out.push({ kind: "cell", x, y, w: 26 + r() * 22, r: rot, o });
    else out.push({ kind: "num", x, y, text: NUMBERS[Math.floor(r() * NUMBERS.length)], r: rot, o: o + 0.1 });
  }
  return out;
}

/** Bandes de sortie : cinq bandes nettes, chacune faite de rangées de cellules alignées. */
export const BANDS = {
  count: 5,
  startX: 790,
  endX: 1200,
  top: 200,
  height: 34,
  gap: 14,
};

export function bandY(i: number) {
  return BANDS.top + i * (BANDS.height + BANDS.gap);
}

/** Cellules d'une bande : largeurs régulières, comme les colonnes d'un tableau propre. */
export function bandCells(i: number, seed = 11) {
  const r = rng(seed + i * 31);
  const cols = [64, 112, 64, 88, 64];
  const cells: { x: number; w: number; row: number; o: number }[] = [];
  for (let row = 0; row < 2; row++) {
    let x = BANDS.startX + 12;
    for (let c = 0; c < 8; c++) {
      const w = cols[c % cols.length];
      const filled = 0.55 + r() * 0.45;
      cells.push({ x, w: w * filled, row, o: row === 0 ? 0.95 : 0.55 });
      x += w + 12;
    }
  }
  return cells;
}
