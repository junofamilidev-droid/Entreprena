import type { ProgressState } from "@/lib/progress/store";

/** Clé de progression d'une session : « formation/module/session-1 ». */
export function sessionKey(formation: string, module: string, n: number) {
  return `${formation}/${module}/session-${n}`;
}

/** Temps gagné cumulé sur toutes les sessions, en secondes. */
export function totalSavedSec(progress: ProgressState) {
  let total = 0;
  for (const [key, p] of Object.entries(progress)) {
    if (!/\/session-\d+$/.test(key)) continue;
    const v = Number(p.inputs?.gain_sec);
    if (Number.isFinite(v) && v > 0) total += v;
  }
  return total;
}

/** « 12 min 05 s », « 1 h 04 min », « 45 s ». */
export function formatSeconds(sec: number) {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${String(s % 60).padStart(2, "0")} s`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
}
