import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { PageIntro } from "@/components/platform/kit";
import { AccountPanel } from "@/components/auth/account-panel";

export const metadata: Metadata = { title: "Mon compte" };

export default function AccountPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Accueil", href: "/" }, { label: "Mon compte" }]} />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 md:py-8">
        <PageIntro eyebrow="Profil, progression et sécurité" title="Mon compte" />
        <div className="mx-auto mt-10 max-w-2xl">
          <Suspense>
            <AccountPanel />
          </Suspense>
        </div>
      </div>
    </>
  );
}
