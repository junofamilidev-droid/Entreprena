import type { Metadata } from "next";
import { PageHeader } from "@/components/platform/page-header";
import { CatalogueList } from "@/components/catalogue/catalogue-list";
import { listFormations } from "@/lib/content/source";

export const metadata: Metadata = { title: "Catalogue" };

export default async function CataloguePage() {
  const formations = await listFormations();
  return (
    <>
      <PageHeader crumbs={[{ label: "Ma formation", href: "/app" }, { label: "Catalogue" }]} />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 md:py-12">
        <header className="max-w-2xl space-y-3">
          <h1 className="text-title">Catalogue</h1>
          <p className="text-lead text-muted-foreground">
            Des formations pratiques pour les métiers que l&apos;IA transforme. De nouveaux métiers
            sont ajoutés au fil du temps.
          </p>
        </header>
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
