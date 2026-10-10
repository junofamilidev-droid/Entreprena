import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  CompassIcon,
  ExternalLinkIcon,
  FileTextIcon,
  InfoIcon,
  LockIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { getFormation, listFormations } from "@/lib/content/source";


export async function generateStaticParams() {
  return (await listFormations()).map((f) => ({ slug: f.slug }));
}

export async function generateMetadata(props: PageProps<"/formations/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const f = await getFormation(slug);
  return f ? { title: f.title, description: f.promise } : {};
}

function SectionTitle({ kicker, title, id }: { kicker: string; title: string; id: string }) {
  return (
    <div className="space-y-3">
      <p className="text-kicker text-brand">{kicker}</p>
      <h2 id={id} className="text-title">{title}</h2>
    </div>
  );
}

export default async function FormationPage(props: PageProps<"/formations/[slug]">) {
  const { slug } = await props.params;
  const formation = await getFormation(slug);
  if (!formation) notFound();

  const firstOpen = formation.modules.find((m) => m.availability === "open");
  const diagnosticHref = `/formations/${formation.slug}/diagnostic`;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* En-tête */}
        <section className="relative isolate border-b">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_85%_0%,var(--brand-soft),transparent)]"
          />
          <div className="mx-auto max-w-6xl space-y-8 px-4 pt-8 pb-16 sm:px-6 md:pb-20">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link href="/">Accueil</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link href="/#formations">Formations</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{formation.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <FadeIn className="max-w-3xl space-y-6 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{formation.domain}</Badge>
                <Badge variant="outline" className="bg-background">{formation.audience}</Badge>
              </div>
              <h1 className="text-display text-balance">{formation.title}</h1>
              <p className="text-lead">
                <span className="font-medium">{formation.promise}</span>{" "}
                <span className="text-muted-foreground">{formation.summary}</span>
              </p>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                {formation.hasDiagnostic && (
                  <Button asChild size="lg">
                    <Link href={diagnosticHref}>
                      <CompassIcon /> Faire mon diagnostic
                    </Link>
                  </Button>
                )}
                {firstOpen && (
                  <Button asChild size="lg" variant="outline" className="bg-background">
                    <Link href={`/formations/${formation.slug}/${firstOpen.slug}`}>
                      Commencer le module {firstOpen.position} <ArrowRightIcon />
                    </Link>
                  </Button>
                )}
              </div>
            </FadeIn>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-16 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1fr_20rem] lg:gap-20">
          <div className="min-w-0 space-y-20">
            {/* Méthode */}
            {formation.method.length > 0 && (
              <section aria-labelledby="methode" className="space-y-10">
                <SectionTitle kicker="La méthode" title="La même routine dans chaque module" id="methode" />
                <ol className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
                  {formation.method.map((m, i) => (
                    <li key={m.title} className="space-y-2 bg-card p-6">
                      <span className="font-mono text-caption text-brand">0{i + 1}</span>
                      <h3 className="text-heading">{m.title}</h3>
                      <p className="text-body text-muted-foreground">{m.text}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Plan */}
            <section aria-labelledby="plan" className="space-y-10">
              <SectionTitle
                kicker="Le plan"
                title={`${formation.modules.length} modules, une tâche réelle par module`}
                id="plan"
              />
              <ol className="space-y-4">
                {formation.modules.map((m) => {
                  const open = m.availability === "open";
                  return (
                    <li key={m.id}>
                      <Card className={open ? "gap-4 border-brand/30 shadow-sm" : "gap-4 bg-muted/30 shadow-none"}>
                        <CardHeader className="grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1">
                          <span
                            className={
                              open
                                ? "row-span-2 grid size-9 place-items-center rounded-full bg-brand font-mono text-sm text-brand-foreground"
                                : "row-span-2 grid size-9 place-items-center rounded-full border bg-background font-mono text-sm text-muted-foreground"
                            }
                          >
                            {m.position}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <CardTitle className="font-serif text-lg">{m.title}</CardTitle>
                            {open ? (
                              <Badge variant="outline" className="border-brand/25 bg-brand-soft text-accent-foreground">Ouvert en test</Badge>
                            ) : (
                              <Badge variant="secondary">À venir</Badge>
                            )}
                          </div>
                          <CardDescription className="text-body">{m.summary}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 sm:pl-[4.75rem]">
                          <p className="flex gap-2 text-body">
                            <FileTextIcon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
                            <span>
                              <span className="font-medium">Vous repartez avec : </span>
                              <span className="text-muted-foreground">{m.deliverable}</span>
                            </span>
                          </p>
                          {open && (
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                              <Button asChild>
                                <Link href={`/formations/${formation.slug}/${m.slug}`}>
                                  Commencer le module <ArrowRightIcon />
                                </Link>
                              </Button>
                              {m.durationLabel && (
                                <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
                                  <ClockIcon className="size-3.5" aria-hidden /> {m.durationLabel}
                                </span>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* Pour qui / ce que ce n'est pas */}
            <section aria-labelledby="public" className="grid gap-12 md:grid-cols-2">
              {formation.forWhom.length > 0 && (
                <div className="space-y-6">
                  <h2 id="public" className="text-heading">Pour qui</h2>
                  <ul className="space-y-4">
                    {formation.forWhom.map((t) => (
                      <li key={t} className="flex gap-3 text-body">
                        <CheckIcon className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {formation.notThis.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-heading">Ce que ce n&apos;est pas</h2>
                  <ul className="space-y-4">
                    {formation.notThis.map((t) => (
                      <li key={t} className="flex gap-3 text-body text-muted-foreground">
                        <InfoIcon className="mt-1 size-4 shrink-0" aria-hidden />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Diagnostic */}
            {formation.hasDiagnostic && (
              <section aria-labelledby="commencer" className="rounded-2xl bg-brand px-6 py-12 text-brand-foreground sm:px-12">
                <div className="max-w-xl space-y-5">
                  <h2 id="commencer" className="text-title">Par où commencer ?</h2>
                  <p className="text-lead opacity-85">
                    Le diagnostic estime votre exposition à l&apos;IA, tâche par tâche, et vous
                    indique le bon point d&apos;entrée. Le score est une estimation.
                  </p>
                  <Button asChild size="lg" variant="secondary">
                    <Link href={diagnosticHref}>
                      Faire mon diagnostic <ArrowRightIcon />
                    </Link>
                  </Button>
                </div>
              </section>
            )}
          </div>

          {/* Colonne latérale */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <Card className="gap-5">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Accès complet</CardTitle>
                <CardDescription>
                  Tous les modules, les exercices et les attestations, dès leur ouverture.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Button size="lg" className="w-full" disabled>
                  <LockIcon /> Bientôt disponible
                </Button>
                <p className="text-caption text-muted-foreground">
                  {formation.presale.label} : aucun paiement n&apos;est possible dans cette version de
                  test. Le module {firstOpen?.position ?? 1} reste en accès libre.
                </p>
                <Separator />
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Modules</dt>
                    <dd className="font-medium">{formation.modules.length}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Ouverts en test</dt>
                    <dd className="font-medium">
                      {formation.modules.filter((m) => m.availability === "open").length}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Public</dt>
                    <dd className="text-right font-medium">{formation.audience}</dd>
                  </div>
                </dl>
                {formation.tutorUrl && (
                  <>
                    <Separator />
                    <Button asChild variant="outline" className="w-full">
                      <a href={formation.tutorUrl} target="_blank" rel="noopener noreferrer">
                        Ouvrir le tuteur IA <ExternalLinkIcon />
                      </a>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
