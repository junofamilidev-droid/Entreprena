import "@fontsource-variable/bricolage-grotesque";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

// Mise en page de la vitrine : en-tête et pied de page, sans le menu de la plateforme.
// Les jetons visuels (couleurs, tailles, espacements) sont dans src/styles/vitrine-tokens.css.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site flex min-h-dvh flex-col">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:outline-2 focus:outline-ring">
        Aller au contenu
      </a>
      <SiteHeader />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
