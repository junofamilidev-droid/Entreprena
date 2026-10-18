"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import {
  AwardIcon,
  BookOpenIcon,
  FolderIcon,
  HomeIcon,
  LibraryIcon,
  LifeBuoyIcon,
  MessageSquareTextIcon,
  PencilRulerIcon,
  SquarePenIcon,
} from "lucide-react";
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
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { site } from "@/lib/site";
import { useIsAdmin } from "@/lib/auth/session";
import { useProgress } from "@/lib/progress/store";
import type { FormationWithModules } from "@/lib/content/types";

// L'entrée active porte un trait de couleur à gauche, comme sur la maquette.
// Le trait glisse d'une entrée à l'autre quand on change de page.
const ACTIVE =
  "relative h-10 transition-colors data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-foreground";

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={label} className={ACTIVE}>
        <Link href={href}>
          {active && (
            <motion.span
              layoutId="nav-indicator"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
              className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-sidebar-primary"
              aria-hidden
            />
          )}
          {icon} <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ formations }: { formations: FormationWithModules[] }) {
  const pathname = usePathname();
  const progress = useProgress();
  const admin = useIsAdmin();

  // « Ma formation » : la dernière formation ouverte par l'apprenant, sinon la première du catalogue.
  const keys = Object.entries(progress).sort((a, b) => b[1].updatedAt - a[1].updatedAt);
  const recent = keys.map(([k]) => k.split("/")[0]).find((slug) => formations.some((f) => f.slug === slug));
  const mine = formations.find((f) => f.slug === recent) ?? formations[0];
  const mineHref = mine ? `/formations/${mine.slug}` : "/catalogue";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 pt-5 pb-4 group-data-[collapsible=icon]:px-2">
        <Link href="/" className="flex items-baseline gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <span className="text-xl font-bold tracking-tight group-data-[collapsible=icon]:hidden">{site.name}</span>
          <span className="hidden w-full text-center text-xl font-bold group-data-[collapsible=icon]:block">E.</span>
          <span className="text-[11px] text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">version de test</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            <NavItem href="/" label="Accueil" icon={<HomeIcon />} active={pathname === "/"} />
            <NavItem
              href={mineHref}
              label="Ma formation"
              icon={<BookOpenIcon />}
              active={pathname.startsWith("/formations/")}
            />
            <NavItem href="/projets" label="Projets pratiques" icon={<SquarePenIcon />} active={pathname === "/projets"} />
            <NavItem href="/ressources" label="Ressources" icon={<FolderIcon />} active={pathname === "/ressources"} />
            <NavItem href="/certificat" label="Certificat" icon={<AwardIcon />} active={pathname === "/certificat"} />
            <NavItem href="/catalogue" label="Catalogue" icon={<LibraryIcon />} active={pathname === "/catalogue"} />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-4">
        <SidebarMenu className="gap-1">
          {admin && <NavItem href="/admin" label="Espace réservé" icon={<PencilRulerIcon />} active={false} />}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Donner mon avis">
              <MessageSquareTextIcon /> <span>Donner mon avis</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
          <NavItem href="/aide" label="Aide & contact" icon={<LifeBuoyIcon />} active={pathname === "/aide"} />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
