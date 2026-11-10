import type { Metadata } from "next";
import { DiagnosticFlow } from "@/components/diagnostic-metier/diagnostic-flow";
import { metiersPublics } from "@/lib/diagnostic-metier/metiers";

export const metadata: Metadata = {
  title: "Votre métier face à l'IA",
  description: "5 questions, 2 minutes : votre niveau d'exposition à l'IA et un plan d'action adapté à votre métier.",
};

// Seuls les libellés et les notes des tâches partent vers le navigateur (pas les lignes du plan).
export default function DiagnosticPage() {
  return <DiagnosticFlow metiers={metiersPublics()} />;
}
