"use client";

import * as React from "react";
import Image from "next/image";

// « Comment ça marche » : trois cartes reliées par un chemin qui se trace au fil du défilement.
// Chaque carte s'éclaire quand le chemin l'atteint. Sur mobile, le chemin descend à gauche des cartes.
// Si l'appareil demande moins d'animations : chemin entier et cartes éclairées d'emblée.

export type Step = { title: string; text: string; image: string; w: number; h: number; alt: string };

export function StepsPath({ steps }: { steps: Step[] }) {
  const root = React.useRef<HTMLDivElement>(null);
  const [progress, setProgress] = React.useState(1);

  React.useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 quand le haut du bloc atteint 80 % de l'écran, 1 quand son bas atteint 75 %
      const p = (vh * 0.8 - r.top) / (r.height + vh * 0.05);
      setProgress(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const reached = (i: number) => progress >= (i / (steps.length - 1)) * 0.92;

  return (
    <div ref={root} className="relative">
      {/* Le chemin : horizontal sur grand écran, vertical sur mobile. */}
      <svg aria-hidden className="pointer-events-none absolute top-1 left-[16%] hidden h-10 w-[68%] overflow-visible md:block" viewBox="0 0 1000 40" preserveAspectRatio="none">
        <path d="M0 20 C 160 -10, 340 50, 500 20 S 840 -10, 1000 20" fill="none" className="stroke-border" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeDasharray="2 8" />
        <path
          d="M0 20 C 160 -10, 340 50, 500 20 S 840 -10, 1000 20"
          fill="none"
          className="stroke-primary"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - progress}
          strokeLinecap="round"
        />
      </svg>
      <div aria-hidden className="absolute top-4 bottom-4 left-[1.15rem] w-px bg-border md:hidden">
        <div className="w-px origin-top bg-primary" style={{ height: "100%", transform: `scaleY(${progress})` }} />
      </div>

      <ol className="relative grid gap-6 pl-12 md:grid-cols-3 md:gap-8 md:pl-0">
        {steps.map((s, i) => {
          const on = reached(i);
          return (
            <li key={s.title} className="relative">
              <span
                aria-hidden
                className={`absolute top-4 -left-12 grid size-9 place-items-center rounded-full border text-sm font-semibold transition-colors duration-500 md:static md:mx-auto md:mb-5 md:size-12 md:text-base ${
                  on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <div
                className={`overflow-hidden rounded-[1.5rem] border transition-[opacity,transform,box-shadow,border-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  on
                    ? "border-white/80 bg-white/70 opacity-100 shadow-[0_30px_70px_-40px_rgb(20_60_60/0.4)] dark:border-white/10 dark:bg-white/[0.05]"
                    : "translate-y-2 border-border/60 bg-white/30 opacity-55 dark:bg-white/[0.02]"
                }`}
              >
                <div className="relative h-36 overflow-hidden border-b border-white/70 bg-[radial-gradient(ellipse_at_20%_10%,#f4e3c4,transparent_65%),radial-gradient(ellipse_at_90%_90%,#a9cdc6,transparent_60%)] dark:border-white/10">
                  <Image src={`${s.image}-clair.webp`} width={s.w} height={s.h} alt={s.alt} sizes="(min-width: 768px) 30vw, 80vw" className="absolute top-5 left-5 w-[118%] max-w-none rounded-lg shadow-[0_12px_30px_-12px_rgb(0_0_0/0.25)] dark:hidden" />
                  <Image src={`${s.image}-sombre.webp`} width={s.w} height={s.h} alt={s.alt} sizes="(min-width: 768px) 30vw, 80vw" className="absolute top-5 left-5 hidden w-[118%] max-w-none rounded-lg dark:block" />
                </div>
                <div className="p-6">
                  <h3 className="type-h3">{s.title}</h3>
                  <p className="mt-2.5 type-body text-foreground/75">{s.text}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
