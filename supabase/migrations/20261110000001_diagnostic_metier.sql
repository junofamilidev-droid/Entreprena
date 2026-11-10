-- Diagnostic « Votre métier face à l'IA » (page /diagnostic).
-- Aucun accès direct du public : tout passe par les Server Actions du site, avec la clé secrète
-- (côté serveur uniquement). Lecture réservée aux administrateurs (onglet « Diagnostics »).

create table public.diagnostics_metier (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  metier text not null check (char_length(metier) <= 40),
  metier_autre text check (char_length(metier_autre) <= 60),
  taches text[] not null check (cardinality(taches) between 1 and 3),
  frequence_ia text not null check (frequence_ia in ('jamais', 'mois', 'semaine', 'jour')),
  cadre text not null check (cadre in ('outil', 'autorise', 'interdit', 'ne_sait_pas')),
  objectif text not null check (objectif in ('temps', 'indispensable', 'evoluer', 'comprendre')),
  score int not null check (score between 0 and 100),
  niveau text not null check (niveau in ('moderee', 'marquee', 'forte')),
  preparation text not null check (preparation in ('a_construire', 'en_cours', 'avancee')),
  email text check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consentement_emails boolean not null default false,
  consentement_at timestamptz,
  utm_source text check (char_length(utm_source) <= 100),
  utm_medium text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  a_clique_formation boolean not null default false,
  j2_sent_at timestamptz,
  j5_sent_at timestamptz,
  desinscrit_at timestamptz
);
create index on public.diagnostics_metier (created_at);
create index on public.diagnostics_metier (metier);

create table public.notifications_metier (
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  metier text not null check (char_length(metier) <= 60),
  created_at timestamptz not null default now(),
  primary key (email, metier)
);

-- Mesure sans cookie : démarrages, questions vues, résultats, emails, clics.
create table public.diagnostic_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event text not null check (event in ('start', 'question', 'result', 'email', 'notify', 'cta_formation')),
  question int check (question between 1 and 5),
  metier text check (char_length(metier) <= 40),
  niveau text check (char_length(niveau) <= 20),
  utm_source text check (char_length(utm_source) <= 100)
);
create index on public.diagnostic_events (event, created_at);

-- Limite de 10 diagnostics par heure et par visiteur. On ne garde qu'une empreinte brouillée de
-- l'adresse IP (jamais l'adresse elle-même), supprimée au bout de 24 h.
create table public.diagnostic_rate (
  empreinte text not null,
  created_at timestamptz not null default now()
);
create index on public.diagnostic_rate (empreinte, created_at);

alter table public.diagnostics_metier enable row level security;
alter table public.notifications_metier enable row level security;
alter table public.diagnostic_events enable row level security;
alter table public.diagnostic_rate enable row level security;

create policy "lecture admin" on public.diagnostics_metier for select using (public.is_admin());
create policy "lecture admin" on public.notifications_metier for select using (public.is_admin());
create policy "lecture admin" on public.diagnostic_events for select using (public.is_admin());
-- diagnostic_rate : aucune règle, donc aucun accès hors clé secrète.
