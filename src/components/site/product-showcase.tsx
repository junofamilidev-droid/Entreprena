"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Section « produit » : de vraies captures de la plateforme, en cartes de verre dépoli qui flottent
// autour du titre, avec un léger parallaxe lié au défilement (chaque carte à sa propre vitesse).
// Le verre dépoli n'est utilisé qu'ici. Les images sont listées dans public/captures/A-FOURNIR.md.

type Shot = {
  src: string; // sans suffixe : « -clair.webp » et « -sombre.webp » sont ajoutés
  w: number;
  h: number;
  alt: string;
  label: string;
  /** Position sur grand écran (dans une scène de 1200 × 980). */
  pos: string;
  /** Amplitude du parallaxe, en pixels (négatif : monte plus vite que la page). */
  depth: number;
};

const SHOTS: Shot[] = [
  {
    src: "/captures/mission",
    w: 760,
    h: 1008,
    alt: "La mission : le message de la cheffe de mission, avec le livrable attendu.",
    label: "La mission",
    pos: "lg:left-[0%] lg:top-[6%] lg:w-[25%]",
    depth: -90,
  },
  {
    src: "/captures/outil",
    w: 900,
    h: 657,
    alt: "L'outil : les règles du skill Claude, avec et sans chaque règle.",
    label: "L'outil",
    pos: "lg:right-[0%] lg:top-[2%] lg:w-[33%]",
    depth: -150,
  },
  {
    src: "/captures/test",
    w: 760,
    h: 762,
    alt: "Les vérifications : la réponse de Claude contrôlée point par point.",
    label: "Les vérifications",
    pos: "lg:right-[4%] lg:top-[50%] lg:w-[27%]",
    depth: -40,
  },
  {
    src: "/captures/fiche",
    w: 860,
    h: 517,
    alt: "La fiche : la méthode à réutiliser sur un vrai dossier, avec ses pièges.",
    label: "La fiche",
    pos: "lg:left-[5%] lg:top-[62%] lg:w-[30%]",
    depth: -120,
  },
];

function Glass({ shot }: { shot: Shot }) {
  return (
    <figure
      data-depth={shot.depth}
      className={cn(
        "will-change-transform",
        "relative rounded-[1.4rem] border border-white/70 bg-white/40 p-1.5 shadow-[0_30px_80px_-30px_rgb(40_30_20/0.35)] backdrop-blur-xl",
        "dark:border-white/12 dark:bg-white/[0.06] dark:shadow-[0_30px_80px_-30px_rgb(0_0_0/0.7)]",
        "lg:absolute",
        shot.pos,
      )}
    >
      <Image src={`${shot.src}-clair.webp`} width={shot.w} height={shot.h} alt={shot.alt} sizes="(min-width: 1024px) 30vw, 46vw" className="w-full rounded-[1.05rem] dark:hidden" />
      <Image src={`${shot.src}-sombre.webp`} width={shot.w} height={shot.h} alt={shot.alt} sizes="(min-width: 1024px) 30vw, 46vw" className="hidden w-full rounded-[1.05rem] dark:block" />
      <figcaption className="px-2.5 pt-2 pb-1 text-[0.8125rem] font-medium text-foreground/70">{shot.label}</figcaption>
    </figure>
  );
}

/**
 * Parallaxe lié au défilement : chaque élément [data-depth] glisse verticalement de ±depth/2 px
 * pendant que la section traverse l'écran. Transform seulement, une mise à jour par image,
 * rien quand la section est hors de l'écran ou que l'appareil demande moins d'animations.
 */
function useParallax(ref: React.RefObject<HTMLDivElement | null>) {
  React.useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"));
    const small = window.matchMedia("(max-width: 1023px)");
    let raf = 0;
    let active = false;
    const update = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))); // 0 → 1 pendant la traversée
      const k = small.matches ? 0.35 : 1;
      for (const el of items) {
        const d = Number(el.dataset.depth) * k;
        el.style.transform = `translate3d(0, ${((p - 0.5) * d).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => {
      if (active && !raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      active = e.isIntersecting;
      if (active) onScroll();
    });
    io.observe(root);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);
}

export function ProductShowcase({ title, text, word }: { title: string; text: string; word: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useParallax(ref);

  return (
    <div ref={ref} className="relative isolate overflow-hidden">
      {/* La « pièce » derrière le verre : des halos chauds très doux, pour que le dépoli se lise. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-muted">
        <div className="absolute top-[8%] left-[12%] size-[40vw] max-w-[640px] rounded-full bg-[oklch(0.86_0.06_70)] opacity-60 blur-[110px] dark:opacity-15" />
        <div className="absolute right-[6%] bottom-[6%] size-[36vw] max-w-[560px] rounded-full bg-[oklch(0.85_0.05_200)] opacity-60 blur-[110px] dark:opacity-15" />
      </div>

      <div className="site-container site-section">
        <div className="relative lg:h-[980px]">
          {/* Mot géant en fond, comme une signature */}
          <p
            aria-hidden
            data-depth={120}
            className="pointer-events-none absolute inset-x-0 top-[2%] -z-10 hidden text-center font-display text-[15vw] leading-none font-semibold tracking-[-0.05em] whitespace-nowrap text-foreground/[0.06] select-none lg:block xl:text-[13rem]"
          >
            {word}
          </p>

          {/* Le titre, au centre des cartes */}
          <div className="relative z-10 mx-auto max-w-[30rem] text-center lg:absolute lg:top-[34%] lg:left-1/2 lg:-translate-x-1/2">
            <h2 className="type-h2">{title}</h2>
            <p className="mx-auto mt-5 max-w-[26rem] type-lead text-foreground/75">{text}</p>
          </div>

          <div className="mt-12 grid grid-cols-2 items-start gap-3 sm:gap-5 lg:mt-0 lg:block">
            {SHOTS.map((s, i) => (
              <div key={s.src} className={cn("lg:contents", i % 2 === 1 && "mt-10 sm:mt-16")}>
                <Glass shot={s} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
