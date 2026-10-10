import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { DiagnosticRunner } from "@/components/diagnostic/diagnostic-runner";
import { getDiagnostic, getFormation, listFormations } from "@/lib/content/source";


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
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl space-y-10 px-4 pt-8 pb-24 sm:px-6">
          <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
            <Link href={`/formations/${formation.slug}`}>
              <ArrowLeftIcon /> {formation.title}
            </Link>
          </Button>
          <header className="space-y-4">
            <p className="text-kicker text-brand">
              {config.title} · {config.durationLabel}
            </p>
            <h1 className="text-title text-balance">Par où commencer ?</h1>
            <p className="text-lead text-muted-foreground">{config.intro}</p>
            <p className="text-caption text-muted-foreground">
              Vos réponses restent sur cet appareil. Rien n&apos;est envoyé tant que vous n&apos;avez pas de compte.
            </p>
          </header>
          <DiagnosticRunner
            formationSlug={formation.slug}
            formationTitle={formation.title}
            config={config}
            modules={formation.modules.map(({ position, title, slug, availability }) => ({ position, title, slug, availability }))}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
