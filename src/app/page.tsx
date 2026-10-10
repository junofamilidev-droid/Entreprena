import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  ClipboardCheckIcon,
  CompassIcon,
  FileCheck2Icon,
  LockIcon,
  QuoteIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { FormationCard } from "@/components/formation/formation-card";
import { listFormations } from "@/lib/content/source";
import type { FormationWithModules } from "@/lib/content/types";


const method = [
  {
    icon: CompassIcon,
    title: "Un diagnostic",
    text: "Quelques questions sur votre travail. Vous obtenez une estimation de votre exposition à l'IA et le bon point d'entrée.",
  },
  {
    icon: BookOpenTextIcon,
    title: "Des leçons courtes",
    text: "Une idée par écran, et des questions de vérification pour s'assurer que c'est acquis.",
  },
  {
    icon: ClipboardCheckIcon,
    title: "Un exercice guidé",
    text: "Une vraie tâche du métier, sur un dossier fictif, étape par étape, avec l'assistant IA de votre choix.",
  },
  {
    icon: FileCheck2Icon,
    title: "Une auto-correction",
    text: "Une grille et un corrigé commenté. Vous gardez votre livrable, réutilisable sur vos dossiers.",
  },
];

const principles = [
  {
    icon: QuoteIcon,
    title: "Des sources, ou rien",
    text: "Chaque fait chiffré renvoie à sa source. Ce qui relève de notre opinion est signalé comme tel.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Aucune donnée réelle",
    text: "Les exercices portent sur des données fictives. Vous n'avez jamais à coller un dossier client.",
  },
  {
    icon: SparklesIcon,
    title: "Pas de fausse promesse",
    text: "Ni diplôme ni certification : une attestation sans valeur officielle, adossée à votre livrable.",
  },
];

