import Link from "next/link";
import { site } from "@/lib/site";
import { Brand } from "./brand";
import { LOGIN, NAV } from "./site-nav";
import { ThemeSwitch } from "./theme-switch";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="site-container grid gap-10 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Brand />
          <p className="mt-3 type-small text-muted-foreground">{site.tagline}</p>
        </div>
        <nav aria-label="Le site" className="type-small">
          <ul className="space-y-1">
            {[...NAV, { href: "/app", label: "Espace apprenant" }, LOGIN].map((l) => (
              <li key={l.href}>
                <Link href={l.href} prefetch={l.href.startsWith("/app") ? false : undefined} className="inline-flex min-h-9 items-center text-muted-foreground hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="type-small">
          <ThemeSwitch />
          <ul className="mt-3 space-y-1">
            <li>
              <Link href="/cgv" className="inline-flex min-h-9 items-center text-muted-foreground hover:text-foreground">
                Conditions générales de vente
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
