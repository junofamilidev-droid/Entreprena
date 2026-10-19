"use client";

import { useSyncExternalStore } from "react";
import type { AiToolId } from "./types";

// Outil d'IA que l'apprenant a le droit d'utiliser, choisi au premier lancement d'une session.
// Enregistré dans le navigateur ; modifiable à tout moment.

export type AiChoice = AiToolId | "autre";

export const AI_CHOICES: { id: AiChoice; label: string; hint: string }[] = [
  { id: "claude", label: "Claude", hint: "Anthropic" },
  { id: "chatgpt", label: "ChatGPT", hint: "OpenAI" },
  { id: "copilot", label: "Microsoft Copilot", hint: "Microsoft 365" },
  { id: "lechat", label: "Le Chat", hint: "Mistral AI" },
  { id: "autre", label: "Un autre outil", hint: "Outil interne ou autre" },
];

const KEY = "outil-ia:v1";
const listeners = new Set<() => void>();

function read(): AiChoice | null {
  try {
    const v = localStorage.getItem(KEY);
    return AI_CHOICES.some((c) => c.id === v) ? (v as AiChoice) : null;
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** `undefined` tant que le navigateur n'a pas été lu (rendu serveur). */
export function useAiTool(): AiChoice | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}

export function setAiTool(choice: AiChoice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    // Navigation privée : le choix ne dure que le temps de la page.
  }
  listeners.forEach((l) => l());
}

export function aiLabel(choice: AiChoice) {
  return AI_CHOICES.find((c) => c.id === choice)?.label ?? "votre outil";
}
