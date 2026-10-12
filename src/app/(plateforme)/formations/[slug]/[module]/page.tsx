import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/platform/page-header";
import { getFormation, listFormations } from "@/lib/content/source";

export async function generateStaticParams() {
  return (await listFormations()).flatMap((f) => f.modules.map((m) => ({ slug: f.slug, module: m.slug })));
}

// Page provisoire : le lecteur de module sera construit à l'étape 3.
export default async function ModulePage(props: PageProps<"/formations/[slug]/[module]">) {
  const { slug, module } = await props.params;
  const formation = await getFormation(slug);
  const mod = formation?.modules.find((m) => m.slug === module);
  if (!formation || !mod) notFound();
  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Tableau de bord", href: "/" },
          { label: formation.title, href: `/formations/${formation.slug}` },
          { label: mod.title },
        ]}
      />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16 sm:px-8">
        <p className="text-sm text-muted-foreground">Module {mod.position}</p>
        <h1 className="text-title">{mod.title}</h1>
        <p className="text-lead text-muted-foreground">Le lecteur de module arrive à la prochaine étape.</p>
        <Button asChild variant="outline" className="self-start">
          <Link href={`/formations/${formation.slug}`}><ArrowLeftIcon /> Retour à la formation</Link>
        </Button>
      </main>
    </>
  );
}
