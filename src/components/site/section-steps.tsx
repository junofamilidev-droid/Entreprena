"use client";

import * as React from "react";
import Image from "next/image";
import { AppWindow, Frame, SectionHead } from "./kit";
import { cn } from "@/lib/utils";

// « Comment ça marche » : un cadre produit qui montre la vraie capture de l'étape active,
// et trois cartes sous la fenêtre. La carte active est claire, les autres en verre sombre ;
// les étapes avancent seules (barre de progression), et on peut cliquer pour choisir.

export type StepItem = { label: string; title: string; text: string; image: string; w: number; h: number; alt: string };

const DURATION = 5200;

export function SectionSteps({ eyebrow, title, intro, steps }: { eyebrow: string; title: string; intro: string; steps: StepItem[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(0);
  const [auto, setAuto] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => setAuto(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (!auto) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % steps.length), DURATION);
    return () => clearTimeout(id);
  }, [auto, active, steps.length]);

  return (
    <div>
      <SectionHead eyebrow={eyebrow} title={title}>
        <p>{intro}</p>
      </SectionHead>

      <div ref={ref} className="mt-14">
        <Frame label={`Étape ${active + 1} sur ${steps.length}`} scene="nuit-2" bodyClassName="pb-6 sm:pb-8">
          <AppWindow address="entreprena · session" className="mx-auto max-w-[56rem]">
            <div className="relative aspect-[16/9] overflow-hidden bg-[oklch(0.96_0.006_85)]">
              {steps.map((s, i) => (
                <Image
                  key={s.image}
                  src={`${s.image}-clair.webp`}
                  width={s.w}
                  height={s.h}
                  alt={s.alt}
                  sizes="(min-width: 1024px) 56rem, 92vw"
                  className={cn(
                    "absolute top-[6%] left-1/2 w-auto max-w-[86%] -translate-x-1/2 rounded-lg shadow-[0_20px_50px_-20px_rgb(0_0_0/0.35)] transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    s.h > s.w ? "h-[120%]" : "h-[96%]",
                    i === active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                  )}
                />
              ))}
            </div>
          </AppWindow>

          <div role="tablist" aria-label="Étapes" className="mt-6 grid gap-3 md:grid-cols-3">
            {steps.map((s, i) => {
              const on = i === active;
              return (
                <button
                  key={s.title}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(i)}
                  className={cn(
                    "relative overflow-hidden rounded-[8px] border p-1.5 text-left transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                    on ? "border-white/40" : "border-white/20 hover:border-white/35",
                  )}
                >
                  <div className={cn("h-full rounded-[5px] p-5 transition-colors duration-300", on ? "bg-[oklch(0.985_0.004_85)] text-[oklch(0.2_0.02_200)]" : "bg-black/35 text-white/45")}>
                    <div className={cn("flex items-center justify-between border-b pb-3 font-mono text-[0.75rem] uppercase", on ? "border-[oklch(0.2_0.02_200)]" : "border-white/15")}>
                      <span>{s.label}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className={cn("h-2.5 w-1.5", on ? "bg-[oklch(0.2_0.02_200)]/60" : "bg-white/30")} aria-hidden />
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="mt-5 font-display text-[1.25rem] leading-[1.15] font-medium tracking-[-0.02em]">{s.title}</p>
                    <p className={cn("mt-2 text-[0.9375rem] leading-relaxed", on ? "text-[oklch(0.4_0.02_200)]" : "text-white/40")}>{s.text}</p>
                  </div>
                  {on && auto && (
                    <span
                      key={`p-${active}`}
                      aria-hidden
                      className="step-progress absolute bottom-0 left-0 h-[2px] w-full origin-left bg-[oklch(0.86_0.11_82)]"
                      style={{ animationDuration: `${DURATION}ms` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </Frame>
      </div>
    </div>
  );
}
