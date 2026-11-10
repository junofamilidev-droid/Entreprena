import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormation, listFormations } from "@/lib/content/source";
import { plain } from "@/lib/vitrine/text";
import { METIERS_A_VENIR, metierAVenirParSlug } from "@/lib/vitrine/metiers";
import { PAGES_FORMATION } from "@/lib/vitrine/pages-formation";
import { PageFormationAVenir, PageFormationPubliee } from "@/components/site/formation-page";

// Une page par formation : les formations publiées, et les métiers dont la formation est en préparation.

export async function generateStaticParams() {
  const publiees = await listFormations();
  return [...publiees.map((f) => ({ slug: f.slug })), ...METIERS_A_VENIR.map((m) => ({ slug: m.slug }))];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const f = await getFormation(slug);
  if (f) return { title: f.title, description: `${plain(f.promise)} ${plain(f.summary)}`.slice(0, 160) };
  const m = metierAVenirParSlug(slug);
  if (m) return { title: `Formation ${m.nom} (en préparation)`, description: m.phrase };
  return {};
}

export default async function FormationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const formation = await getFormation(slug);
  const page = PAGES_FORMATION[slug];
  if (formation && page)
    return (
      // Le halo lumineux des fenêtres déborde un peu : coupé ici pour éviter tout défilement horizontal.
      <div className="overflow-x-clip">
        <PageFormationPubliee formation={formation} page={page} />
      </div>
    );
  const m = metierAVenirParSlug(slug);
  if (m)
    return (
      <div className="overflow-x-clip">
        <PageFormationAVenir metier={m} index={METIERS_A_VENIR.indexOf(m)} />
      </div>
    );
  notFound();
}
