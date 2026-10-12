import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { SignInPanel } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Connexion" };

export default function SignInPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Tableau de bord", href: "/" }, { label: "Connexion" }]} />
      <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
        <header className="mb-8 space-y-2">
          <h1 className="text-title">Votre compte</h1>
          <p className="text-body text-muted-foreground">
            Retrouvez votre progression et vos saisies d&apos;exercice sur tous vos appareils.
          </p>
        </header>
        <Suspense>
          <SignInPanel />
        </Suspense>
      </div>
    </>
  );
}
