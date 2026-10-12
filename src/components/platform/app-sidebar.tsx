"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompassIcon, HomeIcon, LibraryIcon, LockIcon, MessageSquareTextIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { site } from "@/lib/site";
import { useProgress } from "@/lib/progress/store";
import type { FormationWithModules } from "@/lib/content/types";

// La barre latérale reste courte quel que soit le nombre de formations :
// seules les formations commencées (ou celle qu'on consulte) y figurent, et le
// détail des modules n'apparaît que pour la formation ouverte.
export function AppSidebar({ formations }: { formations: FormationWithModules[] }) {
  const pathname = usePathname();
  const progress = useProgress();
  const keys = Object.keys(progress);
  const followed = formations.filter(
    (f) =>
      keys.some((k) => k.startsWith(`${f.slug}/`)) ||
      pathname === `/formations/${f.slug}` ||
      pathname.startsWith(`/formations/${f.slug}/`),
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="font-serif text-base font-semibold leading-none">E</span>
                </span>
                <span className="grid leading-tight">
                  <span className="font-semibold">{site.name}</span>
                  <span className="text-xs text-sidebar-foreground/60">Version de test</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Tableau de bord">
                <Link href="/">
                  <HomeIcon /> <span>Tableau de bord</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/catalogue"} tooltip="Catalogue">
                <Link href="/catalogue">
                  <LibraryIcon /> <span>Catalogue</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {followed.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Mes formations</SidebarGroupLabel>
            <SidebarMenu>
              {followed.map((f) => {
                const base = `/formations/${f.slug}`;
                const inside = pathname === base || pathname.startsWith(`${base}/`);
                return (
                  <SidebarMenuItem key={f.id}>
                    <SidebarMenuButton asChild isActive={pathname === base} tooltip={f.title}>
                      <Link href={base}>
                        <span className="grid size-4 shrink-0 place-items-center rounded-[4px] bg-sidebar-primary/15 text-[10px] font-semibold text-sidebar-primary">
                          {f.domain.charAt(0)}
                        </span>
                        <span>{f.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {inside && (
                      <SidebarMenuSub>
                        {f.hasDiagnostic && (
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={pathname === `${base}/diagnostic`}>
                              <Link href={`${base}/diagnostic`}>
                                <CompassIcon /> <span>Diagnostic</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )}
                        {f.modules.map((m) =>
                          m.availability === "open" ? (
                            <SidebarMenuSubItem key={m.id}>
                              <SidebarMenuSubButton asChild isActive={pathname === `${base}/${m.slug}`}>
                                <Link href={`${base}/${m.slug}`}>
                                  <span className="tabular-nums text-sidebar-foreground/60">{m.position}.</span>
                                  <span>{m.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ) : (
                            <SidebarMenuSubItem key={m.id}>
                              <SidebarMenuSubButton aria-disabled className="text-sidebar-foreground/50 hover:bg-transparent">
                                <LockIcon /> <span>{m.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ),
                        )}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Donner mon avis">
              <MessageSquareTextIcon /> <span>Donner mon avis</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <p className="px-2 py-1.5 text-xs leading-snug text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
              Pas encore de compte : votre progression reste sur cet appareil.
            </p>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
