import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Eyebrow } from "@/components/site/kit";

export const metadata: Metadata = { title: "Votre achat", robots: { index: false } };

// Messages après le paiement, quand on n'a pas pu emmener l'acheteur directement dans la formation.
const MESSAGES: Record<string, { titre: string; texte: string; lien: { href: string; label: string } }> = {
  connexion: {
    titre: "Merci, votre accès est ouvert.",
    texte: "Connectez-vous avec l'adresse email utilisée pour le paiement. Première connexion : choisissez « Mot de passe oublié » pour créer votre mot de passe.",
    lien: { href: "/app/connexion", label: "Se connecter" },
  },
  attente: {
    titre: "Votre paiement est en cours de confirmation.",
    texte: "Cela prend en général quelques secondes. Rechargez cette page dans un instant ; si rien ne change, écrivez-nous.",
    lien: { href: "/formations", label: "Retour aux formations" },
  },
  introuvable: {
    titre: "Nous ne retrouvons pas ce paiement.",
    texte: "Le lien semble incomplet. Si vous avez payé, connectez-vous : votre accès vous attend.",
    lien: { href: "/app/connexion", label: "Se connecter" },
  },
  erreur: {
    titre: "Un souci technique est survenu.",
    texte: "Votre paiement, s'il a été validé, est bien enregistré par Stripe. Réessayez dans un instant, ou connectez-vous.",
    lien: { href: "/app/connexion", label: "Se connecter" },
  },
};

async function Message({ searchParams }: { searchParams: Promise<{ etat?: string }> }) {
  const { etat } = await searchParams;
  const m = MESSAGES[etat ?? ""] ?? MESSAGES.connexion;
  return (
    <>
      <h1 className="mt-4 type-display max-w-[16ch]">{m.titre}</h1>
      <p className="mt-6 max-w-[36rem] type-lead text-foreground/75">{m.texte}</p>
      <Link href={m.lien.href} className="btn-primary mt-8">
        {m.lien.label}
      </Link>
    </>
  );
}

export default function MerciPage({ searchParams }: { searchParams: Promise<{ etat?: string }> }) {
  return (
    <section className="site-container site-section">
      <Eyebrow>Votre achat</Eyebrow>
      <Suspense>
        <Message searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
