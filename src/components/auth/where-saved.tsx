"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/session";
import { hasSupabase } from "@/lib/supabase/env";

// Où la progression est enregistrée, selon que l'apprenant est connecté ou non.
// `subject` : « Votre progression est », « Vos saisies sont »…
export function WhereSaved({ subject = "Votre progression est", invite = true }: { subject?: string; invite?: boolean }) {
  const auth = useAuth();
  const pathname = usePathname();
  if (auth.status === "user") return <>{subject} enregistrée{subject.includes("sont") ? "s" : ""} dans votre compte.</>;
  const plural = subject.includes("sont") ? "s" : "";
  return (
    <>
      {subject} enregistrée{plural} sur cet appareil, dans ce navigateur.
      {hasSupabase && invite && auth.status === "anon" && (
        <>
          {" "}
          <Link href={`/connexion?next=${encodeURIComponent(pathname)}`} className="text-primary underline underline-offset-4">
            Créez un compte
          </Link>{" "}
          pour la retrouver sur tous vos appareils.
        </>
      )}
    </>
  );
}
