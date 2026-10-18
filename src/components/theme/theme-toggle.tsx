"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <SidebarMenuButton
      onClick={() => setTheme(dark ? "light" : "dark")}
      tooltip={dark ? "Passer en thème clair" : "Passer en thème sombre"}
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
      <span className="dark:hidden">Thème sombre</span>
      <span className="hidden dark:inline">Thème clair</span>
    </SidebarMenuButton>
  );
}
