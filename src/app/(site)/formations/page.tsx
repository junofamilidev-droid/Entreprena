import type { Metadata } from "next";
import { FormationCard } from "@/components/site/formation-card";
import { listFormations } from "@/lib/content/source";
import { accueil } from "@/lib/vitrine/textes";
import { METIERS_A_VENIR } from "@/lib/vitrine/metiers";
import { SectionMetiers } from "@/components/site/section-metiers";

export const metadata: Metadata = {
  title: "Les formations",
  description: "Toutes les formations par métier : une mission réelle, un outil d'expert installé dans Claude, appliqué à vos dossiers.",
};

export default async function CataloguePage() {
  const formations = await listFormations();
  const published = new Set(formations.map((f) => f.domain.toLowerCase()));
  const upcoming = METIERS_A_VENIR.filter((m) => !published.has(m.nom.toLowerCase()));
  return (
    <>
    <div className="site-container pt-12 sm:pt-20">
      <h1 className="type-display">{accueil.formations.title}</h1>
      <p className="mt-6 max-w-[var(--text-max)] type-lead text-muted-foreground">{accueil.formations.intro}</p>
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {formations.map((f) => (
          <FormationCard key={f.id} formation={f} available />
        ))}
      </div>
    </div>
    <div className="pb-[var(--section-space)]">
      <div className="site-container mt-24">
        <SectionMetiers title="Tous les métiers" intro="Les formations disponibles, et celles en préparation." formations={formations} upcoming={upcoming} />
      </div>
    </div>
    </>
  );
}
