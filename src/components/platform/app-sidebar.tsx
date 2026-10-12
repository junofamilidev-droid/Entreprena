"use client";

import Link from "next/link";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  CircleIcon,
  CompassIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  LockIcon,
  MessageSquareTextIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import type { FormationWithModules } from "@/lib/content/types";
import type { DemoStep } from "./types";
import { site } from "@/lib/site";

const stateIcon = {
  done: CheckCircle2Icon,
  current: CircleDotIcon,
  todo: CircleIcon,
} as const;

export function AppSidebar({
  formation,
  steps,
}: {
  formation: FormationWithModules;
  steps: DemoStep[];
}) {
  const current = formation.modules.find((m) => m.availability === "open");
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="#">
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
              <SidebarMenuButton isActive tooltip="Tableau de bord">
                <LayoutDashboardIcon /> <span>Tableau de bord</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Catalogue">
                <LibraryIcon /> <span>Catalogue</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Mon diagnostic">
                <CompassIcon /> <span>Mon diagnostic</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{formation.title}</SidebarGroupLabel>
          <SidebarMenu>
            {formation.modules.map((m) => (
              <SidebarMenuItem key={m.id}>
                <SidebarMenuButton tooltip={m.title} disabled={m.availability !== "open"} className="disabled:opacity-60">
                  {m.availability === "open" ? <BookOpenIcon /> : <LockIcon />}
                  <span>
                    {m.position}. {m.title}
                  </span>
                </SidebarMenuButton>
                {m.id === current?.id && (
                  <SidebarMenuSub>
                    {steps.map((s) => {
                      const Icon = stateIcon[s.state];
                      return (
                        <SidebarMenuSubItem key={s.title}>
                          <SidebarMenuSubButton isActive={s.state === "current"}>
                            <Icon className={s.state === "done" ? "text-sidebar-primary" : undefined} />
                            <span>{s.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Donner mon avis">
              <MessageSquareTextIcon /> <span>Donner mon avis</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Avatar className="size-8 rounded-md">
                <AvatarFallback className="rounded-md bg-sidebar-accent text-xs">CD</AvatarFallback>
              </Avatar>
              <span className="grid leading-tight">
                <span className="truncate font-medium">Compte de démonstration</span>
                <span className="truncate text-xs text-sidebar-foreground/60">demo@exemple.fr</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
