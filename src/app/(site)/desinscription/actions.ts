"use server";

import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { jetonValide } from "@/lib/emails/envois";

// Désinscription depuis un email : lien signé, propre à l'adresse et au type d'email.
// « conseils » : plus aucun conseil du diagnostic ; « ouverture:<clé> » : plus d'annonce pour cette formation.
export async function desinscrire(entree: unknown): Promise<{ ok: boolean }> {
  const p = z.object({ e: z.string().max(400), s: z.string().max(80), t: z.string().max(64) }).safeParse(entree);
  if (!p.success) return { ok: false };
  let email: string;
  try {
    email = Buffer.from(p.data.e, "base64url").toString("utf8");
  } catch {
    return { ok: false };
  }
  if (!jetonValide(`${p.data.s}:${email}`, p.data.t)) return { ok: false };
  const db = adminClient();
  if (!db) return { ok: false };
  if (p.data.s === "conseils") {
    await db.from("diagnostics_metier").update({ desinscrit_at: new Date().toISOString() }).eq("email", email).is("desinscrit_at", null);
  } else if (p.data.s.startsWith("ouverture:")) {
    await db.from("notifications_metier").delete().eq("email", email).eq("metier", p.data.s.slice("ouverture:".length));
  } else return { ok: false };
  return { ok: true };
}
