import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/platform/app-sidebar";
import { listFormations } from "@/lib/content/source";

export default async function PlatformLayout({ children }: LayoutProps<"/">) {
  const formations = await listFormations();
  return (
    <SidebarProvider>
      <AppSidebar formations={formations} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
