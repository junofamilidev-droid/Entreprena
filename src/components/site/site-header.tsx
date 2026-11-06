import Link from "next/link";
import { Brand } from "./brand";
import { LOGIN, NAV } from "./site-nav";

// En-tête de la vitrine : la marque, quelques liens, l'accès à l'espace apprenant.
// Aucun bouton plein ici : le bouton principal de chaque écran est dans la page.
export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="site-container flex h-16 items-center justify-between gap-6">
        <Brand />
        <nav aria-label="Navigation principale" className="flex items-center gap-1 text-[0.9375rem] sm:gap-2">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className="hidden rounded-md px-3 py-2 text-foreground/80 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:inline-block">
              {l.label}
            </Link>
          ))}
          <Link href={LOGIN.href} className="rounded-md px-3 py-2 font-medium text-foreground focus-visible:outline-2 focus-visible:outline-ring">
            {LOGIN.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
