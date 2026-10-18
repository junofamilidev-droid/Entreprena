import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/platform/page-header";
import { ModuleProgressBar, StepTrail } from "@/components/platform/module-progress";
import { getFormation, getModule, listFormations } from "@/lib/content/source";
import { moduleRef } from "@/lib/content/refs";

type Props = PageProps<"/formations/[slug]/[module]">;

// Les formations, modules et étapes publiés après la mise en ligne n'ont pas de page préparée à
// l'avance : elles sont rendues à la demande (puis mises en cache), sans bloquer la construction.
export const instant = false;

export async function generateStaticParams() {
  return (await listFormations()).flatMap((f) => f.modules.map((m) => ({ slug: f.slug, module: m.slug })));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, module } = await props.params;
  const mod = await getModule(slug, module);
  return mod ? { title: mod.title } : {};
}

export default async function ModulePage(props: Props) {
  const { slug, module } = await props.params;
  const formation = await getFormation(slug);
  const mod = formation?.modules.find((m) => m.slug === module);
  if (!formation || !mod) notFound();
  const ref = mod.availability === "open" ? await moduleRef(formation, mod.slug) : null;

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Ma formation", href: "/app" },
          { label: formation.title, href: `/formations/${formation.slug}` },
          { label: `Module ${mod.position}` },
        ]}
      />
      <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-8 sm:py-16">
        <Link href="/app" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" aria-hidden /> Ma formation
        </Link>
        <p className="mt-8 text-sm text-muted-foreground">
          Module {mod.position}
          {mod.durationLabel && <span className="ml-3">{mod.durationLabel}</span>}
        </p>
        <h1 className="mt-2 text-title text-balance">{mod.title}</h1>

        {!ref || ref.steps.length === 0 ? (
          <p className="mt-6 text-lead text-muted-foreground">Ce module n&apos;est pas encore ouvert.</p>
        ) : (
          <>
            <ModuleProgressBar refData={ref} className="mt-6" />
            <section aria-label="Étapes du module" className="mt-10">
              <StepTrail refData={ref} />
            </section>

            <section aria-labelledby="livrable" className="mt-14 border-t pt-8">
              <h2 id="livrable" className="text-base font-semibold">Votre livrable</h2>
              <p className="mt-2 text-body text-muted-foreground">{mod.deliverable}</p>
              <p className="mt-1 text-sm text-subtle-foreground">Il se remplit pendant l&apos;exercice.</p>
            </section>

            <section aria-labelledby="tuteur" className="mt-8 border-t pt-8">
              <h2 id="tuteur" className="text-base font-semibold">Tuteur IA</h2>
              <p className="mt-2 text-body text-muted-foreground">
                Un assistant externe pour obtenir un indice quand vous bloquez. Il ne donne pas les réponses.
                N&apos;y collez jamais de données réelles d&apos;un client.
              </p>
              {formation.tutorUrl ? (
                <a
                  href={formation.tutorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand underline underline-offset-4"
                >
                  Ouvrir le tuteur <ExternalLinkIcon className="size-3.5" aria-hidden />
                </a>
              ) : (
                <p className="mt-1 text-sm text-subtle-foreground">Le lien sera ajouté prochainement.</p>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
