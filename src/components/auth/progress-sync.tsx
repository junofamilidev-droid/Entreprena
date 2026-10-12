"use client";

import * as React from "react";
import { hasSupabase } from "@/lib/supabase/env";
import { supabase } from "@/lib/auth/session";
import { onHide, startSync, stopSync } from "@/lib/progress/sync";

// Branche la progression sur le compte de l'apprenant connecté. Ne rend rien.
export function ProgressSync() {
  React.useEffect(() => {
    if (!hasSupabase) return;
    const client = supabase();
    let current: string | null = null;
    const { data } = client.auth.onAuthStateChange((event, session) => {
      const id = session?.user.id ?? null;
      if (id && id !== current) {
        current = id;
        // Hors du rappel : Supabase déconseille d'y attendre d'autres appels.
        setTimeout(() => void startSync(client, id), 0);
      } else if (!id && current) {
        current = null;
        stopSync({ clear: event === "SIGNED_OUT" });
      }
    });
    const hide = () => document.visibilityState === "hidden" && onHide();
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", onHide);
    return () => {
      data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", onHide);
      stopSync({ clear: false });
    };
  }, []);
  return null;
}
