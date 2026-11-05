import type { Metadata } from "next";
import { atLeastOne, PLACEHOLDER } from "@/lib/content/static-params";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/platform/page-header";
import { PageIntro, Soft, StatusLabel } from "@/components/platform/kit";
import { getFormation, listFormations } from "@/lib/content/source";
import { durationText, formationDurations } from "@/lib/content/durations";
import { Marked, unmark } from "@/components/ui/marked";
import { site } from "@/lib/site";

// Les formations, modules et étapes publiés après la mise en ligne n'ont pas de page préparée à
// l'avance : elles sont rendues à la demande (puis mises en cache), sans bloquer la construction.
export const instant = false;

export async function generateStaticParams() {
  return atLeastOne((await listFormations()).map((f) => ({ slug: f.slug })), { slug: PLACEHOLDER });
}

export async function generateMetadata(props: PageProps<"/formations/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const f = await getFormation(slug);
  return f ? { title: f.title, description: unmark(f.promise) } : {};
}

export default async function FormationPage(props: PageProps<"/formations/[slug]">) {
  const { slug } = await props.params;
  const formation = await getFormation(slug);
  if (!formation) notFound();

  const base = `/formations/${formation.slug}`;
  const firstOpen = formation.modules.find((m) => m.availability === "open");
  // Durées calculées depuis le contenu publié (sessions, ou étapes à défaut).
  const durations = await formationDurations(formation);
  const openMinutes = Object.values(durations).reduce((t, d) => t + d.minutes, 0);

  return (
    <>
      <PageHeader crumbs={[{ label: "Accueil", href: "/" }, { label: formation.title }]} />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 md:py-8">
        <PageIntro
          eyebrow={
            <>
              {formation.domain}, pour les {formation.audience.toLowerCase()} · {formation.modules.length} modules
              {openMinutes > 0 && ` · ${durationText(openMinutes)} ouverts aujourd'hui`}
            </>
          }
          title={formation.title}
        >
          <p>
            <Marked text={`${formation.promise} ${formation.summary}`} />
          </p>
          {firstOpen && (
            <Button asChild size="lg" className="mt-6 px-6">
              <Link href={`${base}/${firstOpen.slug}`}>
                Commencer le module {firstOpen.position} <ArrowRightIcon />
              </Link>
            </Button>
          )}
        </PageIntro>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_17rem] lg:gap-12">
          <section aria-labelledby="plan" className="min-w-0">
            <h2 id="plan" className="px-1 text-heading">
              Le plan
            </h2>
            <p className="mt-1 px-1 text-sm text-muted-foreground">Une tâche réelle par module, sur un dossier fictif.</p>
            <ol className="mt-5 space-y-2">
              {formation.modules.map((m) => {
                const open = m.availability === "open";
                return (
                  <li key={m.id} className={open ? "rounded-3xl bg-accent/50 p-5 sm:p-6" : "rounded-3xl p-5 sm:p-6"}>
                    <div className="flex gap-4">
                      <span
                        className={
                          open
                            ? "grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground tabular-nums"
                            : "grid size-9 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-sm font-semibold text-muted-foreground tabular-nums"
                        }
                      >
                        {m.position}
                      </span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                          <h3 className={open ? "text-lg font-semibold" : "text-lg font-semibold text-muted-foreground"}>{m.title}</h3>
                          {open ? (
                            <StatusLabel tone="active">Ouvert en test</StatusLabel>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                              <LockIcon className="size-3.5" aria-hidden /> À venir
                            </span>
                          )}
                        </div>
                        <p className="text-body text-muted-foreground">{m.summary}</p>
                        <p className="text-body">
                          <span className="font-medium">Vous repartez avec </span>
                          <span className="text-muted-foreground">{m.deliverable.charAt(0).toLowerCase() + m.deliverable.slice(1)}</span>
                        </p>
                        {open && (
                          <div className="flex flex-wrap items-center gap-4 pt-2">
                            <Button asChild>
                              <Link href={`${base}/${m.slug}`}>
                                Ouvrir le module <ArrowRightIcon />
                              </Link>
                            </Button>
                            {(durations[m.slug]?.label ?? m.durationLabel) && (
                              <span className="text-sm text-muted-foreground">{durations[m.slug]?.label ?? m.durationLabel}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Soft className="p-6">
              <h2 className="font-semibold">Accès à toute la formation</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tous les modules et leurs exercices, au fil de leur ouverture.</p>
              <Button className="mt-4 w-full" disabled>
                <LockIcon /> Bientôt disponible
              </Button>
              <p className="mt-3 text-caption text-muted-foreground">
                Aucun paiement n&apos;est possible pendant la version de test. Le module {firstOpen?.position ?? 1} reste en accès libre.
              </p>
            </Soft>
            <p className="px-2 text-caption text-muted-foreground">{site.certificateNotice}</p>
          </aside>
        </div>

        <p className="mt-14 max-w-3xl px-1 text-caption text-muted-foreground">{site.emailNotice}</p>
      </div>
    </>
  );
}
