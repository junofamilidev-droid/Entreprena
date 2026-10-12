import type { Metadata } from "next";
import { PageHeader } from "@/components/platform/page-header";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Connexion", href: "/connexion" }, { label: "Mot de passe oublié" }]} />
      <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
        <header className="mb-8 space-y-2">
          <h1 className="text-title">Mot de passe oublié</h1>
          <p className="text-body text-muted-foreground">
            Indiquez votre adresse : vous recevrez un lien pour choisir un nouveau mot de passe.
          </p>
        </header>
        <ForgotPasswordForm />
      </div>
    </>
  );
}
