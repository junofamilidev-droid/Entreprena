import type { Metadata } from "next";
import { listFormations } from "@/lib/content/source";
import { accueil } from "@/lib/vitrine/textes";
import { METIERS_A_VENIR, libelleMetier } from "@/lib/vitrine/metiers";
import { FormationsCarousel } from "@/components/site/formations-carousel";
import { FormationFeature } from "@/components/site/formation-feature";
import { FormationUpcoming } from "@/components/site/formation-upcoming";

export const metadata: Metadata = {
  title: "Les formations",
  description: "Toutes les formations par métier : une mission réelle, un outil d'expert installé dans Claude, appliqué à vos dossiers.",
};

export default async function CataloguePage() {
  const formations = await listFormations();
  const published = new Set(formations.map((f) => libelleMetier(f.domain).toLowerCase()));
  const upcoming = METIERS_A_VENIR.filter((m) => !published.has(m.nom.toLowerCase()));
  return (
    <>
    <div className="site-container pt-12 sm:pt-20">
      <h1 className="type-display">{accueil.formations.title}</h1>
      <p className="mt-6 max-w-[var(--text-max)] type-lead text-muted-foreground">{accueil.formations.intro}</p>
    </div>
    <div className="pb-[var(--section-space)]">
      <div className="mt-6">
        <FormationsCarousel
          labels={[...formations.map((f) => libelleMetier(f.domain)), ...upcoming.map((m) => m.nom)]}
          slides={[
            ...formations.map((f) => <FormationFeature key={f.id} formation={f} />),
            ...upcoming.map((m, i) => <FormationUpcoming key={m.nom} metier={m} index={i} />),
          ]}
        />
      </div>
    </div>
    </>
  );
}
