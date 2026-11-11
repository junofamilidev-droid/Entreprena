-- Accès aux formations : achats (Stripe) et accès offerts (testeurs), un par compte et par formation.
-- Écriture uniquement côté serveur (clé secrète). Chaque apprenant lit ses propres accès ; l'admin lit tout.

create table public.acces (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  formation_slug text not null check (char_length(formation_slug) <= 80),
  origine text not null check (origine in ('achat', 'offert')),
  stripe_session_id text unique,
  montant_cents int check (montant_cents >= 0),
  -- Renoncement au droit de rétractation (accès immédiat à un contenu numérique), horodaté.
  renonciation_at timestamptz,
  -- Connexion automatique après paiement : une seule fois, peu après l'achat.
  connexion_utilisee_at timestamptz,
  revoque_at timestamptz,
  unique (user_id, formation_slug)
);
create index on public.acces (formation_slug);

alter table public.acces enable row level security;
create policy "mes accès" on public.acces for select using (user_id = auth.uid());
create policy "lecture admin" on public.acces for select using (public.is_admin());

-- Retrouver un compte par son email (création d'un accès offert ou après un achat).
-- Réservé à la clé secrète du serveur : ni les visiteurs ni les apprenants ne peuvent l'appeler.
create or replace function public.utilisateur_par_email(e text) returns uuid
language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(e) limit 1;
$$;
revoke execute on function public.utilisateur_par_email(text) from public, anon, authenticated;
