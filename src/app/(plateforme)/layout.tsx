import { ViewTransition } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/platform/app-sidebar";
import { SearchIndexProvider, type SearchEntry } from "@/components/platform/search-index";
import { listFormations } from "@/lib/content/source";
import { openModuleRefs } from "@/lib/content/refs";
import { sessionsIndex } from "@/lib/content/library";

export default async function PlatformLayout({ children }: LayoutProps<"/">) {
  const formations = await listFormations();
  const [refs, index] = await Promise.all([openModuleRefs(formations), sessionsIndex(formations)]);
  // Index de la recherche du haut de page : formations, modules, et étapes des modules ouverts.
  const entries: SearchEntry[] = formations.flatMap((f) => [
    { label: f.title, context: "Formation", href: `/formations/${f.slug}` },
    ...f.modules.map((m) => ({
      label: m.title,
      context: `${f.title}, module ${m.position}${m.availability === "open" ? "" : " (à venir)"}`,
      href: m.availability === "open" ? `/formations/${f.slug}/${m.slug}` : `/formations/${f.slug}`,
    })),
  ]);
  for (const f of formations) {
    for (const m of f.modules) {
      for (const s of index.sessions[`${f.slug}/${m.slug}`] ?? []) {
        entries.push({
          label: s.title,
          context: `Module ${m.position}, session ${s.number} · ${s.durationMin} min`,
          href: `/formations/${f.slug}/${m.slug}/session/${s.number}`,
        });
      }
    }
  }
  for (const r of refs) {
    for (const s of r.steps) {
      entries.push({
        label: s.title,
        context: `Module ${r.module.position} : ${r.module.title}`,
        href: `/formations/${r.formationSlug}/${r.module.slug}/${s.slug}`,
      });
    }
  }
  return (
    <SearchIndexProvider entries={entries}>
      <SidebarProvider>
        <AppSidebar formations={formations} />
        <SidebarInset>
          <ViewTransition default="page">{children}</ViewTransition>
        </SidebarInset>
      </SidebarProvider>
    </SearchIndexProvider>
  );
}
