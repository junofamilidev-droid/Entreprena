-- Schéma de la plateforme.
-- Contenu : formations > modules > étapes, et un diagnostic par formation.
-- Apprenants : progression, saisies d'exercice, résultats de diagnostic, retours.
-- Sécurité : chaque table a des règles d'accès (RLS). Un apprenant ne voit que ses données ;
-- seul un compte inscrit dans `admins` peut lire les brouillons et modifier le contenu.

create extension if not exists pgcrypto;

create type public.publication_status as enum ('draft', 'published');
create type public.module_availability as enum ('open', 'coming_soon');
create type public.step_kind as enum ('lesson', 'quiz', 'exercise', 'self_review', 'module_end');
create type public.step_progress_status as enum ('started', 'completed');

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

/* ------------------------------------------------------------------ */
/* Administration                                                     */
/* ------------------------------------------------------------------ */

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

/* ------------------------------------------------------------------ */
/* Contenu                                                            */
/* ------------------------------------------------------------------ */

create table public.formations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  domain text not null default '',
  audience text not null default '',
  promise text not null default '',
  summary text not null default '',
  for_whom jsonb not null default '[]',
  not_this jsonb not null default '[]',
  method jsonb not null default '[]',
  tutor_url text,
  presale jsonb not null default '{"label": "Préacheter la formation", "available": false}',
  status public.publication_status not null default 'draft',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.formations (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position int not null default 0,
  title text not null,
  summary text not null default '',
  deliverable text not null default '',
  duration_label text,
  availability public.module_availability not null default 'coming_soon',
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (formation_id, slug)
);
create index on public.modules (formation_id, position);

create table public.steps (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position int not null default 0,
  kind public.step_kind not null,
  title text not null,
  content jsonb not null default '{}',
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug)
);
create index on public.steps (module_id, position);

create table public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null unique references public.formations (id) on delete cascade,
  config jsonb not null,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger formations_touch before update on public.formations for each row execute function public.touch_updated_at();
create trigger modules_touch before update on public.modules for each row execute function public.touch_updated_at();
create trigger steps_touch before update on public.steps for each row execute function public.touch_updated_at();
create trigger diagnostics_touch before update on public.diagnostics for each row execute function public.touch_updated_at();

-- Visibilité publique : publié, et toute la chaîne parente publiée.
create or replace function public.formation_is_public(f uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.formations where id = f and status = 'published');
$$;

create or replace function public.module_is_public(m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.modules mo
    join public.formations fo on fo.id = mo.formation_id
    where mo.id = m and mo.status = 'published' and fo.status = 'published'
  );
$$;

alter table public.formations enable row level security;
alter table public.modules enable row level security;
alter table public.steps enable row level security;
alter table public.diagnostics enable row level security;
alter table public.admins enable row level security;

create policy "lecture publique ou admin" on public.formations for select
  using (status = 'published' or public.is_admin());
create policy "lecture publique ou admin" on public.modules for select
  using ((status = 'published' and public.formation_is_public(formation_id)) or public.is_admin());
create policy "lecture publique ou admin" on public.steps for select
  using ((status = 'published' and public.module_is_public(module_id)) or public.is_admin());
create policy "lecture publique ou admin" on public.diagnostics for select
  using ((status = 'published' and public.formation_is_public(formation_id)) or public.is_admin());

create policy "écriture admin" on public.formations for all using (public.is_admin()) with check (public.is_admin());
create policy "écriture admin" on public.modules for all using (public.is_admin()) with check (public.is_admin());
create policy "écriture admin" on public.steps for all using (public.is_admin()) with check (public.is_admin());
create policy "écriture admin" on public.diagnostics for all using (public.is_admin()) with check (public.is_admin());

create policy "un admin se voit" on public.admins for select using (user_id = auth.uid());

/* ------------------------------------------------------------------ */
/* Apprenants                                                         */
/* ------------------------------------------------------------------ */

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.step_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  step_id uuid not null references public.steps (id) on delete cascade,
  status public.step_progress_status not null default 'started',
  screen_index int not null default 0 check (screen_index >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, step_id)
);

create table public.exercise_answers (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  step_id uuid not null references public.steps (id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, step_id)
);

create table public.diagnostic_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  diagnostic_id uuid not null references public.diagnostics (id) on delete cascade,
  answers jsonb not null,
  score int,
  created_at timestamptz not null default now()
);

create trigger step_progress_touch before update on public.step_progress for each row execute function public.touch_updated_at();
create trigger exercise_answers_touch before update on public.exercise_answers for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.step_progress enable row level security;
alter table public.exercise_answers enable row level security;
alter table public.diagnostic_results enable row level security;

create policy "lire mon profil" on public.profiles for select using (id = auth.uid());
create policy "modifier mon profil" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "mes données" on public.step_progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "mes données" on public.exercise_answers for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "mes données" on public.diagnostic_results for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

/* ------------------------------------------------------------------ */
/* Retours des testeurs                                               */
/* ------------------------------------------------------------------ */

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid references public.formations (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  email text check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  answers jsonb not null,
  page text,
  created_at timestamptz not null default now(),
  check (pg_column_size(answers) < 20000)
);

alter table public.feedback enable row level security;

-- Tout visiteur peut envoyer un retour ; seul l'admin les lit.
create policy "envoyer un retour" on public.feedback for insert
  with check (user_id is null or user_id = auth.uid());
create policy "lecture admin" on public.feedback for select using (public.is_admin());
create policy "suppression admin" on public.feedback for delete using (public.is_admin());
