import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, LockIcon } from "lucide-react";
import { PageHeader } from "@/components/platform/page-header";
import { StepStatus } from "@/components/platform/step-status";
import { openModules } from "@/lib/content/library";

export const metadata: Metadata = { title: "Projets pratiques" };

export default async function ProjectsPage() {
  const { open, soon } = await openModules();
  const projects = open.flatMap((o) =>
    o.module.steps.filter((s) => s.kind === "exercise").map((s) => ({ o, s })),
  );
  return (
    <>
      <PageHeader crumbs={[{ label: "Accueil", href: "/" }, { label: "Projets pratiques" }]} />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 md:py-10">
        <h1 className="text-title">Projets pratiques</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          Un cas fictif par module, sur de vraies données, et un livrable que vous gardez.
        </p>
        <ul className="mt-6 overflow-hidden rounded-lg border bg-card">
          {projects.map(({ o, s }) => (
            <li key={s.id} className="border-b last:border-b-0">
              <Link
                href={`/formations/${o.formationSlug}/${o.module.slug}/${s.slug}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-muted/60 sm:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{s.title}</span>
                  <span className="block text-sm text-muted-foreground">
                    Module {o.module.position} : {o.module.title}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">Livrable : {o.module.deliverable}</span>
                </span>
                <StepStatus stepKey={`${o.formationSlug}/${o.module.slug}/${s.slug}`} />
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
          {soon.map((m) => (
            <li key={m.id} className="flex items-center gap-4 border-b px-4 py-4 last:border-b-0 sm:px-5">
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-muted-foreground">
                  Module {m.position} : {m.title}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {m.summary} Livrable : {m.deliverable.charAt(0).toLowerCase() + m.deliverable.slice(1)}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                <LockIcon className="size-3.5" aria-hidden /> À venir
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
