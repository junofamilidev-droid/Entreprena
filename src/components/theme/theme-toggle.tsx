"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

// Bascule clair / sombre, discrète, dans le pied de page.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="inline-flex min-h-6 items-center gap-1.5 rounded-sm text-caption text-subtle-foreground hover:text-foreground"
    >
      <SunIcon className="hidden size-3.5 dark:block" aria-hidden />
      <MoonIcon className="size-3.5 dark:hidden" aria-hidden />
      <span className="dark:hidden">Thème sombre</span>
      <span className="hidden dark:inline">Thème clair</span>
    </button>
  );
}
