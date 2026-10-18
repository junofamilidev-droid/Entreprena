"use client";

import { site } from "@/lib/site";
import { WhereSaved } from "@/components/auth/where-saved";
import { ThemeToggle } from "@/components/theme/theme-toggle";

// Pied de page : les mentions, et le choix du thème.
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-caption text-subtle-foreground sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div className="max-w-2xl space-y-1.5">
          <p>
            Version de test. <WhereSaved invite={false} /> Les contenus sont en cours de relecture par des professionnels.
          </p>
          <p>{site.certificateNotice}</p>
          <p>{site.emailNotice}</p>
        </div>
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
