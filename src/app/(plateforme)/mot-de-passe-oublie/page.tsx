import type { Metadata } from "next";
import { PageHeader } from "@/components/platform/page-header";
import { AmbientHero, FloatCard } from "@/components/platform/kit";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Connexion", href: "/connexion" }, { label: "Mot de passe oublié" }]} />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 md:py-8">
        <AmbientHero className="px-3 py-10 sm:px-10 sm:py-16">
          <FloatCard className="mx-auto w-full max-w-md p-7 sm:p-9">
            <header className="mb-7 space-y-2">
              <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight">Mot de passe oublié</h1>
              <p className="text-body text-muted-foreground">Indiquez votre adresse : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
            </header>
            <ForgotPasswordForm />
          </FloatCard>
        </AmbientHero>
      </div>
    </>
  );
}
