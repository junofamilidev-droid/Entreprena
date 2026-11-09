"use client";

import * as React from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Carrousel des fiches métier : on fait défiler de gauche à droite (boutons, glisser, flèches du clavier).
// La fiche au centre est nette ; ses voisines reculent légèrement (échelle, opacité). Défilement aimanté.

export function FormationsCarousel({ slides, labels }: { slides: React.ReactNode[]; labels: string[] }) {
  const track = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const el = track.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const update = () => {
      raf = 0;
      const box = el.getBoundingClientRect();
      const center = box.left + box.width / 2;
      let best = 0;
      let bestD = Infinity;
      items.forEach((it, i) => {
        // Mesure sans l'échelle appliquée : on part de la position de la fiche dans la piste.
        const left = box.left - el.scrollLeft + it.offsetLeft;
        const c = left + it.offsetWidth / 2;
        const d = (c - center) / it.offsetWidth; // -1 … 1 autour de la fiche centrale
        if (Math.abs(d) < bestD) {
          bestD = Math.abs(d);
          best = i;
        }
        if (!reduce) {
          const k = Math.min(1, Math.abs(d));
          it.style.transform = `scale(${(1 - k * 0.06).toFixed(3)})`;
          it.style.opacity = (1 - k * 0.45).toFixed(3);
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(slides.length - 1, i));
    const it = el.children[n] as HTMLElement;
    el.scrollTo({ left: it.offsetLeft - (el.clientWidth - it.offsetWidth) / 2, behavior: "smooth" });
  };

  return (
    <div
      role="region"
      aria-roledescription="carrousel"
      aria-label="Les formations par métier"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(active + 1);
        if (e.key === "ArrowLeft") go(active - 1);
      }}
    >
      <div
        ref={track}
        tabIndex={0}
        className="relative flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-[calc((100vw-min(92vw,var(--content-max)))/2)] py-10 [scrollbar-width:none] focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <div
            key={labels[i]}
            role="group"
            aria-roledescription="fiche"
            aria-label={`${i + 1} sur ${slides.length} : ${labels[i]}`}
            className="w-[min(92vw,var(--content-max))] shrink-0 snap-center transition-[transform,opacity] duration-200 ease-out will-change-transform"
          >
            {s}
          </div>
        ))}
      </div>

      <div className="site-container mt-2 flex items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Choisir un métier">
          {labels.map((l, i) => (
            <button
              key={l}
              role="tab"
              aria-selected={i === active}
              aria-label={l}
              onClick={() => go(i)}
              className="group grid h-6 place-items-center px-0.5 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-[width,background-color] duration-300",
                  i === active ? "w-8 bg-[linear-gradient(90deg,#e9b872,#4f9e98)]" : "w-1.5 bg-foreground/20 group-hover:bg-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-[0.875rem] text-muted-foreground tabular-nums sm:inline" aria-live="polite">
            {labels[active]} · {active + 1} / {slides.length}
          </span>
          {[
            { d: -1, label: "Fiche précédente", Icon: ArrowLeftIcon },
            { d: 1, label: "Fiche suivante", Icon: ArrowRightIcon },
          ].map(({ d, label, Icon }) => (
            <button
              key={d}
              onClick={() => go(active + d)}
              disabled={d < 0 ? active === 0 : active === slides.length - 1}
              aria-label={label}
              className="grid size-11 place-items-center rounded-full border border-border bg-card transition-colors hover:bg-muted disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
