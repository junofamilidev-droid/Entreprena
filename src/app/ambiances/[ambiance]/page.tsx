import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@fontsource-variable/nunito";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/geist";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/platform/app-sidebar";
import { LearnerDashboard } from "@/components/platform/learner-dashboard";
import type { DemoStep } from "@/components/platform/types";
import { listFormations } from "@/lib/content/source";
import { AmbianceRoot } from "../ambiance-root";
import { ambiances } from "../ambiances";
import course from "../../../../content/auditeur-augmente/cours-module-1.json";

export const metadata: Metadata = { title: "Ambiance", robots: { index: false } };

export function generateStaticParams() {
  return ambiances.map((a) => ({ ambiance: a.id }));
}

// Avancement fictif : leçon 2 en cours.
const steps: DemoStep[] = [
  ...course.modules[0].lecons.map((l, i): DemoStep => ({
    title: l.titre,
    kind: "lesson",
    meta: l.duree,
    state: i === 0 ? "done" : i === 1 ? "current" : "todo",
  })),
  { title: "Exercice · Nordelia Distribution", kind: "exercise", meta: "60 min, en 5 étapes", state: "todo" },
  { title: "Auto-correction", kind: "self_review", meta: "grille sur 20 et corrigé", state: "todo" },
  { title: "Fin du module", kind: "module_end", meta: "attestation", state: "todo" },
];

export default async function AmbiancePage(props: PageProps<"/ambiances/[ambiance]">) {
  const { ambiance } = await props.params;
  const a = ambiances.find((x) => x.id === ambiance);
  if (!a) notFound();
  const formation = (await listFormations())[0];
  const index = ambiances.indexOf(a);
  const next = ambiances[(index + 1) % ambiances.length];

  return (
    <AmbianceRoot id={a.id} dark={a.id === "tech"}>
      <div className="fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-full border bg-popover py-1.5 pr-1.5 pl-4 text-sm shadow-lg">
        <span className="text-muted-foreground">
          Ambiance {index + 1}/4 · <span className="font-medium text-foreground">{a.name}</span>
        </span>
        <Link href={`/ambiances/${next.id}`} className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
          Suivante
        </Link>
      </div>
      <SidebarProvider>
        <AppSidebar formation={formation} steps={steps} />
        <SidebarInset>
          <LearnerDashboard formation={formation} steps={steps} />
        </SidebarInset>
      </SidebarProvider>
    </AmbianceRoot>
  );
}
