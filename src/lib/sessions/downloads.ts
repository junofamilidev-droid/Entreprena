"use client";

import { saveStep, useProgress } from "@/lib/progress/store";

// Outils téléchargés par l'apprenant, du plus récent au plus ancien : rangés avec sa progression
// (donc dans son compte quand il est connecté), affichés sur l'accueil.

const KEY = "boite-a-outils";

export interface Download {
  name: string;
  href: string;
  /** D'où vient l'outil : « Module 1 · session 1 : … ». */
  source: string;
  at: string;
}

export function useDownloads(): Download[] {
  const list = useProgress()[KEY]?.inputs?.telechargements;
  return Array.isArray(list) ? (list as unknown as Download[]) : [];
}

export function recordDownload(item: Omit<Download, "at">, current: Download[]) {
  const next = [{ ...item, at: String(Date.now()) }, ...current.filter((d) => d.name !== item.name)].slice(0, 12);
  saveStep(KEY, { inputs: { telechargements: next as unknown as Record<string, string>[] } });
}
