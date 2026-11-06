import type { Metadata } from "next";
import { PageHeader } from "@/components/platform/page-header";
import { PageIntro } from "@/components/platform/kit";
import { CertificateShowcase, type CertificateModule } from "@/components/platform/certificate-showcase";
import { moduleRef } from "@/lib/content/refs";
import { getModule, listFormations, listSessions } from "@/lib/content/source";
import { sessionKey } from "@/lib/sessions/progress";
import { site } from "@/lib/site";
import type { ModuleEndContent } from "@/lib/content/types";

export const metadata: Metadata = { title: "Certificat" };

// Un certificat par formation, délivré quand tous ses modules sont terminés et validés.
export default async function CertificatePage() {
  const formations = await listFormations();
  const items = await Promise.all(
    formations.map(async (f) => {
      const modules: CertificateModule[] = await Promise.all(
        f.modules.map(async (m) => {
          const ref = m.availability === "open" ? await moduleRef(f, m.slug) : null;
          const sessions = m.availability === "open" ? await listSessions(f.slug, m.slug) : [];
          const end = ref ? (await getModule(f.slug, m.slug))?.steps.find((s) => s.kind === "module_end") : undefined;
          const review = (end?.content as unknown as Partial<ModuleEndContent> | undefined)?.reviewStep;
          return {
            position: m.position,
            title: m.title,
            href: ref || sessions.length ? `/app/formations/${f.slug}/${m.slug}` : `/app/formations/${f.slug}`,
            ref: ref && ref.steps.length ? ref : null,
            sessionKeys: sessions.map((s) => sessionKey(f.slug, m.slug, s.number)),
            reviewKey: ref && review ? `${f.slug}/${m.slug}/${review}` : null,
          };
        }),
      );
      return { slug: f.slug, title: f.title, modules };
    }),
  );

  return (
    <>
      <PageHeader crumbs={[{ label: "Accueil", href: "/app" }, { label: "Certificat" }]} />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 md:py-8">
        <PageIntro eyebrow="Un par formation" title="Certificat">
          <p>
            Un seul certificat par formation, délivré quand tous les modules sont terminés et leurs livrables validés. Chaque module achevé lève un
            peu plus le brouillard.
          </p>
        </PageIntro>
        <div className="mt-10 space-y-14">
          {items.map((f) => (
            <CertificateShowcase key={f.slug} formationSlug={f.slug} formationTitle={f.title} modules={f.modules} />
          ))}
        </div>
        <p className="mt-10 max-w-3xl px-1 text-caption text-muted-foreground">{site.certificateNotice}</p>
      </div>
    </>
  );
}
