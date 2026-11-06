"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

/** Bascule clair / sombre du pied de page. */
export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="inline-flex min-h-11 items-center gap-2 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
    >
      <SunIcon className="hidden size-4 dark:block" aria-hidden />
      <MoonIcon className="size-4 dark:hidden" aria-hidden />
      <span className="dark:hidden">Thème sombre</span>
      <span className="hidden dark:inline">Thème clair</span>
    </button>
  );
}
