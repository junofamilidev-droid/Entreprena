import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { AccountPanel } from "@/components/auth/account-panel";

export const metadata: Metadata = { title: "Mon compte" };

export default function AccountPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Ma formation", href: "/app" }, { label: "Mon compte" }]} />
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-8 sm:py-12">
        <h1 className="mb-8 text-title">Mon compte</h1>
        <Suspense>
          <AccountPanel />
        </Suspense>
      </div>
    </>
  );
}
