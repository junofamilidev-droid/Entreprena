import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/platform/app-sidebar";
import { SiteFooter } from "@/components/platform/site-footer";

export default function PlatformLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh">
        {children}
        <SiteFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
