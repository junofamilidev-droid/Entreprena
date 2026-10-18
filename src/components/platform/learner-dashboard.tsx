"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress/store";
import type { FormationWithModules } from "@/lib/content/types";
import { moduleHref, moduleState, ModuleProgressBar, ResumeButton, type ModuleRef } from "./module-progress";

// « Ma formation » : une seule action au premier regard, reprendre l'étape en cours.
export function LearnerDashboard({ formations, refs }: { formations: FormationWithModules[]; refs: ModuleRef[] }) {
  const progress = useProgress();
  // La formation la plus récemment ouverte ; à défaut, la première du catalogue.
  const active =
    refs
      .map((r) => ({ ref: r, st: moduleState(progress, r) }))
      .filter((x) => x.st.started)
      .sort((a, b) => b.st.lastActivity - a.st.lastActivity)[0]?.ref ?? refs[0];
  const formation = formations.find((f) => f.slug === active?.formationSlug);

  if (!active || !formation) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-8 sm:py-24">
        <h1 className="text-display">Choisissez une formation</h1>
        <p className="mt-4 text-lead text-muted-foreground">Le catalogue rassemble les formations ouvertes, métier par métier.</p>
        <Link
          href="/catalogue"
          className="mt-10 inline-flex min-h-12 items-center rounded-md bg-brand px-6 text-base font-medium text-brand-foreground hover:bg-brand-hover"
        >
          Voir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-8 sm:py-24">
      <p className="text-sm text-muted-foreground">Formation</p>
      <h1 className="mt-2 text-display text-balance">{formation.title}</h1>
      <p className="mt-6 text-lead">
        <span className="text-muted-foreground">Module {active.module.position}</span>
        <span className="mx-2 text-border" aria-hidden>
          /
        </span>
        {active.module.title}
      </p>
      <ModuleProgressBar refData={active} className="mt-4" />
      <div className="mt-10">
        <ResumeButton refData={active} />
      </div>
      <p className="mt-8">
        <Link href={moduleHref(active)} className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
          Voir toutes les étapes du module
        </Link>
      </p>
    </div>
  );
}
