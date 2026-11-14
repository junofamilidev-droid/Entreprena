import { NextResponse, type NextRequest } from "next/server";
import { envoyerConseils } from "@/lib/emails/envois";

// Envoi quotidien des conseils du diagnostic (J+2 et J+5), lancé par Vercel (voir vercel.json).
// Vercel envoie « Authorization: Bearer <CRON_SECRET> » : sans ce secret, personne d'autre ne peut le déclencher.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });
  const conseil1 = await envoyerConseils(1);
  const conseil2 = await envoyerConseils(2);
  return NextResponse.json({ conseil1: conseil1.envoyes, conseil2: conseil2.envoyes });
}
