"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { hasSupabase } from "@/lib/supabase/env";
import { supabase, useAuth } from "@/lib/auth/session";

export const MIN_PASSWORD = 8;

/** Messages de Supabase traduits pour l'apprenant. */
export function authMessage(error: { message?: string; status?: number; code?: string }) {
  const m = (error.message ?? "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Confirmez d'abord votre adresse : ouvrez le lien reçu par email.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Un compte existe déjà avec cette adresse. Connectez-vous.";
  if (m.includes("password should be") || m.includes("weak")) return `Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`;
  if (m.includes("same password") || m.includes("different from the old")) return "Choisissez un mot de passe différent de l'ancien.";
  if (error.status === 429 || m.includes("rate limit")) return "Trop de tentatives. Réessayez dans quelques minutes.";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "Cette adresse email n'est pas valide.";
  return "Une erreur est survenue. Réessayez dans un instant.";
}

/**
 * Soumission sans recharger la page. On n'utilise pas `<form action>` : React y vide le formulaire
 * après chaque envoi, et l'apprenant perdrait son email après un mot de passe erroné.
 */
export function submitWith(handler: (form: FormData) => unknown) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handler(new FormData(event.currentTarget));
  };
}

/** Adresse de retour : une page du site uniquement. */
function safeNext(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/app";
}

function Field({
  id,
  label,
  hint,
  ...props
}: React.ComponentProps<typeof Input> & { id: string; label: string; hint?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {hint}
      </div>
      <Input id={id} name={id} className="h-10 rounded-xl border-transparent bg-foreground/[0.05] focus-visible:bg-background" {...props} />
    </div>
  );
}

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function AccountsClosed() {
  return (
    <Alert>
      <AlertDescription>
        Les comptes ne sont pas encore ouverts sur cette version de test. Votre progression reste enregistrée sur cet
        appareil.
      </AlertDescription>
    </Alert>
  );
}

/* ---------------- Connexion et inscription ---------------- */

export function SignInPanel() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const auth = useAuth();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(params.get("erreur") === "lien" ? "Ce lien n'est plus valable. Recommencez la démarche." : null);
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (auth.status === "user" && !sentTo) router.replace(next);
  }, [auth.status, next, router, sentTo]);

  if (!hasSupabase) return <AccountsClosed />;

  async function signIn(form: FormData) {
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (error) return setError(authMessage(error));
    toast.success("Vous êtes connecté. Votre progression est rattachée à votre compte.");
  }

  if (sentTo) {
    return (
      <div className="space-y-4" role="status">
        <h2 className="text-heading">Confirmez votre adresse</h2>
        <p className="text-body text-muted-foreground">
          Un email vient de partir vers <span className="font-medium text-foreground">{sentTo}</span>. Ouvrez le lien
          qu&apos;il contient pour activer votre compte. Pensez à regarder dans les indésirables.
        </p>
        <Button variant="outline" onClick={() => setSentTo(null)}>
          Revenir à la connexion
        </Button>
      </div>
    );
  }

  // Pas d'inscription libre : un compte est créé par un achat, ou par un accès offert depuis l'espace réservé.
  return (
    <div className="space-y-6">
      <form onSubmit={submitWith(signIn)} className="space-y-5">
        <Field id="email" label="Adresse email" type="email" autoComplete="email" required />
        <Field
          id="password"
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          required
          hint={
            <Link href="/app/mot-de-passe-oublie" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Mot de passe oublié ?
            </Link>
          }
        />
        <ErrorLine message={error} />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Première connexion après un achat ? Cliquez sur « Mot de passe oublié » pour créer votre mot de passe.
      </p>
      <p className="border-t pt-5 text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/formations" className="font-medium text-foreground underline underline-offset-4">
          Découvrir les formations
        </Link>
      </p>
    </div>
  );
}

/* ---------------- Mot de passe oublié ---------------- */

export function ForgotPasswordForm() {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  if (!hasSupabase) return <AccountsClosed />;

  async function send(form: FormData) {
    setBusy(true);
    setError(null);
    const email = String(form.get("email")).trim();
    const { error } = await supabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/app/compte?nouveau-mot-de-passe=1")}`,
    });
    setBusy(false);
    if (error) return setError(authMessage(error));
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <p role="status" className="text-body text-muted-foreground">
        Si un compte existe pour <span className="font-medium text-foreground">{sentTo}</span>, un email vient de partir
        avec un lien pour choisir un nouveau mot de passe.
      </p>
    );
  }
  return (
    <form onSubmit={submitWith(send)} className="space-y-5">
      <Field id="email" label="Adresse email" type="email" autoComplete="email" required />
      <ErrorLine message={error} />
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Envoi…" : "Recevoir un lien"}
      </Button>
    </form>
  );
}
