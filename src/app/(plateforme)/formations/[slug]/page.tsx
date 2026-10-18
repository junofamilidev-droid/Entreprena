import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/platform/page-header";
import { getFormation, listFormations } from "@/lib/content/source";
import { site } from "@/lib/site";

// Les formations, modules et étapes publiés après la mise en ligne n'ont pas de page préparée à
// l'avance : elles sont rendues à la demande (puis mises en cache), sans bloquer la construction.
export const instant = false;

export async function generateStaticParams() {
  return (await listFormations()).map((f) => ({ slug: f.slug }));
}

export async function generateMetadata(props: PageProps<"/formations/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const f = await getFormation(slug);
  return f ? { title: f.title, description: f.promise } : {};
}

export default async function FormationPage(props: PageProps<"/formations/[slug]">) {
  const { slug } = await props.params;
  const formation = await getFormation(slug);
  if (!formation) notFound();

  const base = `/formations/${formation.slug}`;
  const firstOpen = formation.modules.find((m) => m.availability === "open");

  return (
    <>
      <PageHeader crumbs={[{ label: "Accueil", href: "/" }, { label: formation.title }]} />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 md:py-12">
        <header className="max-w-3xl space-y-4">
          <p className="text-sm text-muted-foreground">
            {formation.domain}, pour les {formation.audience.toLowerCase()}
          </p>
          <h1 className="text-display text-balance">{formation.title}</h1>
          <p className="text-lead">
            {formation.promise} <span className="text-muted-foreground">{formation.summary}</span>
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {firstOpen && (
              <Button asChild size="lg">
                <Link href={`${base}/${firstOpen.slug}`}>Commencer le module {firstOpen.position}</Link>
              </Button>
            )}
            {formation.hasDiagnostic && (
              <Button asChild size="lg" variant="outline">
                <Link href={`${base}/diagnostic`}>Faire le diagnostic</Link>
              </Button>
            )}
          </div>
        </header>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_17rem] lg:gap-14">
          <div className="min-w-0 space-y-14">
            <section aria-labelledby="plan">
              <h2 id="plan" className="text-heading">Le plan</h2>
              <p className="mt-1 text-sm text-muted-foreground">Une tâche réelle par module, sur un dossier fictif.</p>
              <ol className="mt-5 divide-y border-y">
                {formation.modules.map((m) => {
                  const open = m.availability === "open";
                  return (
                    <li key={m.id} className="grid grid-cols-[2rem_1fr] gap-x-3 py-5 sm:px-2">
                      <span className={open ? "font-serif text-xl text-primary" : "font-serif text-xl text-muted-foreground"}>
                        {m.position}
                      </span>
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className={open ? "font-serif text-lg font-semibold" : "font-serif text-lg font-semibold text-muted-foreground"}>
                            {m.title}
                          </h3>
                          {open ? (
                            <Badge variant="outline" className="border-primary/30 text-primary">Ouvert en test</Badge>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                              <LockIcon className="size-3" aria-hidden /> À venir
                            </span>
                          )}
                        </div>
                        <p className="text-body text-muted-foreground">{m.summary}</p>
                        <p className="text-body">
                          <span className="font-medium">Vous repartez avec </span>
                          <span className="text-muted-foreground">
                            {m.deliverable.charAt(0).toLowerCase() + m.deliverable.slice(1)}
                          </span>
                        </p>
                        {open && (
                          <div className="flex flex-wrap items-center gap-4 pt-1">
                            <Button asChild size="sm">
                              <Link href={`${base}/${m.slug}`}>Ouvrir le module</Link>
                            </Button>
                            {m.durationLabel && <span className="text-caption text-muted-foreground">{m.durationLabel}</span>}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {formation.method.length > 0 && (
              <section aria-labelledby="routine">
                <h2 id="routine" className="text-heading">La routine, dans chaque module</h2>
                <ol className="mt-5 grid gap-x-10 gap-y-6 sm:grid-cols-2">
                  {formation.method.map((m, i) => (
                    <li key={m.title} className="grid grid-cols-[1.5rem_1fr] gap-x-2">
                      <span className="text-sm tabular-nums text-muted-foreground">{i + 1}.</span>
                      <div>
                        <h3 className="font-medium">{m.title}</h3>
                        <p className="mt-1 text-body text-muted-foreground">{m.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section aria-labelledby="public" className="grid gap-10 md:grid-cols-2">
              {formation.forWhom.length > 0 && (
                <div>
                  <h2 id="public" className="text-heading">Pour qui</h2>
                  <ul className="mt-4 space-y-3 text-body">
                    {formation.forWhom.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {formation.notThis.length > 0 && (
                <div>
                  <h2 className="text-heading">Ce que ce n&apos;est pas</h2>
                  <ul className="mt-4 space-y-3 text-body text-muted-foreground">
                    {formation.notThis.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold">Accès à toute la formation</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tous les modules et leurs exercices, au fil de leur ouverture.
              </p>
              <Button className="mt-4 w-full" disabled>
                <LockIcon /> Bientôt disponible
              </Button>
              <p className="mt-3 text-caption text-muted-foreground">
                Aucun paiement n&apos;est possible pendant la version de test. Le module{" "}
                {firstOpen?.position ?? 1} reste en accès libre.
              </p>
            </div>
            <p className="px-1 text-caption text-muted-foreground">{site.certificateNotice}</p>
          </aside>
        </div>

        <Separator className="mt-14" />
        <p className="mt-6 max-w-3xl text-caption text-muted-foreground">{site.emailNotice}</p>
      </div>
    </>
  );
}
