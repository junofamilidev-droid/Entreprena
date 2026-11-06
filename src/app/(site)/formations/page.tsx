import type { Metadata } from "next";
import { FormationCard } from "@/components/site/formation-card";
import { listFormations } from "@/lib/content/source";
import { accueil } from "@/lib/vitrine/textes";

export const metadata: Metadata = {
  title: "Les formations",
  description: "Toutes les formations par métier : une mission réelle, un outil d'expert installé dans Claude, appliqué à vos dossiers.",
};

export default async function CataloguePage() {
  const formations = await listFormations();
  return (
    <div className="site-container pt-12 pb-[var(--section-space)] sm:pt-20">
      <h1 className="type-display">{accueil.formations.title}</h1>
      <p className="mt-6 max-w-[var(--text-max)] type-lead text-muted-foreground">{accueil.formations.intro}</p>
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {formations.map((f) => (
          <FormationCard key={f.id} formation={f} available />
        ))}
      </div>
    </div>
  );
}
