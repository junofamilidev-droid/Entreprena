"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { LOGIN, NAV } from "./site-nav";

// En-tête de la vitrine, collé en haut. Sur l'accueil, il est transparent au-dessus de la scène
// sombre du haut de page, puis devient une barre claire dès que l'on fait défiler.
// Aucun bouton plein : le bouton principal de chaque écran est dans la page.
export function SiteHeader() {
  const path = usePathname();
  const home = path === "/" || path.startsWith("/apercu-");
  const [heroVisible, setHeroVisible] = React.useState(true);
  const onHero = home && heroVisible;
  // Sur un haut de page clair (accueil, aperçu abstrait), l'en-tête garde un texte foncé.
  const lightHero = path !== "/apercu-illustration";

  React.useEffect(() => {
    if (!home) return;
    const hero = document.getElementById("haut-de-page");
    const update = () => setHeroVisible(!!hero && window.scrollY < 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [home]);

  return (
    <header
      data-on-hero={(onHero && !lightHero) || undefined}
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color,color] duration-300",
        onHero ? `border-b border-transparent ${lightHero ? "text-[oklch(0.22_0.03_205)]" : "text-[var(--night-foreground)]"}` : "border-b border-border bg-background/85 text-foreground backdrop-blur-md",
      )}
    >
      <div className="site-container flex h-16 items-center justify-between gap-6">
        <Brand />
        <nav aria-label="Navigation principale" className="flex items-center gap-1 text-[0.9375rem] sm:gap-2">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className="hidden rounded-md px-3 py-2 opacity-80 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-ring sm:inline-block">
              {l.label}
            </Link>
          ))}
          <Link
            href={LOGIN.href}
            prefetch={false}
            className={cn(
              "ml-1 inline-flex min-h-10 items-center rounded-md border px-4 font-medium focus-visible:outline-2 focus-visible:outline-ring",
              onHero ? (lightHero ? "border-[oklch(0.22_0.03_205)]/25 hover:border-[oklch(0.22_0.03_205)]/50" : "border-white/25 hover:border-white/50") : "border-border hover:border-foreground/30",
            )}
          >
            {LOGIN.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
