import type { Metadata } from "next";
import { PageHeader } from "@/components/platform/page-header";
import { PageIntro } from "@/components/platform/kit";
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
    a: "Pas besoin de mot de passe : sur la page de connexion, indiquez votre email et saisissez le code à 6 chiffres reçu.",
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
      <PageHeader crumbs={[{ label: "Accueil", href: "/app" }, { label: "Aide & contact" }]} />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 md:py-8">
        <PageIntro eyebrow="Questions fréquentes" title="Aide & contact">
          <p>Les réponses aux questions les plus courantes, et comment nous écrire.</p>
        </PageIntro>
        <div className="mx-auto mt-10 max-w-3xl">
          <dl className="space-y-2">
            {faq.map((f) => (
              <div key={f.q} className="rounded-3xl bg-muted/50 px-6 py-5">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1.5 text-body text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
          <section className="mt-10 space-y-2 px-1">
            <h2 className="text-heading">Nous écrire</h2>
            <p className="text-body text-muted-foreground">
              Une erreur dans un contenu, une question ou une idée : utilisez « Donner mon avis », en bas de la barre latérale. C&apos;est une version
              de test, chaque retour est lu.
            </p>
          </section>
          <section className="mt-10 space-y-2 px-1 text-caption text-muted-foreground">
            <p>
              Version de test : <WhereSaved invite={false} /> Les contenus sont en cours de relecture par des professionnels.
            </p>
            <p>{site.emailNotice}</p>
          </section>
        </div>
      </div>
    </>
  );
}
