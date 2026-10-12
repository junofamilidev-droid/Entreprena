"use client";

// Session de l'apprenant côté navigateur : un seul abonnement aux changements de Supabase,
// partagé par tous les composants (useAuth).

import { useEffect, useState, useSyncExternalStore } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { hasSupabase } from "@/lib/supabase/env";

export type AuthState = { status: "loading" } | { status: "anon" } | { status: "user"; user: User };

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  client ??= createClient();
  return client;
}

let state: AuthState = hasSupabase ? { status: "loading" } : { status: "anon" };
const listeners = new Set<() => void>();
let started = false;

function start() {
  if (started || !hasSupabase) return;
  started = true;
  supabase().auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    if (!user && state.status === "anon") return;
    state = user ? { status: "user", user } : { status: "anon" };
    listeners.forEach((l) => l());
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => listeners.delete(listener);
}

const SERVER: AuthState = hasSupabase ? { status: "loading" } : { status: "anon" };

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}

/** Nom affiché : celui donné à l'inscription, sinon le début de l'adresse email. */
export function displayName(user: User) {
  const name = (user.user_metadata?.display_name as string | undefined)?.trim();
  return name || (user.email ?? "").split("@")[0];
}

/** Le compte connecté est-il administrateur ? (affichage seulement : la base vérifie elle-même) */
export function useIsAdmin(): boolean {
  const auth = useAuth();
  const id = auth.status === "user" ? auth.user.id : null;
  const [admin, setAdmin] = useState<{ id: string; value: boolean } | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    supabase()
      .rpc("is_admin")
      .then(({ data }) => alive && setAdmin({ id, value: data === true }));
    return () => {
      alive = false;
    };
  }, [id]);
  return Boolean(id && admin?.id === id && admin.value);
}
