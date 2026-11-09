"use client";

import * as React from "react";
import Image from "next/image";
import { AppWindow, Eyebrow, Frame } from "./kit";
import { ExempleNote, useMetier } from "./metier-context";
import { cn } from "@/lib/utils";

// Le constat, en trois temps :
// 1. deux chiffres sourcés, sans dramatiser (la peur, puis ce que disent vraiment les études) ;
// 2. « Ce qui change dans votre métier » : la phrase clé en titre, puis le tableau « Qui fait quoi » ;
// 3. « Ce qui change dans votre métier » : ce qui part vers l'outil se raye, ce qui prend de la valeur apparaît.
// Les chiffres se comptent et les lignes basculent quand la section arrive à l'écran.

type Chiffre = { label: string; valeur: number; suffixe: string; texte: string; source: string; url: string };
const DONE = { claude: "Préparé", vous: "Validé" };
const PENDING = { claude: "En cours", vous: "À faire" };

function useInView<T extends Element>(threshold = 0.35) {
  const ref = React.useRef<T>(null);
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setSeen(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

function CountUp({ to, suffix, run }: { to: number; suffix: string; run: boolean }) {
  const [v, setV] = React.useState(to);
  React.useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 1400);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to]);
  const decimals = Number.isInteger(to) ? 0 : 1;
  return (
    <span className="tabular-nums">
      {v.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

export function SectionConstat({
  eyebrow,
  title,
  chiffres,
  commentaire,
  transition,
  changeTitle,
  changeIntro,
  reponse,
}: {
  eyebrow: string;
  title: string;
  chiffres: Chiffre[];
  commentaire: string;
  transition: string;
  changeTitle: string;
  changeIntro: string;
  reponse: string;
}) {
  const [statsRef, statsSeen] = useInView<HTMLDivElement>(0.4);
  const { exemple, metier } = useMetier();
  const rows = exemple.taches;
  const [rowsRef, rowsInView] = useInView<HTMLDivElement>(0.4);
  const [step, setStep] = React.useState(rows.length);
  // Avant que la section n'arrive, les chiffres partent de zéro (sans JavaScript, ils restent à leur valeur).
  const [armed, setArmed] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setArmed(!window.matchMedia("(prefers-reduced-motion: reduce)").matches), 0);
    return () => clearTimeout(t);
  }, []);
  // Sans JavaScript (ou avant l'hydratation), tout est visible à sa place finale.
  const rowsSeen = !armed || rowsInView;
  // Les statuts passent un à un quand le tableau arrive à l'écran.
  React.useEffect(() => {
    if (!armed) return;
    if (!rowsSeen) {
      const t = setTimeout(() => setStep(0), 0);
      return () => clearTimeout(t);
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const run = () => {
      i += 1;
      setStep(i);
      if (i < rows.length) timer = setTimeout(run, 650);
    };
    timer = setTimeout(run, 500);
    return () => clearTimeout(timer);
  }, [armed, rowsSeen, rows.length, exemple.id]);

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-end lg:gap-20">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-4 font-display text-[clamp(2.25rem,1.3rem+3.4vw,4.25rem)] leading-[1] font-semibold tracking-[-0.045em]">{title}</h2>
        </div>
        <p className="max-w-[36rem] type-lead text-foreground/75 lg:justify-self-end">{commentaire}</p>
      </div>

      {/* 1. Deux chiffres : la peur, puis ce que disent les études */}
      <div ref={statsRef} className="mt-14 grid gap-5 md:grid-cols-2">
        {chiffres.map((c, i) => {
          const lit = i === 1;
          return (
            <figure
              key={c.source}
              className={cn(
                "relative isolate flex flex-col overflow-hidden rounded-[28px] p-7 sm:p-10",
                lit ? "text-white" : "border border-border bg-card",
              )}
            >
              {lit && <Image src="/paysages/nuit-2.webp" alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="-z-10 object-cover" />}
              <p className={cn("text-[0.9375rem] font-medium", lit ? "text-white/75" : "text-muted-foreground")}>{c.label}</p>
              <p
                className={cn(
                  "mt-6 font-display text-[clamp(3.5rem,2.5rem+4vw,6rem)] leading-[0.9] font-semibold tracking-[-0.05em]",
                  lit && "bg-[linear-gradient(120deg,#f6e7c8,#e9b872_45%,#9fd1c9)] bg-clip-text text-transparent",
                )}
              >
                {armed ? <CountUp to={c.valeur} suffix={c.suffixe} run={statsSeen} /> : `${c.valeur.toLocaleString("fr-FR")}${c.suffixe}`}
              </p>
              <figcaption className="mt-5 flex flex-1 flex-col">
                <span className={cn("max-w-[30rem] type-lead", lit ? "text-white/90" : "text-foreground/85")}>{c.texte}</span>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("mt-auto pt-6 text-[0.8125rem] underline decoration-1 underline-offset-4", lit ? "text-white/65 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                >
                  Source : {c.source}
                </a>
              </figcaption>
            </figure>
          );
        })}
      </div>


      {/* 3. Ce qui change : le tableau « Qui fait quoi » d'une mission type, dont les statuts passent en direct. */}
      {/* Un seul bloc lisible : petit intitulé, la phrase clé en titre, une ligne d'explication, puis le tableau. */}
      <div className="mt-24 border-t border-border pt-16">
        <div className="mb-10 grid gap-5 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-20">
          <div>
            <Eyebrow>{changeTitle}</Eyebrow>
            <h3 className="mt-4 max-w-[22ch] font-display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] leading-[1.08] font-semibold tracking-[-0.04em]">{transition}</h3>
          </div>
          <p className="max-w-[30rem] type-lead text-foreground/70 lg:justify-self-end">{changeIntro}</p>
        </div>
        <div ref={rowsRef}>
          <Frame caption={<>Une mission en {metier.toLowerCase()} : qui fait quoi</>} scene="nuit-1">
            <AppWindow address="entreprena · mission en cours" className="mx-auto max-w-[62rem]">
              <div className="px-5 pt-7 pb-4 sm:px-10 sm:pt-9">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <p className="font-display text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] font-semibold tracking-[-0.035em]">Qui fait quoi</p>
                  <p className="text-[0.8125rem] text-[oklch(0.5_0.02_200)]">{exemple.mission.objet} · données fictives</p>
                </div>
                <table className="mt-6 w-full text-left text-[0.875rem]">
                  <thead>
                    <tr className="border-b border-[oklch(0.9_0.005_200)] text-[0.75rem] text-[oklch(0.45_0.02_200)]">
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
                        <tr key={exemple.id + r.task} className="border-b border-[oklch(0.93_0.004_200)] last:border-0">
                          <td className="py-3.5 pr-3">{r.task}</td>
                          <td className="hidden py-3.5 pr-3 text-[0.8125rem] text-[oklch(0.45_0.02_200)] sm:table-cell">{claude ? "Claude + l'outil" : "Vous"}</td>
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
                              {done ? DONE[r.by] : PENDING[r.by]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </AppWindow>
            <ExempleNote className="mt-4 text-center !text-white/70" />
            {/* Conclusion : posée dans la fenêtre de lumière, sous le tableau, comme une légende. */}
            <div className="mx-auto mt-8 grid max-w-[62rem] gap-5 border-t border-white/15 pt-8 sm:grid-cols-[auto_1fr] sm:gap-7">
              <span aria-hidden className="h-1 w-14 rounded-full bg-[linear-gradient(90deg,#e9b872,#9fd1c9)] sm:mt-4 sm:h-auto sm:w-1" />
              <p className="font-display text-[clamp(1.25rem,1rem+1vw,1.75rem)] leading-[1.3] font-medium tracking-[-0.02em] text-white">{reponse}</p>
            </div>
          </Frame>
        </div>

      </div>
    </div>
  );
}
