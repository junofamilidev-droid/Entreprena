"use client";

import { StatusLabel } from "./kit";
import { useProgress, useProgressReady } from "@/lib/progress/store";

// État d'une étape pour l'apprenant : terminée, en cours ou à faire.
export function StepStatus({ stepKey }: { stepKey: string }) {
  const ready = useProgressReady();
  const p = useProgress()[stepKey];
  if (!ready) return <span className="text-sm text-muted-foreground">&nbsp;</span>;
  if (p?.done) return <StatusLabel tone="success">Terminé</StatusLabel>;
  return p ? <StatusLabel tone="active">En cours</StatusLabel> : <StatusLabel tone="idle">À faire</StatusLabel>;
}
