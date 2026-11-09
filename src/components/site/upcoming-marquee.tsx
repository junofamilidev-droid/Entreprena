import type { MetierAVenir } from "@/lib/vitrine/metiers";

// Métiers à venir : deux bandeaux de cartes de verre qui défilent lentement en sens opposés,
// sur un fond aux couleurs de la matière fluide. Pause au survol ; immobiles (et en grille)
// si l'appareil demande moins d'animations. La copie qui assure la boucle est cachée aux lecteurs d'écran.

function Card({ m }: { m: MetierAVenir }) {
  return (
    <div className="w-[17.5rem] shrink-0 rounded-[1.25rem] border border-white/80 bg-white/55 p-5 shadow-[0_20px_50px_-30px_rgb(20_60_60/0.35)] backdrop-blur-md sm:w-[20rem] dark:border-white/10 dark:bg-white/[0.06]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-[1.0625rem] font-semibold tracking-[-0.01em]">{m.nom}</p>
        <span className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-[oklch(0.7_0.12_75)]" aria-hidden />
          Bientôt
        </span>
      </div>
      <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-foreground/70">{m.phrase}</p>
    </div>
  );
}

function Row({ items, reverse }: { items: MetierAVenir[]; reverse?: boolean }) {
  return (
    <div className="marquee group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      {[0, 1].map((copy) => (
        <ul
          key={copy}
          aria-hidden={copy === 1 || undefined}
          className={`marquee-track flex shrink-0 gap-4 pr-4 ${reverse ? "marquee-reverse" : ""}`}
        >
          {items.map((m) => (
            <li key={m.nom}>
              <Card m={m} />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

export function UpcomingMarquee({ metiers, title }: { metiers: MetierAVenir[]; title: string }) {
  if (!metiers.length) return null;
  const half = Math.ceil(metiers.length / 2);
  return (
    <div className="relative mt-16 overflow-hidden py-12">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#f4ecdf] dark:bg-[oklch(0.2_0.012_200)]">
        <div className="absolute top-[-30%] left-[5%] size-[40vw] max-w-[620px] rounded-full bg-[#f1d4a3] opacity-60 blur-[110px] dark:opacity-15" />
        <div className="absolute right-[0%] bottom-[-40%] size-[45vw] max-w-[700px] rounded-full bg-[#86b5ad] opacity-60 blur-[110px] dark:opacity-15" />
      </div>
      <div className="site-container mb-8 flex flex-wrap items-end justify-between gap-3">
        <h3 className="type-h3 text-[clamp(1.375rem,1.1rem+1vw,1.875rem)]">{title}</h3>
        <p className="type-small text-muted-foreground">{metiers.length} métiers en préparation</p>
      </div>
      <div className="space-y-4">
        <Row items={metiers.slice(0, half)} />
        <Row items={metiers.slice(half)} reverse />
      </div>
    </div>
  );
}
