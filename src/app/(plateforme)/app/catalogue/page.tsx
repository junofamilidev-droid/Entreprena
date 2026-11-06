import type { Metadata } from "next";
import { PageHeader } from "@/components/platform/page-header";
import { PageIntro } from "@/components/platform/kit";
import { CatalogueList } from "@/components/catalogue/catalogue-list";
import { listFormations } from "@/lib/content/source";

export const metadata: Metadata = { title: "Catalogue" };

export default async function CataloguePage() {
  const formations = await listFormations();
  return (
    <>
      <PageHeader crumbs={[{ label: "Accueil", href: "/app" }, { label: "Catalogue" }]} />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 md:py-8">
        <PageIntro eyebrow="Toutes les formations" title="Catalogue">
          <p>Des formations pratiques pour les métiers que l&apos;IA transforme. De nouveaux métiers sont ajoutés au fil du temps.</p>
        </PageIntro>
        <div className="mt-10">
          {formations.length > 0 ? (
            <CatalogueList formations={formations} />
          ) : (
            <p className="text-body text-muted-foreground">Aucune formation n&apos;est encore publiée.</p>
          )}
        </div>
      </div>
    </>
  );
}
