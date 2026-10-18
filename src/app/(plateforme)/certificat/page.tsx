import type { Metadata } from "next";
import { AwardIcon } from "lucide-react";
import { PageHeader } from "@/components/platform/page-header";
import { CertificateStatus } from "@/components/platform/step-status";
import { openModules } from "@/lib/content/library";
import { site } from "@/lib/site";
import type { ModuleEndContent } from "@/lib/content/types";

export const metadata: Metadata = { title: "Certificat" };

export default async function CertificatePage() {
  const { open } = await openModules();
  const items = open.flatMap((o) =>
    o.module.steps
      .filter((s) => s.kind === "module_end")
      .map((s) => ({ o, s, review: (s.content as unknown as Partial<ModuleEndContent>).reviewStep })),
  );
  return (
    <>
      <PageHeader crumbs={[{ label: "Accueil", href: "/" }, { label: "Certificat" }]} />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 md:py-10">
        <h1 className="text-title">Certificat</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          Chaque module validé donne une attestation, adossée à votre livrable. {site.certificateNotice}
        </p>
        <ul className="mt-6 overflow-hidden rounded-lg border bg-card">
          {items.map(({ o, s, review }) => {
            const base = `/formations/${o.formationSlug}/${o.module.slug}`;
            return (
              <li key={s.id} className="flex items-start gap-4 border-b px-4 py-4 last:border-b-0 sm:px-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-primary">
                  <AwardIcon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block font-medium">
                    Module {o.module.position} : {o.module.title}
                  </span>
                  {review ? (
                    <CertificateStatus
                      reviewKey={`${o.formationSlug}/${o.module.slug}/${review}`}
                      endHref={`${base}/${s.slug}`}
                      reviewHref={`${base}/${review}`}
                    />
                  ) : (
                    <span className="block text-sm text-muted-foreground">Attestation en préparation.</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
