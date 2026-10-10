import { Logo } from "./site-header";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_1.4fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-caption text-muted-foreground">{site.tagline}</p>
        </div>
        <div className="space-y-3 text-caption text-muted-foreground">
          <p>
            <strong className="font-semibold text-foreground">Version de test.</strong> Les contenus
            n&apos;ont pas encore tous été relus par des professionnels. Les scores affichés sont des
            estimations. Les données des exercices sont fictives.
          </p>
          <p>{site.certificateNotice}</p>
          <p>{site.emailNotice}</p>
          <p>© {site.name}</p>
        </div>
      </div>
    </footer>
  );
}
