"use client";

import * as React from "react";
import { AppWindow, Frame, LightNumber, SectionHead } from "./kit";
import { ExempleNote, useMetier } from "./metier-context";
import { MockFiche, MockMission, MockOutil, MockVerifs } from "./mock-screens";
import { cn } from "@/lib/utils";

// « Comment ça marche » : une fenêtre de lumière montre l'écran de l'étape active, rempli avec
// l'exemple du métier choisi, et trois cartes en dessous. Les étapes avancent seules (barre dorée),
// et on peut cliquer pour choisir. Pause hors de l'écran ; fixe si l'on demande moins d'animations.

export type StepItem = { label: string; title: string; text: string };

const DURATION = 5200;

export function SectionSteps({ eyebrow, title, intro, steps }: { eyebrow: string; title: string; intro: string; steps: StepItem[] }) {
  const { exemple, metier } = useMetier();
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

  const screens = [
    <MockMission key="m" ex={exemple} className="w-full max-w-[30rem]" />,
    <MockOutil key="o" ex={exemple} className="w-full max-w-[34rem]" />,
    <div key="f" className="grid w-full max-w-[44rem] gap-3 sm:grid-cols-2">
      <MockVerifs ex={exemple} />
      <MockFiche ex={exemple} />
    </div>,
  ];

  return (
    <div>
      <SectionHead eyebrow={eyebrow} title={title}>
        <p>{intro}</p>
      </SectionHead>

      <div ref={ref} className="mt-14">
        <Frame caption={<>Étape {active + 1} sur {steps.length} · exemple en {metier.toLowerCase()}</>} scene="nuit-2" bodyClassName="pb-6 sm:pb-8">
          <AppWindow address="entreprena · session" className="mx-auto max-w-[56rem]">
            <div className="grid min-h-[22rem] place-items-center bg-[radial-gradient(70%_80%_at_20%_10%,#f6e7c8,transparent),radial-gradient(70%_80%_at_90%_90%,#cfe3df,transparent)] px-4 py-8 sm:min-h-[24rem] sm:px-10">
              <div key={`${active}-${exemple.id}`} className="mock-in flex w-full justify-center drop-shadow-[0_20px_30px_rgb(20_50_50/0.18)]">
                {screens[active]}
              </div>
            </div>
          </AppWindow>
          <ExempleNote className="mt-3 text-center !text-white/70" />

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
                    "relative overflow-hidden rounded-[20px] p-5 text-left transition-[background-color,color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                    on ? "bg-[oklch(0.985_0.004_85)] text-[oklch(0.2_0.02_200)] shadow-[0_20px_50px_-25px_rgb(0_0_0/0.6)]" : "bg-white/[0.08] text-white/60 backdrop-blur hover:bg-white/[0.12]",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[0.875rem] font-medium", on ? "text-[oklch(0.45_0.02_200)]" : "text-white/60")}>{s.label}</span>
                    <LightNumber n={i + 1} className="text-[1.125rem]" />
                  </div>
                  <p className="mt-4 font-display text-[1.25rem] leading-[1.15] font-semibold tracking-[-0.025em]">{s.title}</p>
                  <p className={cn("mt-2 text-[0.9375rem] leading-relaxed", on ? "text-[oklch(0.4_0.02_200)]" : "text-white/50")}>{s.text}</p>
                  {on && auto && (
                    <span
                      key={`p-${active}`}
                      aria-hidden
                      className="step-progress absolute bottom-0 left-0 h-[3px] w-full origin-left bg-[linear-gradient(90deg,#e9b872,#4f9e98)]"
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
