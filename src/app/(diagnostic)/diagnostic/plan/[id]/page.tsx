import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { calculer, LIBELLE_EXPOSITION } from "@/lib/diagnostic-metier/calcul";
import { AUTRE, metierParId } from "@/lib/diagnostic-metier/metiers";
import { construirePlan } from "@/lib/diagnostic-metier/plan";
import { jetonValide, type LigneDiagnostic } from "@/lib/emails/envois";
import { site } from "@/lib/site";
import { PlanAction } from "@/components/diagnostic-metier/plan-action";

export const metadata: Metadata = { title: "Votre plan d'action", robots: { index: false, follow: false } };

// Plan d'action personnel, ouvert depuis l'email « Votre plan d'action » (lien signé, propre à chaque diagnostic) :
// il fonctionne sur n'importe quel appareil, sans compte.

async function Plan({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  await connection();
  const [{ id }, { t }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/.test(id) || !jetonValide(`plan:${id}`, t)) notFound();
  const db = adminClient();
  if (!db) notFound();
  const { data } = await db.from("diagnostics_metier").select("id, email, metier, metier_autre, taches, frequence_ia, cadre, objectif, consentement_emails").eq("id", id).maybeSingle();
  const d = data as (LigneDiagnostic & { consentement_emails: boolean }) | null;
  const metier = d && metierParId(d.metier);
  if (!d || !metier || !d.email) notFound();
  const reponses = { metier: d.metier, metierAutre: d.metier_autre ?? undefined, taches: d.taches, frequence: d.frequence_ia, cadre: d.cadre, objectif: d.objectif };
  const resultat = calculer(reponses, metier.taches);
  const plan = construirePlan(metier, resultat, reponses, d.consentement_emails && metier.statut !== "disponible");
  return (
    <div className="mx-auto w-full max-w-[44rem] pb-16">
      <section className="text-center">
        <p className="text-[0.9375rem] font-medium text-muted-foreground">Votre résultat · {metier.id === AUTRE && d.metier_autre ? d.metier_autre : metier.libelle}</p>
        <h1 className="mt-4 font-display text-[clamp(2.25rem,1.5rem+3vw,3.5rem)] leading-[1] font-semibold tracking-[-0.04em]">{LIBELLE_EXPOSITION[resultat.niveau]}</h1>
        <p className="mt-2 type-small text-muted-foreground">Score indicatif : {resultat.score}/100. Estimation à partir de vos réponses.</p>
      </section>
      <PlanAction plan={plan} email={d.email} id={d.id} reponses={{ ...reponses, utm: undefined }} />
      <p className="mt-10 text-center">
        <Link href="/diagnostic" className="link-quiet type-small">
          Refaire le diagnostic
        </Link>
      </p>
    </div>
  );
}

export default function PlanPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="site-container flex h-16 items-center">
        <Link href="/" className="font-display text-[1.375rem] font-semibold tracking-tight">
          {site.name.replace(/\.$/, "")}
          <span className="text-primary">.</span>
        </Link>
      </header>
      <main className="site-container flex-1 pt-6 sm:pt-12">
        <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
          <Plan {...props} />
        </Suspense>
      </main>
    </div>
  );
}
