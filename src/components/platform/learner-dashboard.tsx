"use client";

import Link from "next/link";
import { WhereSaved } from "@/components/auth/where-saved";
import { ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { site } from "@/lib/site";
import { useProgress } from "@/lib/progress/store";
import type { FormationWithModules } from "@/lib/content/types";
import { moduleState, ResumePanel, StepList, type ModuleRef } from "./module-progress";

function AsideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 py-5 first:pt-0">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function LearnerDashboard({
  formations,
  refs,
}: {
  formations: FormationWithModules[];
  refs: ModuleRef[];
}) {
  const progress = useProgress();

  // Formations commencées, de la plus récemment ouverte à la plus ancienne.
  const started = refs
    .map((r) => ({ ref: r, st: moduleState(progress, r) }))
    .filter((x) => x.st.started)
    .sort((a, b) => b.st.lastActivity - a.st.lastActivity);
  const active = started[0]?.ref ?? refs[0];
  const formation = formations.find((f) => f.slug === active?.formationSlug);
  const startedSlugs = new Set(started.map((x) => x.ref.formationSlug));
  const others = formations.filter((f) => !startedSlugs.has(f.slug) && f.slug !== active?.formationSlug);

  if (!active || !formation) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-8">
        <h1 className="text-title">Choisissez une première formation</h1>
        <p className="mt-2 text-body text-muted-foreground">Le catalogue rassemble les formations ouvertes, métier par métier.</p>
        <Button asChild className="mt-6"><Link href="/catalogue">Voir le catalogue</Link></Button>
      </div>
    );
  }
  const mod = formation.modules.find((m) => m.slug === active.module.slug);
  const base = `/formations/${formation.slug}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 md:py-12">
      <ResumePanel refData={active} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_17rem] lg:gap-14">
        <section aria-labelledby="sommaire" className="min-w-0">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="sommaire" className="text-heading">Dans ce module</h2>
            {active.module.durationLabel && <span className="text-sm text-muted-foreground">{active.module.durationLabel}</span>}
          </div>
          <div className="mt-4">
            <StepList refData={active} />
          </div>
        </section>

        <aside className="divide-y">
          {formation.hasDiagnostic && (
            <AsideSection title="Diagnostic">
              <p className="text-sm text-muted-foreground">Il estime votre exposition à l&apos;IA et indique où commencer.</p>
              <Button asChild variant="outline" size="sm">
                <Link href={`${base}/diagnostic`}>Faire le diagnostic</Link>
              </Button>
            </AsideSection>
          )}
          {mod && (
            <AsideSection title="Votre livrable">
              <p className="text-sm text-muted-foreground">{mod.deliverable}</p>
              <p className="text-caption text-muted-foreground">Il se remplit pendant l&apos;exercice.</p>
            </AsideSection>
          )}
          <AsideSection title="Tuteur IA">
            <p className="text-sm text-muted-foreground">
              Un assistant externe pour obtenir un indice. Il ne donne pas les réponses. N&apos;y collez
              jamais de données confidentielles réelles.
            </p>
            {formation.tutorUrl ? (
              <Button asChild variant="outline" size="sm">
                <a href={formation.tutorUrl} target="_blank" rel="noopener noreferrer">
                  Ouvrir le tuteur <ExternalLinkIcon />
                </a>
              </Button>
            ) : (
              <p className="text-caption text-muted-foreground">Lien pas encore branché.</p>
            )}
          </AsideSection>
        </aside>
      </div>

      {started.length > 0 && (
        <section aria-labelledby="mes-formations" className="mt-12">
          <h2 id="mes-formations" className="text-heading">Mes formations</h2>
          <ul className="mt-4 divide-y border-y">
            {started.map(({ ref, st }) => {
              const pct = Math.round((st.doneCount / ref.steps.length) * 100);
              const f = formations.find((x) => x.slug === ref.formationSlug);
              return (
                <li key={ref.formationSlug}>
                  <Link
                    href={`/formations/${ref.formationSlug}/${ref.module.slug}`}
                    className="grid gap-x-6 gap-y-2 py-4 transition-colors hover:bg-muted/50 sm:grid-cols-[1fr_12rem] sm:items-center sm:px-2"
                  >
                    <span className="min-w-0">
                      <span className="block text-caption text-muted-foreground">{f?.domain}</span>
                      <span className="block font-medium">{ref.formationTitle}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Progress value={pct} className="h-1.5 bg-muted" aria-label={`Avancement : ${pct} %`} />
                      <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{pct}&nbsp;%</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="autres" className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="autres" className="text-heading">Autres formations</h2>
          <Link href="/catalogue" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            Voir le catalogue
          </Link>
        </div>
        {others.length > 0 ? (
          <ul className="mt-4 divide-y border-y">
            {others.slice(0, 4).map((f) => (
              <li key={f.id}>
                <Link href={`/formations/${f.slug}`} className="block py-4 transition-colors hover:bg-muted/50 sm:px-2">
                  <span className="block text-caption text-muted-foreground">{f.domain}</span>
                  <span className="block font-medium">{f.title}</span>
                  <span className="block text-sm text-muted-foreground">{f.promise}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-body text-muted-foreground">
            De nouvelles formations, pour d&apos;autres métiers, seront ajoutées au fil du temps.
          </p>
        )}
      </section>

      <Separator className="mt-14" />
      <div className="mt-6 max-w-3xl space-y-2 text-caption text-muted-foreground">
        <p>
          Version de test : <WhereSaved invite={false} /> Les contenus sont en cours de relecture par des
          professionnels.
        </p>
        <p>{site.certificateNotice}</p>
        <p>{site.emailNotice}</p>
      </div>
    </div>
  );
}
