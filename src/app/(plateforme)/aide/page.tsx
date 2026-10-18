import type { Metadata } from "next";
import { PageHeader } from "@/components/platform/page-header";
import { WhereSaved } from "@/components/auth/where-saved";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Aide & contact" };

const faq = [
  {
    q: "Où est enregistrée ma progression ?",
    a: "Sur cet appareil tant que vous n'avez pas de compte. Avec un compte, elle est enregistrée dans votre compte et vous la retrouvez sur tous vos appareils.",
  },
  {
    q: "J'ai oublié mon mot de passe.",
    a: "Sur la page de connexion, cliquez sur « Mot de passe oublié ? » : un lien vous est envoyé par email.",
  },
  {
    q: "Puis-je utiliser les exercices avec les données d'un vrai client ?",
    a: "Non. Les exercices portent sur des données fictives. Sur un vrai dossier, appliquez d'abord les règles de votre cabinet et anonymisez vos données.",
  },
  {
    q: "Le certificat a-t-il une valeur officielle ?",
    a: site.certificateNotice,
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Accueil", href: "/" }, { label: "Aide & contact" }]} />
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8 md:py-10">
        <h1 className="text-title">Aide & contact</h1>
        <dl className="mt-6 divide-y rounded-lg border bg-card">
          {faq.map((f) => (
            <div key={f.q} className="px-5 py-4">
              <dt className="font-medium">{f.q}</dt>
              <dd className="mt-1 text-body text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
        <section className="mt-8 space-y-2">
          <h2 className="text-heading">Nous écrire</h2>
          <p className="text-body text-muted-foreground">
            Une erreur dans un contenu, une question ou une idée : utilisez « Donner mon avis », en bas de la barre
            latérale. C&apos;est une version de test, chaque retour est lu.
          </p>
        </section>
        <section className="mt-8 space-y-2 border-t pt-6 text-caption text-muted-foreground">
          <p>
            Version de test : <WhereSaved invite={false} /> Les contenus sont en cours de relecture par des
            professionnels.
          </p>
          <p>{site.emailNotice}</p>
        </section>
      </div>
    </>
  );
}
