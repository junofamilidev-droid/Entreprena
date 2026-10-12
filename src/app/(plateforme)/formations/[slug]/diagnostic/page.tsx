import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/platform/page-header";
import { DiagnosticRunner } from "@/components/diagnostic/diagnostic-runner";
import { getDiagnostic, getFormation, listFormations } from "@/lib/content/source";


// Les formations, modules et étapes publiés après la mise en ligne n'ont pas de page préparée à
// l'avance : elles sont rendues à la demande (puis mises en cache), sans bloquer la construction.
export const instant = false;

export async function generateStaticParams() {
  return (await listFormations()).filter((f) => f.hasDiagnostic).map((f) => ({ slug: f.slug }));
}

export async function generateMetadata(props: PageProps<"/formations/[slug]/diagnostic">): Promise<Metadata> {
  const { slug } = await props.params;
  const f = await getFormation(slug);
  return f ? { title: `Diagnostic · ${f.title}` } : {};
}

export default async function DiagnosticPage(props: PageProps<"/formations/[slug]/diagnostic">) {
  const { slug } = await props.params;
  const formation = await getFormation(slug);
  if (!formation) notFound();
  const diagnostic = await getDiagnostic(formation.slug);
  if (!diagnostic) notFound();
  const { config } = diagnostic;

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Tableau de bord", href: "/" },
          { label: formation.title, href: `/formations/${formation.slug}` },
          { label: config.title },
        ]}
      />
      <div className="mx-auto w-full max-w-2xl space-y-10 px-4 py-8 sm:px-8 md:py-12">
        <header className="space-y-3">
          <h1 className="text-title text-balance">Par où commencer ?</h1>
          <p className="text-lead text-muted-foreground">{config.intro}</p>
          <p className="text-caption text-muted-foreground">
            Environ {config.durationLabel}. Vos réponses restent sur cet appareil : rien n&apos;est envoyé.
          </p>
        </header>
        <DiagnosticRunner
          formationSlug={formation.slug}
          formationTitle={formation.title}
          config={config}
          modules={formation.modules.map(({ position, title, slug, availability }) => ({ position, title, slug, availability }))}
        />
      </div>
    </>
  );
}