// Illustration : aperçu d'un parcours en cours, construit à partir des vrais modules.
function JourneyPreview({ formation }: { formation: FormationWithModules }) {
  const modules = formation.modules.slice(0, 4);
  return (
    <Card aria-hidden className="gap-0 overflow-hidden p-0 shadow-lg shadow-brand/5">
      <div className="border-b px-6 py-5">
        <p className="text-kicker text-brand">{formation.domain}</p>
        <p className="mt-1 font-serif text-xl font-semibold">{formation.title}</p>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={38} className="h-1.5 bg-muted" />
          <span className="shrink-0 font-mono text-caption tabular-nums text-muted-foreground">38&nbsp;%</span>
        </div>
      </div>
      <ol className="divide-y">
        {modules.map((m, i) => (
          <li key={m.id} className="flex items-center gap-4 px-6 py-4">
            <span
              className={
                i === 0
                  ? "grid size-8 shrink-0 place-items-center rounded-full bg-brand font-mono text-sm text-brand-foreground"
                  : "grid size-8 shrink-0 place-items-center rounded-full border font-mono text-sm text-muted-foreground"
              }
            >
              {m.position}
            </span>
            <div className="min-w-0 flex-1">
              <p className={i === 0 ? "truncate text-sm font-medium" : "truncate text-sm text-muted-foreground"}>
                {m.title}
              </p>
              <p className="truncate text-caption text-muted-foreground">
                {i === 0 ? "En cours · reprise là où vous vous êtes arrêté" : "À venir"}
              </p>
            </div>
            {i === 0 ? (
              <ArrowRightIcon className="size-4 text-brand" />
            ) : (
              <LockIcon className="size-3.5 text-muted-foreground/60" />
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}

export default async function Home() {
  const formations = await listFormations();
  const featured = formations[0];
  const withDiagnostic = formations.find((f) => f.hasDiagnostic);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Promesse */}
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(55%_65%_at_75%_0%,var(--brand-soft),transparent)]"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-20 sm:px-6 md:pt-24 md:pb-28 lg:grid-cols-[1.15fr_1fr]">
            <FadeIn className="space-y-7">
              <Badge variant="outline" className="gap-2 bg-background px-3 py-1 text-caption font-normal">
                <span className="size-1.5 rounded-full bg-brand" aria-hidden />
                Formations pratiques · version de test
              </Badge>
              <h1 className="text-display text-balance">Votre métier change avec l&apos;IA. Gardez la main.</h1>
              <p className="max-w-xl text-lead text-muted-foreground">
                Des formations courtes, bâties sur les tâches réelles de votre profession. Vous
                pratiquez sur des dossiers fictifs, vous vérifiez ce que l&apos;IA produit, et vous
                repartez avec un livrable réutilisable.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="#formations">
                    Voir les formations <ArrowRightIcon />
                  </Link>
                </Button>
                {withDiagnostic && (
                  <Button asChild size="lg" variant="outline" className="bg-background">
                    <Link href={`/formations/${withDiagnostic.slug}/diagnostic`}>Faire mon diagnostic</Link>
                  </Button>
                )}
              </div>
            </FadeIn>
            {featured && (
              <FadeIn delay={0.1} className="mx-auto w-full max-w-md lg:max-w-none">
                <JourneyPreview formation={featured} />
              </FadeIn>
            )}
          </div>
        </section>

        {/* Catalogue */}
        <section id="formations" className="scroll-mt-28 border-t bg-muted/30">
          <div className="mx-auto max-w-6xl space-y-12 px-4 py-20 sm:px-6 md:py-28">
            <div className="max-w-2xl space-y-4">
              <p className="text-kicker text-brand">Catalogue</p>
              <h2 className="text-title">Une formation par métier</h2>
              <p className="text-lead text-muted-foreground">
                Chaque formation suit les tâches du métier, une par module, sur des cas concrets.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {formations.map((f, i) => (
                <FadeIn key={f.id} delay={i * 0.05} className="h-full [&>*]:h-full">
                  <FormationCard formation={f} />
                </FadeIn>
              ))}
              <Card className="justify-center gap-3 border-dashed bg-transparent px-6 shadow-none">
                <p className="text-kicker text-muted-foreground">Prochainement</p>
                <p className="font-serif text-xl font-semibold text-muted-foreground">
                  D&apos;autres métiers suivront
                </p>
                <p className="text-body text-muted-foreground">
                  Le catalogue s&apos;enrichira formation par formation, avec la même méthode.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Méthode */}
        <section id="methode" className="scroll-mt-28">
          <div className="mx-auto max-w-6xl space-y-14 px-4 py-20 sm:px-6 md:py-28">
            <div className="max-w-2xl space-y-4">
              <p className="text-kicker text-brand">La méthode</p>
              <h2 className="text-title">Pratiquer, vérifier, garder une trace</h2>
              <p className="text-lead text-muted-foreground">
                Le même déroulé dans chaque module, quel que soit le métier.
              </p>
            </div>
            <ol className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {method.map((m, i) => (
                <li key={m.title}>
                  <FadeIn delay={i * 0.06} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-lg bg-brand-soft text-brand">
                        <m.icon className="size-5" aria-hidden />
                      </span>
                      <span className="font-mono text-caption text-muted-foreground">0{i + 1}</span>
                    </div>
                    <h3 className="text-heading">{m.title}</h3>
                    <p className="text-body text-muted-foreground">{m.text}</p>
                  </FadeIn>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Engagements */}
        <section className="border-y bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:py-24 lg:grid-cols-[1fr_2fr]">
            <div className="space-y-4">
              <p className="text-kicker text-brand">Nos engagements</p>
              <h2 className="text-title text-balance">Des promesses tenables</h2>
            </div>
            <div className="grid gap-10 sm:grid-cols-3">
              {principles.map((p) => (
                <div key={p.title} className="space-y-3">
                  <p.icon className="size-5 text-brand" aria-hidden />
                  <h3 className="font-medium">{p.title}</h3>
                  <p className="text-body text-muted-foreground">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Appel final */}
        {withDiagnostic && (
          <section>
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-24 text-center sm:px-6 md:py-32">
              <h2 className="text-title text-balance">Par où commencer ?</h2>
              <p className="text-lead text-muted-foreground">
                Le diagnostic estime la part de votre temps passée sur des tâches qu&apos;une IA sait
                déjà commencer, et vous indique où entrer dans la formation.
              </p>
              <Button asChild size="lg">
                <Link href={`/formations/${withDiagnostic.slug}/diagnostic`}>
                  Faire mon diagnostic <ArrowRightIcon />
                </Link>
              </Button>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
