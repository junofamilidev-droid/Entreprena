import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/platform/app-sidebar";
import { listFormations } from "@/lib/content/source";
import { demoEnrollments, demoLearner } from "@/lib/demo/progress";

export default async function PlatformLayout({ children }: LayoutProps<"/">) {
  const followed = demoEnrollments(await listFormations()).map((e) => e.formation);
  return (
    <SidebarProvider>
      <AppSidebar followed={followed} learner={demoLearner} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
