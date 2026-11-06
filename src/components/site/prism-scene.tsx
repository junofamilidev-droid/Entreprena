import { BANDS, ENTRY, EXIT, PRISM, VIEW, bandCells, bandY, fragments, type Fragment } from "./prism-geometry";

// Image fixe de la scène du prisme. Sert d'affichage immédiat (rendu serveur, aucun JavaScript),
// d'image pour « réduire les animations », et de décor sous la version animée.

const pts = (...p: readonly (readonly [number, number] | readonly number[])[]) => p.map((q) => q.join(",")).join(" ");

export function FragmentShape({ f }: { f: Fragment }) {
  const t = `rotate(${f.r.toFixed(1)} ${f.x.toFixed(1)} ${f.y.toFixed(1)})`;
  if (f.kind === "line") return <rect x={f.x} y={f.y - 2.5} width={f.w} height={5} rx={2.5} fill="currentColor" opacity={f.o} transform={t} />;
  if (f.kind === "cell")
    return <rect x={f.x} y={f.y - 8} width={f.w} height={16} rx={2} fill="none" stroke="currentColor" strokeWidth={1.25} opacity={f.o} transform={t} />;
  return (
    <text x={f.x} y={f.y + 5} fontSize={15} fill="currentColor" opacity={f.o} transform={t} style={{ fontVariantNumeric: "tabular-nums" }}>
      {f.text}
    </text>
  );
}

export function PrismBody() {
  return (
    <g>
      <polygon points={pts(PRISM.top, PRISM.left, PRISM.right)} fill="var(--background)" stroke="currentColor" strokeOpacity={0.55} strokeWidth={1.25} strokeLinejoin="round" />
      {/* Reflets internes, très discrets */}
      <polyline points={pts(PRISM.top, [600, 480])} fill="none" stroke="currentColor" strokeOpacity={0.12} />
      <polyline points={pts([ENTRY.x, ENTRY.y], [EXIT.x, EXIT.y])} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeDasharray="2 5" />
    </g>
  );
}

export function SpectrumFan() {
  return (
    <g>
      {Array.from({ length: BANDS.count }, (_, i) => {
        const y = bandY(i);
        const a = EXIT.y - 18 + i * 8;
        return (
          <polygon
            key={i}
            points={pts([EXIT.x, a], [EXIT.x, a + 6], [BANDS.startX, y + BANDS.height], [BANDS.startX, y])}
            fill={`var(--spectrum-${i + 1})`}
            opacity={0.22}
          />
        );
      })}
    </g>
  );
}

export function BandRows() {
  return (
    <g>
      {Array.from({ length: BANDS.count }, (_, i) => {
        const y = bandY(i);
        return (
          <g key={i}>
            <rect x={BANDS.startX} y={y} width={BANDS.endX - BANDS.startX} height={BANDS.height} fill={`var(--spectrum-${i + 1})`} opacity={0.12} />
            <rect x={BANDS.startX} y={y} width={3} height={BANDS.height} fill={`var(--spectrum-${i + 1})`} />
            {bandCells(i).map((c, k) => (
              <rect key={k} x={c.x} y={y + 8 + c.row * 12} width={c.w} height={6} rx={3} fill={`var(--spectrum-${i + 1})`} opacity={c.o} />
            ))}
          </g>
        );
      })}
    </g>
  );
}

export function EntryBeam() {
  return <polygon points={pts([0, 60], [0, 600], [ENTRY.x, ENTRY.y + 8], [ENTRY.x, ENTRY.y - 8])} fill="currentColor" opacity={0.018} />;
}

/** La scène complète, figée. `light` réduit le nombre de fragments (mobile). */
export function PrismScene({ light = false, className }: { light?: boolean; className?: string }) {
  const frags = fragments(light ? 18 : 40);
  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className={className} role="img" aria-label="Des fragments de documents et de chiffres en désordre traversent un prisme et ressortent en bandes ordonnées.">
      <EntryBeam />
      <g className="text-foreground">
        {frags.map((f, i) => (
          <FragmentShape key={i} f={f} />
        ))}
      </g>
      <SpectrumFan />
      <BandRows />
      <g className="text-foreground">
        <PrismBody />
      </g>
    </svg>
  );
}
