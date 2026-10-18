"use client";

import * as React from "react";
import Link from "next/link";
import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { stepMinutes } from "@/components/platform/module-progress";
import type { StepLink } from "./lesson-reader";

export interface PrimaryAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Cadre commun à toutes les étapes : une croix pour quitter, une barre de progression fine,
 * le contenu centré, l'action principale en bas à droite. Un lien « Précédent » discret, à gauche,
 * permet de revenir en arrière ; les flèches du clavier font de même.
 */
export function ReaderFrame({
  exitHref,
  progress,
  onBack,
  onNext,
  primary,
  wide = false,
  footerStart,
  children,
}: {
  exitHref: string;
  /** De 0 à 100. */
  progress: number;
  onBack?: () => void;
  onNext?: () => void;
  primary: PrimaryAction | null;
  /** Contenu plus large (tableaux d'un exercice). */
  wide?: boolean;
  /** Remplace le lien « Précédent » (par exemple : une note en cours). */
  footerStart?: React.ReactNode;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [role=radiogroup], [contenteditable]")) return;
      if (e.key === "ArrowRight" && onNext) onNext();
      if (e.key === "ArrowLeft" && onBack) onBack();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack, onNext]);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background print:hidden">
        <div className="flex h-14 items-center px-3 sm:px-5">
          <Link
            href={exitHref}
            aria-label="Quitter l'étape"
            title="Quitter l'étape"
            className="grid size-10 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-5" />
          </Link>
        </div>
        <div
          role="progressbar"
          aria-label="Avancement dans l'étape"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="h-1 bg-muted"
        >
          <div className="h-full bg-brand" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="flex-1 px-5 py-12 sm:py-16">
        <div className={cn("mx-auto", wide ? "max-w-3xl" : "max-w-[66ch]")}>{children}</div>
      </main>

      <footer className="sticky bottom-0 border-t bg-background print:hidden">
        <div className={cn("mx-auto flex items-center justify-between gap-4 px-5 py-3", wide ? "max-w-3xl" : "max-w-[66ch]")}>
          <div className="min-w-0">
            {footerStart ??
              (onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="min-h-10 rounded-md px-1 text-sm text-subtle-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Précédent
                </button>
              ))}
          </div>
          {primary && (
            <button
              type="button"
              onClick={primary.onClick}
              disabled={primary.disabled}
              className="min-h-12 shrink-0 rounded-md bg-brand px-6 text-base font-medium text-brand-foreground transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {primary.label}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

/** Écran de fin d'étape : une coche, « Étape terminée », ce qui a été appris, l'étape suivante. */
export function StepComplete({
  learned,
  sourcesHtml,
  next,
}: {
  learned: React.ReactNode;
  sourcesHtml?: string | null;
  next: StepLink | null;
}) {
  const minutes = stepMinutes(next?.duration);
  return (
    <section aria-labelledby="etape-terminee" className="space-y-8 py-4">
      <span className="grid size-14 place-items-center rounded-full bg-brand text-brand-foreground">
        <CheckIcon className="size-7" strokeWidth={2.5} aria-hidden />
      </span>
      <div className="space-y-4">
        <h1 id="etape-terminee" className="text-title">
          Étape terminée
        </h1>
        <div className="text-lead text-muted-foreground">{learned}</div>
      </div>
      {sourcesHtml && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-subtle-foreground underline underline-offset-4 hover:text-foreground">
            Sources
          </summary>
          <div className="prose-lesson prose-sources mt-3" dangerouslySetInnerHTML={{ __html: sourcesHtml }} />
        </details>
      )}
      {next && (
        <div className="border-t pt-6">
          <p className="text-sm text-muted-foreground">Étape suivante</p>
          <p className="mt-1 text-lg font-medium">
            {next.title}
            {minutes && <span className="ml-3 text-base font-normal text-muted-foreground tabular-nums">{minutes}</span>}
          </p>
        </div>
      )}
    </section>
  );
}
