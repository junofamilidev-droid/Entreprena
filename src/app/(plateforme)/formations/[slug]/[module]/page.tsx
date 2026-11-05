import type { Metadata } from "next";
import { atLeastOne, PLACEHOLDER } from "@/lib/content/static-params";
import { WhereSaved } from "@/components/auth/where-saved";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/platform/page-header";
import { ResumePanel, StepList } from "@/components/platform/module-progress";
import { getFormation, getModule, listFormations, listSessions } from "@/lib/content/source";
import { moduleDuration } from "@/lib/content/durations";
import { SessionCta, SessionList } from "@/components/platform/session-list";
import { PageIntro, Soft } from "@/components/platform/kit";
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
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 md:py-8">
        {sessions.length > 0 && (
          <>
            <PageIntro
              eyebrow={
                <>
                  {formation.title} · module {mod.position}
                  {duration?.label ? ` · ${duration.label}` : ""}
                </>
              }
              title={mod.title}
            >
              <p>{mod.summary}</p>
              <SessionCta formation={formation.slug} module={mod.slug} sessions={sessions} className="mt-6" />
            </PageIntro>
            <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_17rem] lg:gap-12">
              <section aria-labelledby="sessions" className="min-w-0">
                <h2 id="sessions" className="px-1 text-heading">
                  Les sessions
                </h2>
                <div className="mt-4">
                  <SessionList formation={formation.slug} module={mod.slug} sessions={sessions} />
                </div>
              </section>
              <aside className="space-y-4">
                <Soft className="p-6">
                  <h2 className="text-sm font-semibold">Votre livrable</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{mod.deliverable}</p>
                </Soft>
                <p className="px-2 text-caption text-muted-foreground">
                  <WhereSaved subject="Votre progression est" />
                </p>
              </aside>
            </div>
          </>
        )}
        {sessions.length > 0 && !hasSteps ? null : !ref || !hasSteps ? (
          <PageIntro eyebrow={`${formation.title} · module ${mod.position}`} title={mod.title}>
            <p>Ce module n&apos;est pas encore ouvert.</p>
          </PageIntro>
        ) : (
          <>
            <div className={sessions.length ? "mt-12" : undefined}>
              <ResumePanel refData={ref} headingLevel={sessions.length ? 2 : 1} />
            </div>
            <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_17rem] lg:gap-12">
              <section aria-labelledby="etapes" className="min-w-0">
                <div className="flex items-baseline justify-between gap-4 px-1">
                  <h2 id="etapes" className="text-heading">
                    Les étapes
                  </h2>
                  {!sessions.length && duration?.label && <span className="text-sm text-muted-foreground">{duration.label}</span>}
                </div>
                <div className="mt-4">
                  <StepList refData={ref} />
                </div>
              </section>
              <aside className="space-y-4">
                {!sessions.length && (
                  <>
                    <Soft className="p-6">
                      <h2 className="text-sm font-semibold">Le cas</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{mod.summary}</p>
                    </Soft>
                    <Soft className="p-6">
                      <h2 className="text-sm font-semibold">Votre livrable</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{mod.deliverable}</p>
                    </Soft>
                  </>
                )}
                <p className="px-2 text-caption text-muted-foreground">
                  <WhereSaved subject="Votre progression est" />
                </p>
              </aside>
            </div>
          </>
        )}
      </div>
    </>
  );
}
