"use client";

// Progression de l'apprenant, enregistrée dans le navigateur (localStorage).
// Elle sera remplacée par la base de données quand les comptes seront ouverts ;
// l'interface (useProgress, saveStep) restera la même.

import { useSyncExternalStore } from "react";

export interface StepProgress {
  /** Dernier écran affiché. */
  screen: number;
  done: boolean;
  /** Réponses aux questions de vérification : index de question -> option choisie. */
  answers?: Record<number, number>;
  updatedAt: number;
}

export type ProgressState = Record<string, StepProgress>;

const KEY = "progression:v1";
const EMPTY: ProgressState = {};
const listeners = new Set<() => void>();
let cache: ProgressState | null = null;

function read(): ProgressState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as ProgressState) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: ProgressState) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Stockage indisponible (navigation privée) : la progression reste en mémoire.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function stepKey(formationSlug: string, moduleSlug: string, stepSlug: string) {
  return `${formationSlug}/${moduleSlug}/${stepSlug}`;
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Vrai une fois la progression lue dans le navigateur (évite d'afficher un état vide à tort). */
export function useProgressReady(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function saveStep(key: string, patch: Partial<StepProgress>) {
  const state = read();
  const prev = state[key] ?? { screen: 0, done: false, updatedAt: 0 };
  write({ ...state, [key]: { ...prev, ...patch, updatedAt: Date.now() } });
}

export function resetProgress(prefix: string) {
  const state = read();
  write(Object.fromEntries(Object.entries(state).filter(([k]) => !k.startsWith(prefix))));
}

/** Étape à reprendre dans une liste ordonnée : la première non terminée. */
export function resumeIndex(state: ProgressState, keys: string[]): number {
  const i = keys.findIndex((k) => !state[k]?.done);
  return i === -1 ? keys.length - 1 : i;
}
