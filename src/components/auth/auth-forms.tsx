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
  const [error, setError] = React.useState<string | null>(params.get("erreur") === "lien" ? "Ce lien n'est plus valable. Demandez un nouveau code." : null);
  // Connexion sans mot de passe : 1. l'email, 2. le code à 6 chiffres reçu (le lien de l'email marche aussi).
  // Le mot de passe reste possible en secours (administrateur, ou compte qui en a créé un).
  const [mode, setMode] = React.useState<"code" | "motdepasse">("code");
  const [codeEnvoyeA, setCodeEnvoyeA] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (auth.status === "user") router.replace(next);
  }, [auth.status, next, router]);

  if (!hasSupabase) return <AccountsClosed />;

  async function envoyerCode(form: FormData) {
    const email = String(form.get("email")).trim();
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.signInWithOtp({
      email,
      // Pas de création de compte ici : un compte naît d'un achat ou d'un accès offert.
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) {
      const m = (error.message ?? "").toLowerCase();
      if (m.includes("signups not allowed") || m.includes("not found") || m.includes("user not found"))
        return setError("Aucun compte n'existe avec cette adresse. Utilisez l'email saisi lors de votre achat.");
      return setError(authMessage(error));
    }
    setCodeEnvoyeA(email);
  }

  async function verifierCode(form: FormData) {
    if (!codeEnvoyeA) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.verifyOtp({ email: codeEnvoyeA, token: String(form.get("code")).replace(/\s/g, ""), type: "email" });
    setBusy(false);
    if (error) return setError("Ce code n'est pas valable ou a expiré. Vérifiez-le, ou demandez-en un nouveau.");
    toast.success("Vous êtes connecté.");
  }

  async function signIn(form: FormData) {
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (error) return setError(authMessage(error));
    toast.success("Vous êtes connecté.");
  }

  const basculer = (
    <button
      type="button"
      onClick={() => {
        setMode(mode === "code" ? "motdepasse" : "code");
        setCodeEnvoyeA(null);
        setError(null);
      }}
      className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
    >
      {mode === "code" ? "Se connecter avec un mot de passe" : "Recevoir un code par email"}
    </button>
  );
  const pasDeCompte = (
    <p className="border-t pt-5 text-sm text-muted-foreground">
      Pas encore de compte ?{" "}
      <Link href="/formations" className="font-medium text-foreground underline underline-offset-4">
        Découvrir les formations
      </Link>
    </p>
  );

  if (mode === "motdepasse")
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
        {basculer}
        {pasDeCompte}
      </div>
    );

  if (codeEnvoyeA)
    return (
      <div className="space-y-6">
        <form onSubmit={submitWith(verifierCode)} className="space-y-5">
          <p className="text-body text-muted-foreground" role="status">
            Un code à 6 chiffres vient de partir vers <span className="font-medium text-foreground">{codeEnvoyeA}</span>. Pensez à regarder dans les indésirables.
          </p>
          <Field id="code" label="Code reçu par email" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,8}" maxLength={8} required autoFocus />
          <ErrorLine message={error} />
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Vérification…" : "Se connecter"}
          </Button>
        </form>
        <button type="button" onClick={() => setCodeEnvoyeA(null)} className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
          Changer d&apos;adresse ou renvoyer un code
        </button>
        {pasDeCompte}
      </div>
    );

  return (
    <div className="space-y-6">
      <form onSubmit={submitWith(envoyerCode)} className="space-y-5">
        <Field id="email" label="Adresse email" type="email" autoComplete="email" required hint={<span className="text-caption text-muted-foreground">celle de votre achat</span>} />
        <ErrorLine message={error} />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Envoi…" : "Recevoir un code de connexion"}
        </Button>
      </form>
      {basculer}
      {pasDeCompte}
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
