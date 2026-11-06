import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { AmbientHero, FloatCard } from "@/components/platform/kit";
import { SignInPanel } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Connexion" };

export default function SignInPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Accueil", href: "/app" }, { label: "Connexion" }]} />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 md:py-8">
        <AmbientHero className="px-3 py-10 sm:px-10 sm:py-16">
          <FloatCard className="mx-auto w-full max-w-md p-7 sm:p-9">
            <header className="mb-7 space-y-2">
              <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight">Votre compte</h1>
              <p className="text-body text-muted-foreground">Retrouvez votre progression et vos saisies d&apos;exercice sur tous vos appareils.</p>
            </header>
            <Suspense>
              <SignInPanel />
            </Suspense>
          </FloatCard>
        </AmbientHero>
      </div>
    </>
  );
}
