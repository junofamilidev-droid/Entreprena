"use client";

import { CheckIcon } from "lucide-react";
import { useProgress, useProgressReady } from "@/lib/progress/store";

// État d'une étape pour l'apprenant : terminée, en cours ou à faire.
export function StepStatus({ stepKey }: { stepKey: string }) {
  const ready = useProgressReady();
  const p = useProgress()[stepKey];
  if (!ready) return <span className="text-sm text-muted-foreground">&nbsp;</span>;
  if (p?.done)
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
        <CheckIcon className="size-4" strokeWidth={3} aria-hidden /> Terminé
      </span>
    );
  return <span className="text-sm text-muted-foreground">{p ? "En cours" : "À faire"}</span>;
}

/** Résultat de l'auto-correction enregistré pour un module (pour le certificat). */
export function CertificateStatus({ reviewKey, endHref, reviewHref }: { reviewKey: string; endHref: string; reviewHref: string }) {
  const ready = useProgressReady();
  const result = useProgress()[reviewKey]?.inputs?.result as Record<string, string> | undefined;
  if (!ready) return null;
  if (!result)
    return (
      <p className="text-sm text-muted-foreground">
        Pas encore obtenue : elle se débloque après l&apos;auto-correction.{" "}
        <a href={reviewHref} className="font-medium text-primary hover:underline">
          Aller à l&apos;auto-correction
        </a>
      </p>
    );
  const score = Number(result.score).toLocaleString("fr-FR");
  return result.passed === "1" ? (
    <p className="text-sm">
      <span className="font-medium text-primary">Validée avec {score} sur 20.</span>{" "}
      <a href={endHref} className="font-medium text-primary hover:underline">
        Voir et imprimer l&apos;attestation
      </a>
    </p>
  ) : (
    <p className="text-sm text-muted-foreground">
      Copie à reprendre ({score} sur 20).{" "}
      <a href={reviewHref} className="font-medium text-primary hover:underline">
        Revoir l&apos;auto-correction
      </a>
    </p>
  );
}
