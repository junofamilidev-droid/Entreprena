import type { StepKind } from "@/lib/content/types";

// État d'avancement fictif, utilisé tant que les comptes apprenants ne sont pas branchés.
export interface DemoStep {
  title: string;
  kind: StepKind;
  meta: string;
  state: "done" | "current" | "todo";
}
