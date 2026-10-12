import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/platform/page-header";
import { ResumePanel, StepList } from "@/components/platform/module-progress";
import { getFormation, getModule, listFormations } from "@/lib/content/source";
import { moduleRef } from "@/lib/content/refs";

type Props = PageProps<"/formations/[slug]/[module]">;

export async function generateStaticParams() {
  return (await listFormations()).flatMap((f) => f.modules.map((m) => ({ slug: f.slug, module: m.slug })));
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
  const ref = mod.availability === "open" ? await moduleRef(formation, mod.slug) : null;

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Tableau de bord", href: "/" },
          { label: formation.title, href: `/formations/${formation.slug}` },
          { label: `Module ${mod.position}` },
        ]}
      />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 md:py-12">
        {!ref || ref.steps.length === 0 ? (
          <div className="max-w-2xl space-y-3">
            <p className="text-sm text-muted-foreground">Module {mod.position}</p>
            <h1 className="text-title">{mod.title}</h1>
            <p className="text-lead text-muted-foreground">Ce module n&apos;est pas encore ouvert.</p>
          </div>
        ) : (
          <>
            <ResumePanel refData={ref} />
            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_17rem] lg:gap-14">
              <section aria-labelledby="etapes" className="min-w-0">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 id="etapes" className="text-heading">Les étapes</h2>
                  {mod.durationLabel && <span className="text-sm text-muted-foreground">{mod.durationLabel}</span>}
                </div>
                <div className="mt-4">
                  <StepList refData={ref} />
                </div>
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
                <section className="space-y-2 border-t pt-6">
                  <h2 className="text-sm font-semibold">Votre progression</h2>
                  <p className="text-sm text-muted-foreground">
                    Elle est enregistrée sur cet appareil, dans ce navigateur. Les comptes permettront de la
                    retrouver partout.
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
