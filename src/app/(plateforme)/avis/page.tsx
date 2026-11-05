import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { FeedbackPage } from "@/components/feedback/feedback-page";
import { Skeleton } from "@/components/ui/skeleton";
import { listFormations } from "@/lib/content/source";

export const metadata: Metadata = { title: "Donner mon avis" };

export default async function AvisPage() {
  const formations = (await listFormations()).map((f) => ({ id: f.id, slug: f.slug, title: f.title }));
  return (
    <>
      <PageHeader crumbs={[{ label: "Accueil", href: "/" }, { label: "Donner mon avis" }]} />
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 md:py-8">
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-[2rem]" />}>
          <FeedbackPage formations={formations} />
        </Suspense>
      </div>
    </>
  );
}
