import Link from "next/link";
import { CheckIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import type { FormationWithModules, StepKind } from "@/lib/content/types";
import type { DemoStep, Enrollment } from "@/lib/demo/progress";

const kindLabel: Record<StepKind, string> = {
  lesson: "Leçon",
  quiz: "Questions",
  exercise: "Exercice guidé",
  self_review: "Auto-correction",
  module_end: "Fin du module",
};

// Ligne de pointage : une case par étape du module, cochée quand elle est faite.
function TickLine({ steps }: { steps: DemoStep[] }) {
  return (
    <ol className="flex gap-1.5" aria-label="Étapes du module">
      {steps.map((s, i) => (
        <li
          key={s.slug}
          title={s.title}
          className={cn(
            "grid h-7 flex-1 place-items-center rounded-[5px] border text-xs",
            s.state === "done" && "border-primary bg-primary text-primary-foreground",
            s.state === "current" && "border-primary text-primary ring-2 ring-primary/20",
            s.state === "todo" && "border-dashed text-muted-foreground",
          )}
        >
          {s.state === "done" ? <CheckIcon className="size-3.5" strokeWidth={3} aria-label="fait" /> : i + 1}
        </li>
      ))}
    </ol>
  );
}

function AsideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 py-5 first:pt-0">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function progressOf(e: Enrollment) {
  const done = e.steps.filter((s) => s.state === "done").length;
  return e.steps.length ? Math.round((done / e.steps.length) * 100) : 0;
}

export function LearnerDashboard({
  enrollments,
  others,
}: {
  enrollments: Enrollment[];
  others: FormationWithModules[];
}) {
  const active = enrollments[0];
  if (!active) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-8">
        <h1 className="text-title">Choisissez une première formation</h1>
        <p className="mt-2 text-body text-muted-foreground">Le catalogue rassemble les formations ouvertes, métier par métier.</p>
        <Button asChild className="mt-6"><Link href="/catalogue">Voir le catalogue</Link></Button>
      </div>
    );
  }
  const { formation, steps } = active;
  const mod = formation.modules.find((m) => m.slug === active.moduleSlug);
  const base = `/formations/${formation.slug}`;
  const current = steps.find((s) => s.state === "current") ?? steps[0];
  const done = steps.filter((s) => s.state === "done").length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 md:py-12">
      {mod && current && (
        <section aria-labelledby="reprendre" className="rounded-xl border bg-card p-6 sm:p-8">
          <p className="text-sm text-muted-foreground">
            {formation.title}, module {mod.position} : {mod.title}
          </p>
          <h1 id="reprendre" className="mt-3 text-title text-balance">
            {current.title}
          </h1>
          {current.objective && (
            <p className="mt-3 max-w-[62ch] text-lead text-muted-foreground">{current.objective}</p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button asChild size="lg">
              <Link href={`${base}/${mod.slug}?etape=${current.slug}`}>Reprendre la leçon</Link>
            </Button>
            <span className="text-sm text-muted-foreground">{current.duration}</span>
          </div>
          <div className="mt-8 space-y-2">
            <TickLine steps={steps} />
            <p className="text-caption text-muted-foreground">
              {done} étape{done > 1 ? "s" : ""} faite{done > 1 ? "s" : ""} sur {steps.length}
            </p>
          </div>
        </section>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_17rem] lg:gap-14">
        {mod && (
          <section aria-labelledby="sommaire" className="min-w-0">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="sommaire" className="text-heading">Dans ce module</h2>
              {mod.durationLabel && <span className="text-sm text-muted-foreground">{mod.durationLabel}</span>}
            </div>
            <ol className="mt-4 divide-y border-y">
              {steps.map((s, i) => (
                <li key={s.slug}>
                  <Link
                    href={`${base}/${mod.slug}?etape=${s.slug}`}
                    className={cn(
                      "grid grid-cols-[1.75rem_1fr_auto] items-baseline gap-x-3 py-3.5 outline-offset-2 transition-colors hover:bg-muted/50 sm:px-2",
                      s.state === "current" && "bg-accent/50 hover:bg-accent/70",
                    )}
                  >
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {s.state === "done" ? <CheckIcon className="inline size-4 text-primary" strokeWidth={2.5} aria-label="fait" /> : `${i + 1}.`}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block", s.state === "current" && "font-medium")}>{s.title}</span>
                      {kindLabel[s.kind] !== s.title && (
                        <span className="block text-caption text-muted-foreground">{kindLabel[s.kind]}</span>
                      )}
                    </span>
                    <span className="text-right text-caption text-muted-foreground">
                      {s.state === "current" ? <span className="font-medium text-primary">En cours</span> : s.duration}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <aside className="divide-y">
          {formation.hasDiagnostic && (
            <AsideSection title="Diagnostic">
              <p className="text-sm text-muted-foreground">
                Pas encore fait. Il estime votre exposition à l&apos;IA et indique où commencer.
              </p>
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

      <section aria-labelledby="mes-formations" className="mt-12">
        <h2 id="mes-formations" className="text-heading">Mes formations</h2>
        <ul className="mt-4 divide-y border-y">
          {enrollments.map((e) => {
            const pct = progressOf(e);
            return (
              <li key={e.formation.id}>
                <Link
                  href={`/formations/${e.formation.slug}`}
                  className="grid gap-x-6 gap-y-2 py-4 transition-colors hover:bg-muted/50 sm:grid-cols-[1fr_12rem] sm:items-center sm:px-2"
                >
                  <span className="min-w-0">
                    <span className="block text-caption text-muted-foreground">{e.formation.domain}</span>
                    <span className="block font-medium">{e.formation.title}</span>
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
          Version de test : l&apos;avancement affiché ici est fictif tant que les comptes ne sont pas
          ouverts. Les contenus sont en cours de relecture par des professionnels.
        </p>
        <p>{site.certificateNotice}</p>
        <p>{site.emailNotice}</p>
      </div>
    </div>
  );
}
