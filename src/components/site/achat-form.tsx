"use client";

import * as React from "react";
import { ArrowRightIcon, LockIcon } from "lucide-react";
import { acheter } from "@/app/(site)/formations/actions";

// Bouton d'achat : mène directement à la page de paiement Stripe, où l'acheteur accepte les CGV
// (case standard, obligatoire). Les CGV contiennent la clause d'accès immédiat au contenu numérique.
export function AchatForm({ formation, prix }: { formation: string; prix: string }) {
  const [etat, action, envoi] = React.useActionState(async (_: { erreur: string } | null, fd: FormData) => (await acheter(fd)) ?? null, null);
  return (
    <form action={action} className="max-w-[32rem]">
      <input type="hidden" name="formation" value={formation} />
      <button type="submit" disabled={envoi} className="btn-primary disabled:cursor-wait disabled:opacity-60">
        {envoi ? "Ouverture du paiement…" : `Accéder au parcours (${prix})`} <ArrowRightIcon className="size-4" aria-hidden />
      </button>
      {etat?.erreur && (
        <p role="alert" className="mt-2 type-small font-medium text-[oklch(0.5_0.15_40)]">
          {etat.erreur}
        </p>
      )}
      <p className="mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
        <LockIcon className="size-3.5" aria-hidden /> Paiement sécurisé par Stripe · accès immédiat
      </p>
    </form>
  );
}
