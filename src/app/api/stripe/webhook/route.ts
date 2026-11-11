import { NextResponse, type NextRequest } from "next/server";
import { signatureValide, type CheckoutSession } from "@/lib/stripe";
import { enregistrerAchat } from "@/lib/acces/apres-paiement";

// Stripe prévient aussi le site directement quand un paiement est confirmé : l'accès est ouvert
// même si l'acheteur ferme sa fenêtre avant de revenir sur le site. Secret : STRIPE_WEBHOOK_SECRET.

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ erreur: "non configuré" }, { status: 503 });
  const corps = await request.text();
  if (!signatureValide(corps, request.headers.get("stripe-signature"), secret)) return NextResponse.json({ erreur: "signature" }, { status: 400 });
  const evenement = JSON.parse(corps) as { type: string; data: { object: CheckoutSession } };
  if (evenement.type === "checkout.session.completed" || evenement.type === "checkout.session.async_payment_succeeded") {
    try {
      await enregistrerAchat(evenement.data.object);
    } catch {
      return NextResponse.json({ erreur: "enregistrement" }, { status: 500 }); // Stripe réessaiera
    }
  }
  return NextResponse.json({ recu: true });
}
