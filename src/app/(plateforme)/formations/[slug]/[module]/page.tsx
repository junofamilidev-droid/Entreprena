import type { Metadata } from "next";
import { atLeastOne, PLACEHOLDER } from "@/lib/content/static-params";
import { WhereSaved } from "@/components/auth/where-saved";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/platform/page-header";
import { ResumePanel, StepList } from "@/components/platform/module-progress";
import { getFormation, getModule, listFormations, listSessions } from "@/lib/content/source";
import { moduleDuration } from "@/lib/content/durations";
import { SessionList } from "@/components/platform/session-list";
import { moduleRef } from "@/lib/content/refs";

type Props = PageProps<"/formations/[slug]/[module]">;

// Les formations, modules et étapes publiés après la mise en ligne n'ont pas de page préparée à
// l'avance : elles sont rendues à la demande (puis mises en cache), sans bloquer la construction.
export const instant = false;

export async function generateStaticParams() {
  return atLeastOne(
    (await listFormations()).flatMap((f) => f.modules.map((m) => ({ slug: f.slug, module: m.slug }))),
    { slug: PLACEHOLDER, module: PLACEHOLDER },
  );
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
  const open = mod.availability === "open";
  const [ref, sessions, duration] = open
    ? await Promise.all([moduleRef(formation, mod.slug), listSessions(formation.slug, mod.slug), moduleDuration(formation.slug, mod.slug)])
    : [null, [], null];
  const hasSteps = Boolean(ref && ref.steps.length);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Accueil", href: "/" },
          { label: formation.title, href: `/formations/${formation.slug}` },
          { label: `Module ${mod.position}` },
        ]}
      />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 md:py-12">
        {sessions.length > 0 && (
          <div className="mb-12 grid gap-10 lg:grid-cols-[1fr_17rem] lg:gap-14">
            <section aria-labelledby="sessions" className="min-w-0 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Module {mod.position}
                  {duration?.label ? ` · ${duration.label}` : ""}
                </p>
                <h1 id="sessions" className="text-title text-balance">
                  {mod.title}
                </h1>
              </div>
              <SessionList formation={formation.slug} module={mod.slug} sessions={sessions} />
            </section>
            <aside className="space-y-6">
              <section className="space-y-2">
                <h2 className="text-sm font-semibold">Le cas</h2>
                <p className="text-sm text-muted-foreground">{mod.summary}</p>
              </section>
              <section className="space-y-2 border-t pt-6">
                <h2 className="text-sm font-semibold">Votre livrable</h2>
                <p className="text-sm text-muted-foreground">{mod.deliverable}</p>
              </section>
            </aside>
          </div>
        )}
        {sessions.length > 0 && !hasSteps ? null : !ref || !hasSteps ? (
          <div className="max-w-2xl space-y-3">
            <p className="text-sm text-muted-foreground">Module {mod.position}</p>
            <h1 className="text-title">{mod.title}</h1>
            <p className="text-lead text-muted-foreground">Ce module n&apos;est pas encore ouvert.</p>
          </div>
        ) : (
          <>
            <ResumePanel refData={ref} headingLevel={sessions.length ? 2 : 1} />
            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_17rem] lg:gap-14">
              <section aria-labelledby="etapes" className="min-w-0">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 id="etapes" className="text-heading">Les étapes</h2>
                  {!sessions.length && duration?.label && <span className="text-sm text-muted-foreground">{duration.label}</span>}
                </div>
                <div className="mt-4">
                  <StepList refData={ref} />
                </div>
              </section>
              <aside className="space-y-6">
                {!sessions.length && (
                  <>
                    <section className="space-y-2">
                      <h2 className="text-sm font-semibold">Le cas</h2>
                      <p className="text-sm text-muted-foreground">{mod.summary}</p>
                    </section>
                    <section className="space-y-2 border-t pt-6">
                      <h2 className="text-sm font-semibold">Votre livrable</h2>
                      <p className="text-sm text-muted-foreground">{mod.deliverable}</p>
                    </section>
                  </>
                )}
                <section className={sessions.length ? "space-y-2" : "space-y-2 border-t pt-6"}>
                  <h2 className="text-sm font-semibold">Votre progression</h2>
                  <p className="text-sm text-muted-foreground">
                    <WhereSaved subject="Elle est" />
                  </p>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </>
  );
}
