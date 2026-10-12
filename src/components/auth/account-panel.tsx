"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { hasSupabase } from "@/lib/supabase/env";
import { displayName, supabase, useAuth } from "@/lib/auth/session";
import { flushProgress } from "@/lib/progress/sync";
import { useProgress } from "@/lib/progress/store";
import { AccountsClosed, authMessage, MIN_PASSWORD, submitWith } from "./auth-forms";

function Section({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <section className={`space-y-4 rounded-lg border bg-card p-5 sm:p-6 ${highlight ? "border-primary ring-2 ring-primary/15" : ""}`}>
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function AccountPanel() {
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();
  const progress = useProgress();
  const resetting = params.get("nouveau-mot-de-passe") === "1";
  const [busy, setBusy] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (auth.status === "anon" && hasSupabase) router.replace("/connexion?next=/compte");
  }, [auth.status, router]);

  if (!hasSupabase) return <AccountsClosed />;
  if (auth.status !== "user") return <Skeleton className="h-64 w-full" />;
  const user = auth.user;
  const steps = Object.values(progress);
  const done = steps.filter((s) => s.done).length;

  async function saveName(form: FormData) {
    setBusy("name");
    const { error } = await supabase().auth.updateUser({ data: { display_name: String(form.get("name")).trim() } });
    setBusy(null);
    if (error) toast.error(authMessage(error));
    else toast.success("Nom enregistré.");
  }

  async function savePassword(form: FormData) {
    const password = String(form.get("new-password"));
    if (password.length < MIN_PASSWORD) return setPasswordError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`);
    setBusy("password");
    setPasswordError(null);
    const { error } = await supabase().auth.updateUser({ password });
    setBusy(null);
    if (error) return setPasswordError(authMessage(error));
    toast.success("Mot de passe modifié.");
    if (resetting) router.replace("/compte");
  }

  async function signOut() {
    setBusy("out");
    await flushProgress();
    await supabase().auth.signOut();
    toast.success("Vous êtes déconnecté. Votre progression reste dans votre compte.");
    router.replace("/");
  }

  return (
    <div className="space-y-6">
      {resetting && (
        <Section title="Choisissez un nouveau mot de passe" highlight>
          <PasswordForm busy={busy === "password"} error={passwordError} onSubmit={savePassword} autoFocus />
        </Section>
      )}

      <Section title="Mon profil">
        <form onSubmit={submitWith(saveName)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Prénom et nom</Label>
            <Input id="name" name="name" defaultValue={displayName(user)} autoComplete="name" className="bg-card" required />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Adresse email</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button type="submit" variant="outline" disabled={busy === "name"}>
            Enregistrer
          </Button>
        </form>
      </Section>

      <Section title="Ma progression">
        <p className="text-body text-muted-foreground">
          {steps.length === 0
            ? "Vous n'avez pas encore commencé de formation."
            : `${done} étape${done > 1 ? "s" : ""} terminée${done > 1 ? "s" : ""}, sur ${steps.length} commencée${steps.length > 1 ? "s" : ""}.`}{" "}
          Elle est enregistrée dans votre compte, avec vos saisies d&apos;exercice : vous la retrouvez sur tous vos
          appareils.
        </p>
      </Section>

      {!resetting && (
        <Section title="Mot de passe">
          <PasswordForm busy={busy === "password"} error={passwordError} onSubmit={savePassword} />
        </Section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={signOut} disabled={busy === "out"}>
          Se déconnecter
        </Button>
        <p className="text-caption text-muted-foreground">
          À la déconnexion, votre progression est retirée de cet appareil. Elle reste dans votre compte.
        </p>
      </div>
    </div>
  );
}

function PasswordForm({
  busy,
  error,
  onSubmit,
  autoFocus,
}: {
  busy: boolean;
  error: string | null;
  onSubmit: (form: FormData) => void;
  autoFocus?: boolean;
}) {
  return (
    <form onSubmit={submitWith(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">Nouveau mot de passe</Label>
        <Input
          id="new-password"
          name="new-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          required
          autoFocus={autoFocus}
          className="bg-card"
        />
        <p className="text-caption text-muted-foreground">{MIN_PASSWORD} caractères au moins.</p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        Changer le mot de passe
      </Button>
    </form>
  );
}
