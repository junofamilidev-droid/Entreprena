"use client";

// Synchronisation de la progression avec le compte de l'apprenant.
// - À la connexion : la progression du compte et celle de l'appareil sont fusionnées
//   (la plus récente gagne, étape par étape), puis l'appareil envoie ce qu'il a de plus récent.
// - Ensuite : chaque modification est envoyée au compte, regroupée par étape (une écriture
//   au plus toutes les 800 ms pendant la frappe).
// - À la déconnexion : la copie locale est effacée, pour ne rien laisser sur un appareil partagé.

import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { mergeProgress, readProgress, replaceProgress, setRemote, type ProgressState, type StepProgress } from "./store";

const TABLE = "learner_progress";
const DELAY = 800;

let sb: SupabaseClient | null = null;
let userId: string | null = null;
const pending = new Map<string, StepProgress>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let warned = false;

function warn() {
  if (warned) return;
  warned = true;
  toast.error("Votre progression n'a pas pu être enregistrée dans votre compte. Elle reste sur cet appareil.");
}

// Clés acceptées par la base (« formation/module/étape ») ; les autres restent sur l'appareil.
const KEY_FORMAT = /^[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/;

function row(key: string, value: StepProgress) {
  return { user_id: userId, step_key: key, data: value, updated_at: new Date(value.updatedAt).toISOString() };
}

async function push(keys: string[]) {
  if (!sb || !userId || keys.length === 0) return;
  const rows = keys.flatMap((k) => (pending.has(k) && KEY_FORMAT.test(k) ? [row(k, pending.get(k)!)] : []));
  keys.forEach((k) => {
    pending.delete(k);
    clearTimeout(timers.get(k));
    timers.delete(k);
  });
  if (rows.length === 0) return;
  const { error } = await sb.from(TABLE).upsert(rows, { onConflict: "user_id,step_key" });
  if (error) warn();
}

/** Envoie tout de suite les modifications en attente (avant une déconnexion, par exemple). */
export function flushProgress() {
  return push([...pending.keys()]);
}

function connect(client: SupabaseClient, id: string) {
  sb = client;
  userId = id;
  setRemote({
    save(key, value) {
      pending.set(key, value);
      clearTimeout(timers.get(key));
      timers.set(key, setTimeout(() => void push([key]), DELAY));
    },
    remove(keys) {
      keys.forEach((k) => pending.delete(k));
      void client
        .from(TABLE)
        .delete()
        .in("step_key", keys)
        .then(({ error }) => error && warn());
    },
  });
}

export async function startSync(client: SupabaseClient, id: string) {
  const { data, error } = await client.from(TABLE).select("step_key, data");
  if (error) {
    warn();
    return;
  }
  const account: ProgressState = Object.fromEntries((data ?? []).map((r) => [r.step_key as string, r.data as StepProgress]));
  const { merged, toPush } = mergeProgress(readProgress(), account);
  replaceProgress(merged);
  connect(client, id);
  toPush.forEach((k) => pending.set(k, merged[k]));
  await push(toPush);
}

export function stopSync({ clear }: { clear: boolean }) {
  setRemote(null);
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  pending.clear();
  userId = null;
  if (clear) replaceProgress({});
}

/** Envoi des modifications en attente quand l'onglet passe en arrière-plan ou se ferme. */
export function onHide() {
  if (pending.size) void flushProgress();
}
