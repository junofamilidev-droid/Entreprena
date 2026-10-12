// Avancement fictif, affiché tant que les comptes apprenants ne sont pas branchés.
// Les titres viennent du contenu réel ; seuls l'état (fait, en cours) et la liste
// des formations suivies sont inventés. Ce fichier disparaîtra avec les comptes.
import type { FormationWithModules, StepKind } from "@/lib/content/types";
import course from "../../../content/auditeur-augmente/cours-module-1.json";

export interface DemoStep {
  slug: string;
  title: string;
  kind: StepKind;
  duration: string;
  state: "done" | "current" | "todo";
  objective?: string;
}

export interface Enrollment {
  formation: FormationWithModules;
  moduleSlug: string;
  steps: DemoStep[];
}

const sampleSteps: Record<string, DemoStep[]> = {
  "auditeur-augmente-ia/revue-analytique": [
    ...course.modules[0].lecons.map(
      (l, i): DemoStep => ({
        slug: `lecon-${i + 1}`,
        title: l.titre,
        kind: "lesson",
        duration: l.duree,
        objective: l.objectif,
        state: i === 0 ? "done" : i === 1 ? "current" : "todo",
      }),
    ),
    { slug: "exercice", title: "Exercice : Nordelia Distribution", kind: "exercise", duration: "60 min en 5 étapes", state: "todo" },
    { slug: "auto-correction", title: "Auto-correction", kind: "self_review", duration: "grille sur 20 et corrigé", state: "todo" },
    { slug: "fin", title: "Fin du module", kind: "module_end", duration: "attestation", state: "todo" },
  ],
};

/** Formations « suivies » par le compte de démonstration : la première formation publiée. */
export function demoEnrollments(formations: FormationWithModules[]): Enrollment[] {
  return formations.slice(0, 1).flatMap((formation) => {
    const open = formation.modules.find((m) => m.availability === "open");
    if (!open) return [];
    return [{ formation, moduleSlug: open.slug, steps: sampleSteps[`${formation.slug}/${open.slug}`] ?? [] }];
  });
}

export const demoLearner = { name: "Compte de démonstration", email: "demo@exemple.fr", initials: "CD" };
