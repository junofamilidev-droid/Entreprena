"use client";

import * as React from "react";
import { LockIcon } from "lucide-react";
import { LIBELLE_EXPOSITION, LIBELLE_PREPARATION, type NiveauExposition, type Resultat } from "@/lib/diagnostic-metier/calcul";
import type { MetierPublic } from "@/lib/diagnostic-metier/public";
import { cn } from "@/lib/utils";

// Page de résultat, partie visible sans email : le niveau et sa jauge, une phrase lucide puis rassurante,
// la tâche la plus exposée (le détail est flouté : son texte n'est pas encore envoyé au navigateur),
// et le niveau de préparation.

const PHRASES: Record<NiveauExposition, string> = {
  moderee: "Votre métier évolue, sans urgence. C'est le bon moment pour prendre de l'avance.",
  marquee: "Une partie importante de vos tâches va changer. Ceux qui apprennent à piloter l'IA garderont la main.",
  forte:
    "Plusieurs de vos tâches principales sont déjà en partie faisables par une IA. Votre valeur se déplace vers le contrôle et le jugement. Voici comment vous y préparer.",
};

const PREPARATION_DETAIL = {
  a_construire: "Vous utilisez peu l'IA, ou sans cadre clair : tout est à construire, et c'est normal.",
  en_cours: "Vous avez commencé à utiliser l'IA : il reste à structurer votre façon de faire.",
  avancee: "Vous utilisez déjà l'IA dans un cadre clair : il s'agit maintenant de la fiabiliser.",
} as const;

/** Jauge en demi-cercle : se remplit une seule fois en 700 ms (image fixe si l'on demande moins d'animations). */
function Jauge({ score }: { score: number }) {
  const [anime, setAnime] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setAnime(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const longueur = Math.PI * 90; // demi-cercle de rayon 90
  return (
    <svg viewBox="0 0 220 124" className="w-full max-w-[19rem]" aria-hidden>
      <defs>
        <linearGradient id="jauge-degrade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#9fd1c9" />
          <stop offset="0.55" stopColor="#e9b872" />
          <stop offset="1" stopColor="#d9824f" />
        </linearGradient>
      </defs>
      <path d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="14" strokeLinecap="round" />
      <path
        d="M20 110 A90 90 0 0 1 200 110"
        fill="none"
        stroke="url(#jauge-degrade)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={longueur}
        strokeDashoffset={anime ? longueur * (1 - score / 100) : longueur}
        className="transition-[stroke-dashoffset] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
      />
    </svg>
  );
}

export function ResultatDiagnostic({
  metier,
  resultat,
  metierAutre,
  onRefaire,
  children,
}: {
  metier: MetierPublic;
  resultat: Resultat;
  metierAutre?: string;
  onRefaire: () => void;
  /** Suite de la page (capture de l'email, plan d'action). */
  children?: React.ReactNode;
}) {
  const tache = metier.taches.find((t) => t.id === resultat.tachePlusExposee)!;
  const titreRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => titreRef.current?.focus(), []);

  return (
    <div className="mx-auto w-full max-w-[44rem] pb-16">
      {/* 1. Le niveau et la jauge */}
      <section className="text-center">
        <p className="text-[0.9375rem] font-medium text-muted-foreground">
          Votre résultat · {metier.id === "autre" && metierAutre ? metierAutre : metier.libelle}
        </p>
        <div className="relative mx-auto mt-6 w-full max-w-[19rem] text-foreground">
          <Jauge score={resultat.score} />
          <p className="absolute inset-x-0 bottom-0 font-display text-[2.5rem] leading-none font-semibold tracking-[-0.04em] tabular-nums">
            {resultat.score}
            <span className="text-[1.125rem] font-medium text-muted-foreground">/100</span>
          </p>
        </div>
        <h1 ref={titreRef} tabIndex={-1} className="mt-5 font-display text-[clamp(2.25rem,1.5rem+3vw,3.5rem)] leading-[1] font-semibold tracking-[-0.04em] outline-none">
          {LIBELLE_EXPOSITION[resultat.niveau]}
        </h1>
        <p className="mt-2 type-small text-muted-foreground">Score indicatif : {resultat.score}/100. Estimation à partir de vos réponses.</p>

        {/* 2. La phrase */}
        <p className="mx-auto mt-8 max-w-[36rem] font-display text-[clamp(1.25rem,1.05rem+0.8vw,1.625rem)] leading-[1.3] font-medium tracking-[-0.02em]">
          {PHRASES[resultat.niveau]}
        </p>
      </section>

      <div className="mt-12 grid gap-4">
        {/* 3. La tâche la plus exposée, détail flouté */}
        <section className="rounded-[24px] border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="type-small text-muted-foreground">Votre tâche la plus exposée</p>
              <h2 className="mt-1 font-display text-[1.5rem] leading-[1.2] font-semibold tracking-[-0.025em]">{tache.libelle}</h2>
            </div>
            <span className="rounded-full bg-[oklch(0.94_0.05_70)] px-3 py-1.5 text-[0.875rem] font-semibold text-[oklch(0.42_0.1_55)] tabular-nums">
              Exposition {tache.exposition}/5
            </span>
          </div>
          <div className="relative mt-6 overflow-hidden rounded-[16px] bg-muted/60 p-5">
            {/* Aperçu factice : le vrai texte n'est envoyé qu'après la saisie de l'email. */}
            <div aria-hidden className="space-y-3 blur-[5px] select-none">
              {[
                ["Ce que l'IA sait déjà faire", "w-[92%]"],
                ["Ce qui reste sous votre responsabilité", "w-[78%]"],
                ["L'action à tester cette semaine", "w-[85%]"],
              ].map(([label, w]) => (
                <div key={label}>
                  <p className="type-small font-semibold">{label}</p>
                  <div className={cn("mt-1.5 h-3 rounded-full bg-foreground/25", w)} />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 grid place-items-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2 type-small font-medium shadow-sm">
                <LockIcon className="size-3.5" aria-hidden /> Dans votre plan d&apos;action
              </span>
            </div>
          </div>
          <p className="mt-4 type-small text-muted-foreground">
            Dans votre plan : ce que l&apos;IA sait déjà faire sur cette tâche, ce qui reste sous votre responsabilité, et l&apos;action à tester cette semaine.
          </p>
        </section>

        {/* 4. La préparation */}
        <section className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[24px] border border-border bg-card px-6 py-5 sm:px-8">
          <p className="type-small text-muted-foreground">Votre préparation</p>
          <p className="font-display text-[1.25rem] font-semibold tracking-[-0.02em]">{LIBELLE_PREPARATION[resultat.preparation]}</p>
          <p className="w-full type-small text-foreground/70">{PREPARATION_DETAIL[resultat.preparation]}</p>
        </section>
      </div>

      {children}

      <p className="mt-10 text-center">
        <button type="button" onClick={onRefaire} className="link-quiet type-small">
          Refaire le diagnostic
        </button>
      </p>
    </div>
  );
}
