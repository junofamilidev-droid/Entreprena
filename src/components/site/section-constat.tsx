"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowRightIcon } from "lucide-react";
import { Eyebrow, LightDot } from "./kit";
import { cn } from "@/lib/utils";

// Le constat, en trois temps :
// 1. deux chiffres sourcés, sans dramatiser (la peur, puis ce que disent vraiment les études) ;
// 2. une phrase de transition, dans le ton d'un senior de terrain ;
// 3. « Ce qui change dans votre métier » : ce qui part vers l'outil se raye, ce qui prend de la valeur apparaît.
// Les chiffres se comptent et les lignes basculent quand la section arrive à l'écran.

type Chiffre = { valeur: number; suffixe: string; texte: string; source: string; url: string };
type Bascule = { avant: string; apres: string };

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
  bascules,
  reponse,
}: {
  eyebrow: string;
  title: string;
  chiffres: Chiffre[];
  commentaire: string;
  transition: string;
  changeTitle: string;
  bascules: Bascule[];
  reponse: string;
}) {
  const [statsRef, statsSeen] = useInView<HTMLDivElement>(0.4);
  const [rowsRef, rowsInView] = useInView<HTMLOListElement>(0.3);
  // Avant que la section n'arrive, les chiffres partent de zéro (sans JavaScript, ils restent à leur valeur).
  const [armed, setArmed] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setArmed(!window.matchMedia("(prefers-reduced-motion: reduce)").matches), 0);
    return () => clearTimeout(t);
  }, []);
  // Sans JavaScript (ou avant l'hydratation), tout est visible à sa place finale.
  const rowsSeen = !armed || rowsInView;

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
              <p className={cn("text-[0.9375rem] font-medium", lit ? "text-white/75" : "text-muted-foreground")}>{lit ? "Ce que disent les études" : "Ce que vous ressentez"}</p>
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

      {/* 2. Transition */}
      <p className="mx-auto mt-16 max-w-[34ch] text-center font-display text-[clamp(1.5rem,1.1rem+1.6vw,2.25rem)] leading-[1.2] font-semibold tracking-[-0.03em]">{transition}</p>

      {/* 3. Ce qui change : ce qui part vers l'outil se raye, ce qui prend de la valeur apparaît */}
      <div className="mt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h3 className="font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] font-semibold tracking-[-0.035em]">{changeTitle}</h3>
          <div className="hidden gap-16 text-[0.875rem] text-muted-foreground md:flex">
            <span>Ce qui part vers l&apos;outil</span>
            <span className="inline-flex items-center gap-2 text-foreground">
              <LightDot className="size-2" /> Ce qui prend de la valeur
            </span>
          </div>
        </div>
        <ol ref={rowsRef} className="border-t border-foreground/80">
          {bascules.map((b, i) => (
            <li
              key={b.avant}
              className="grid items-center gap-3 border-b border-border py-6 md:grid-cols-[1fr_auto_1.2fr] md:gap-8"
              style={{ ["--d" as string]: `${i * 260}ms` }}
            >
              <span
                className={cn(
                  "type-lead text-muted-foreground [background:linear-gradient(currentColor,currentColor)_no-repeat_0_55%/0%_1.5px] transition-[background-size,color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [transition-delay:var(--d)]",
                  rowsSeen && "[background-size:100%_1.5px] text-muted-foreground/70",
                )}
              >
                {b.avant}
              </span>
              <ArrowRightIcon
                aria-hidden
                className={cn(
                  "hidden size-5 text-[#4f9e98] transition-[opacity,transform] duration-500 [transition-delay:calc(var(--d)+250ms)] md:block",
                  rowsSeen ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
                )}
              />
              <span
                className={cn(
                  "font-display text-[clamp(1.25rem,1.05rem+0.8vw,1.625rem)] leading-[1.2] font-semibold tracking-[-0.02em] transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [transition-delay:calc(var(--d)+400ms)]",
                  rowsSeen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
                )}
              >
                <span className="md:hidden" aria-hidden>
                  →{" "}
                </span>
                {b.apres}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-[44rem] type-lead text-foreground/80">{reponse}</p>
      </div>
    </div>
  );
}
