import type { Metadata } from "next";
import { Suspense } from "react";
import { Eyebrow } from "@/components/site/kit";
import { Desinscription } from "./desinscription";

export const metadata: Metadata = { title: "Se désinscrire", robots: { index: false, follow: false } };

async function Contenu({ searchParams }: { searchParams: Promise<{ e?: string; s?: string; t?: string }> }) {
  const { e = "", s = "", t = "" } = await searchParams;
  return <Desinscription e={e} s={s} t={t} />;
}

export default function DesinscriptionPage({ searchParams }: { searchParams: Promise<{ e?: string; s?: string; t?: string }> }) {
  return (
    <section className="site-container site-section">
      <Eyebrow>Vos emails</Eyebrow>
      <Suspense>
        <Contenu searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
