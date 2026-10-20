-- Sessions en blocs : sous chaque module, des sessions de 15 minutes faites d'une liste
-- ordonnée de blocs typés (format JSON importé depuis l'espace réservé).
-- Fichiers des sessions (données fictives, outils) : stockage « session-files », lisible par tous.
-- Mesure anonyme : session commencée / terminée, durée réelle, gain mesuré.

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  number int not null check (number >= 1),
  title text not null,
  duration_min int not null default 15,
  -- La session complète, telle qu'importée : titre, durée, date de mise à jour, blocs, consignes par outil d'IA.
  content jsonb not null,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, number)
);
create index on public.sessions (module_id, number);
create trigger sessions_touch before update on public.sessions for each row execute function public.touch_updated_at();

alter table public.sessions enable row level security;
create policy "lecture publique ou admin" on public.sessions for select
  using ((status = 'published' and public.module_is_public(module_id)) or public.is_admin());
create policy "écriture admin" on public.sessions for all using (public.is_admin()) with check (public.is_admin());

/* ------------------------------------------------------------------ */
/* Fichiers des sessions                                              */
/* ------------------------------------------------------------------ */
-- Chemin : <formation>/<module>/<session>/<nom-du-fichier>. Lecture publique (données fictives
-- et modèles d'outils), écriture réservée aux administrateurs.

insert into storage.buckets (id, name, public)
values ('session-files', 'session-files', true)
on conflict (id) do update set public = true;

create policy "fichiers de session : ajout admin" on storage.objects for insert to authenticated
  with check (bucket_id = 'session-files' and public.is_admin());
create policy "fichiers de session : modification admin" on storage.objects for update to authenticated
  using (bucket_id = 'session-files' and public.is_admin());
create policy "fichiers de session : suppression admin" on storage.objects for delete to authenticated
  using (bucket_id = 'session-files' and public.is_admin());

/* ------------------------------------------------------------------ */
/* Mesure anonyme                                                     */
/* ------------------------------------------------------------------ */
-- Aucun lien avec un compte : un identifiant tiré au hasard dans le navigateur (visitor),
-- qui permet seulement de compter les apprenants distincts. Écriture par tous, lecture admin.

create table public.session_events (
  id bigint generated always as identity primary key,
  visitor uuid not null,
  session_key text not null check (char_length(session_key) <= 200),
  event text not null check (event in ('started', 'completed')),
  duration_sec int check (duration_sec between 0 and 86400),
  gain_sec int check (gain_sec between 0 and 86400),
  found int check (found between 0 and 100),
  expected int check (expected between 0 and 100),
  created_at timestamptz not null default now()
);
create index on public.session_events (session_key, event);

alter table public.session_events enable row level security;
create policy "envoyer une mesure" on public.session_events for insert to anon, authenticated with check (true);
create policy "lecture admin" on public.session_events for select using (public.is_admin());

-- Tableau de bord de l'espace réservé : une ligne par session.
create or replace view public.session_stats with (security_invoker = true) as
select
  session_key,
  count(distinct visitor) filter (where event = 'started') as started,
  count(distinct visitor) filter (where event = 'completed') as completed,
  round(avg(duration_sec) filter (where event = 'completed'))::int as avg_duration_sec,
  round(avg(gain_sec) filter (where event = 'completed' and gain_sec is not null))::int as avg_gain_sec,
  round(avg(found::numeric / nullif(expected, 0)) filter (where event = 'completed') * 100)::int as avg_score_pct
from public.session_events
group by session_key;
