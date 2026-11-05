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

// L'entrée active est posée sur une pastille claire, comme les onglets du lecteur de session.
// La pastille glisse d'une entrée à l'autre quand on change de page.
const ACTIVE =
  "relative isolate h-10 transition-colors hover:bg-sidebar-foreground/[0.05] data-[active=true]:bg-transparent data-[active=true]:font-semibold data-[active=true]:text-sidebar-foreground";

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={label} className={ACTIVE}>
        <Link href={href}>
          {active && (
            <motion.span
              layoutId="nav-indicator"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
              className="absolute inset-0 -z-10 rounded-xl bg-sidebar-foreground/[0.07]"
              aria-hidden
            />
          )}
          <span className={active ? "text-primary" : "text-sidebar-foreground/70"}>{icon}</span> <span>{label}</span>
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
    <Sidebar collapsible="icon" className="sidebar-plateforme">
      <SidebarHeader className="px-4 pt-5 pb-4 group-data-[collapsible=icon]:px-2">
        <Link href="/" className="flex items-baseline gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <span className="text-xl font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            {site.name.replace(/\.$/, "")}
            <span className="text-primary">.</span>
          </span>
          <span className="hidden w-full text-center text-xl font-bold group-data-[collapsible=icon]:block">
            E<span className="text-primary">.</span>
          </span>
          <span className="rounded-full bg-sidebar-foreground/[0.06] px-2 py-0.5 text-[10px] font-medium text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
            test
          </span>
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
            <NavItem href="/boite-a-outils" label="Ma boîte à outils" icon={<FolderIcon />} active={pathname === "/boite-a-outils"} />
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
