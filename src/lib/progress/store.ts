"use client";

// Progression de l'apprenant, enregistrée dans le navigateur (localStorage).
// Quand l'apprenant est connecté, chaque modification est aussi envoyée à son compte
// (voir sync.ts) : le navigateur sert alors de copie locale.

import { useSyncExternalStore } from "react";
import type { ExerciseInputs } from "@/lib/content/types";

export interface StepProgress {
  /** Dernier écran affiché. */
  screen: number;
  done: boolean;
  /** Réponses aux questions de vérification : index de question -> option choisie. */
  answers?: Record<number, number>;
  /** Saisies d'un exercice guidé, par identifiant de bloc. */
  inputs?: ExerciseInputs;
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

/** Envoi au compte de l'apprenant, branché par la synchronisation quand il est connecté. */
export interface RemoteWriter {
  save: (key: string, value: StepProgress) => void;
  remove: (keys: string[]) => void;
}
let remote: RemoteWriter | null = null;

export function setRemote(writer: RemoteWriter | null) {
  remote = writer;
}

/** Remplace toute la progression locale (fusion avec le compte, ou déconnexion). */
export function replaceProgress(next: ProgressState) {
  write(next);
}

export function readProgress(): ProgressState {
  return read();
}

export function saveStep(key: string, patch: Partial<StepProgress>) {
  const state = read();
  const prev = state[key] ?? { screen: 0, done: false, updatedAt: 0 };
  const value = { ...prev, ...patch, updatedAt: Date.now() };
  write({ ...state, [key]: value });
  remote?.save(key, value);
}

/** Enregistre une saisie d'exercice sans toucher aux autres. */
export function saveInput(key: string, id: string, value: ExerciseInputs[string]) {
  const prev = read()[key];
  saveStep(key, { inputs: { ...prev?.inputs, [id]: value } });
}

export function resetProgress(prefix: string) {
  const state = read();
  const removed = Object.keys(state).filter((k) => k.startsWith(prefix));
  write(Object.fromEntries(Object.entries(state).filter(([k]) => !k.startsWith(prefix))));
  if (removed.length) remote?.remove(removed);
}

/**
 * Fusion de la copie locale et du compte : pour chaque étape, la version la plus récente gagne.
 * `toPush` liste les étapes plus récentes sur l'appareil, à envoyer au compte.
 */
export function mergeProgress(local: ProgressState, account: ProgressState) {
  const merged: ProgressState = { ...account };
  const toPush: string[] = [];
  for (const [key, value] of Object.entries(local)) {
    const other = account[key];
    if (!other || value.updatedAt > other.updatedAt) {
      merged[key] = value;
      toPush.push(key);
    }
  }
  return { merged, toPush };
}

/** Étape à reprendre dans une liste ordonnée : la première non terminée. */
export function resumeIndex(state: ProgressState, keys: string[]): number {
  const i = keys.findIndex((k) => !state[k]?.done);
  return i === -1 ? keys.length - 1 : i;
}
