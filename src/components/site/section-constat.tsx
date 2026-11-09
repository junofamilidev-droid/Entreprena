"use client";

import * as React from "react";
import { AppWindow, Frame, SectionHead } from "./kit";
import { cn } from "@/lib/utils";

// Le constat, montré plutôt que dit : un tableau de mission « en direct » où chaque tâche
// passe à son statut final, l'une après l'autre, quand la section arrive à l'écran.
// Claude prépare (trier, calculer, rédiger) ; vous jugez, vérifiez et signez.

export type ConstatRow = { task: string; by: "claude" | "vous"; done: string; pending: string };

export function SectionConstat({
  eyebrow,
  title,
  text,
  rows,
  actionsTitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  text: string[];
  rows: ConstatRow[];
  actionsTitle: string;
  actions: string[];
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [step, setStep] = React.useState(rows.length); // nombre de lignes terminées (tout terminé sans JS)

  React.useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout>;
    const run = (i: number) => {
      setStep(i);
      if (i < rows.length) timer = setTimeout(() => run(i + 1), 650);
    };
    const reset = setTimeout(() => setStep(0), 0);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        timer = setTimeout(() => run(1), 500);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      clearTimeout(reset);
      clearTimeout(timer);
      io.disconnect();
    };
  }, [rows.length]);

  return (
    <div>
      <SectionHead eyebrow={eyebrow} title={title}>
        {text.map((t) => (
          <p key={t} className="mt-3 first:mt-0">
            {t}
          </p>
        ))}
      </SectionHead>

      <div ref={ref} className="mt-14">
        <Frame label="Mission · Revue analytique" scene="nuit-1">
          <AppWindow address="entreprena · mission en cours" className="mx-auto max-w-[62rem]">
            <div className="px-5 pt-7 pb-4 sm:px-10 sm:pt-9">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="font-display text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] font-medium tracking-[-0.03em]">Qui fait quoi</p>
                <p className="font-mono text-[0.75rem] text-[oklch(0.5_0.02_200)] uppercase">Dossier Nordelia · données fictives</p>
              </div>
              <table className="mt-6 w-full text-left text-[0.875rem]">
                <thead>
                  <tr className="border-b border-[oklch(0.9_0.005_200)] font-mono text-[0.6875rem] tracking-[0.04em] text-[oklch(0.35_0.02_200)] uppercase">
                    <th className="py-3 pr-3 font-medium">Tâche</th>
                    <th className="hidden py-3 pr-3 font-medium sm:table-cell">Fait par</th>
                    <th className="py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const done = i < step;
                    const claude = r.by === "claude";
                    return (
                      <tr key={r.task} className="border-b border-[oklch(0.93_0.004_200)] last:border-0">
                        <td className="py-3.5 pr-3">{r.task}</td>
                        <td className="hidden py-3.5 pr-3 font-mono text-[0.8125rem] text-[oklch(0.45_0.02_200)] sm:table-cell">{claude ? "Claude + l'outil" : "Vous"}</td>
                        <td className="py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8125rem] font-medium whitespace-nowrap transition-colors duration-500",
                              !done && "bg-[oklch(0.94_0.005_200)] text-[oklch(0.45_0.02_200)]",
                              done && claude && "bg-[oklch(0.9_0.05_190)] text-[oklch(0.3_0.06_200)]",
                              done && !claude && "bg-[oklch(0.88_0.1_80)] text-[oklch(0.3_0.06_60)]",
                            )}
                          >
                            <span className={cn("size-1.5 rounded-full", done ? "bg-current" : "animate-pulse bg-current/60")} aria-hidden />
                            {done ? r.done : r.pending}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AppWindow>
        </Frame>
      </div>

      <div className="mt-20 grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <h3 className="max-w-[16ch] font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] leading-[1.1] font-medium tracking-[-0.03em]">{actionsTitle}</h3>
        <ol className="border-t border-border">
          {actions.map((a, i) => (
            <li key={a} className="flex items-baseline justify-between gap-6 border-b border-border py-5">
              <span className="type-body">{a}</span>
              <span className="shrink-0 font-mono text-[0.75rem] text-muted-foreground">| {String(i + 1).padStart(2, "0")} |</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
