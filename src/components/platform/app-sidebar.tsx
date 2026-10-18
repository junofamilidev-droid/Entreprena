"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenIcon, LibraryIcon, LogInIcon, MessageSquareTextIcon, PencilRulerIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { site } from "@/lib/site";
import { displayName, useAuth, useIsAdmin } from "@/lib/auth/session";
import { hasSupabase } from "@/lib/supabase/env";

// Trois entrées, toujours les mêmes : Ma formation, Catalogue, Donner mon avis.
// En bas : le compte de l'apprenant (et l'espace réservé pour l'administrateur).
export function AppSidebar() {
  const pathname = usePathname();
  const inFormation = pathname === "/app" || pathname.startsWith("/formations/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/app">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-base font-semibold leading-none">E</span>
                </span>
                <span className="grid leading-tight">
                  <span className="font-semibold">{site.name}</span>
                  <span className="text-xs text-sidebar-foreground/70">Version de test</span>
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
              <SidebarMenuButton asChild isActive={inFormation} tooltip="Ma formation">
                <Link href="/app">
                  <BookOpenIcon /> <span>Ma formation</span>
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
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Donner mon avis">
                <MessageSquareTextIcon /> <span>Donner mon avis</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <AdminItem />
          <AccountItem />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

// Bas de la barre : l'apprenant connecté (vers son compte), ou le lien de connexion.
function AccountItem() {
  const pathname = usePathname();
  const auth = useAuth();
  if (!hasSupabase) {
    return (
      <SidebarMenuItem>
        <p className="px-2 py-1.5 text-xs leading-snug text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
          Pas encore de compte : votre progression reste sur cet appareil.
        </p>
      </SidebarMenuItem>
    );
  }
  if (auth.status === "loading") return <SidebarMenuItem className="h-12" />;
  if (auth.status === "anon") {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/connexion"} tooltip="Se connecter">
          <Link href={`/connexion?next=${encodeURIComponent(pathname)}`}>
            <LogInIcon /> <span>Se connecter</span>
          </Link>
        </SidebarMenuButton>
        <p className="px-2 pt-1 pb-1.5 text-xs leading-snug text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
          Sans compte, votre progression reste sur cet appareil.
        </p>
      </SidebarMenuItem>
    );
  }
  const name = displayName(auth.user);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild size="lg" isActive={pathname === "/compte"} tooltip="Mon compte">
        <Link href="/compte">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold uppercase">
            {name.charAt(0)}
          </span>
          <span className="grid min-w-0 leading-tight">
            <span className="truncate font-medium">{name}</span>
            <span className="truncate text-xs text-sidebar-foreground/60">Mon compte</span>
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AdminItem() {
  const admin = useIsAdmin();
  if (!admin) return null;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip="Espace réservé">
        <Link href="/admin">
          <PencilRulerIcon /> <span>Espace réservé</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
