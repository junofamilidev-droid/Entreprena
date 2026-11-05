-- « Donner mon avis » : avis des apprenants, en message libre ou en questionnaire guidé.
-- Un avis est toujours rattaché au compte qui l'envoie (pas d'anonymat). Chacun ne lit que
-- les siens ; l'administrateur lit tout et ne peut changer que le statut. Personne ne supprime
-- un avis depuis le site. Les contrôles sont faits à l'envoi (zod, côté serveur) ET ici, pour
-- qu'un envoi qui contournerait la page soit refusé de la même façon.

-- L'ancienne table « feedback » (vide, structure différente) est remplacée.
drop table if exists public.feedback cascade;

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  formation_id uuid references public.formations (id) on delete set null,
  mode text not null check (mode in ('libre', 'formulaire')),
  type text check (type is null or type in ('probleme', 'erreur', 'idee', 'autre')),
  message text check (message is null or char_length(message) between 10 and 4000),
  answers jsonb check (answers is null or (jsonb_typeof(answers) = 'object' and pg_column_size(answers) < 40000)),
  reco smallint check (reco is null or reco between 0 and 10),
  page_origine text check (page_origine is null or char_length(page_origine) <= 300),
  statut text not null default 'nouveau' check (statut in ('nouveau', 'lu', 'traite')),
  created_at timestamptz not null default now(),
  check (
    (mode = 'libre' and message is not null and answers is null and reco is null)
    or (mode = 'formulaire' and answers is not null and message is null and type is null and reco is not null)
  )
);

create index feedback_recent on public.feedback (created_at desc);
create index feedback_user_recent on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;

create policy "avis : envoyer le sien" on public.feedback for insert to authenticated
  with check (user_id = auth.uid());
create policy "avis : lire les siens, ou tout pour l'admin" on public.feedback for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "avis : statut modifié par l'admin" on public.feedback for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Seul le statut est modifiable, et rien n'est accessible sans compte.
revoke all on public.feedback from anon;
revoke update, delete, truncate on public.feedback from authenticated;
grant select, insert on public.feedback to authenticated;
grant update (statut) on public.feedback to authenticated;

-- Contrôles à l'enregistrement : limite d'envois, valeurs du questionnaire.
create or replace function public.feedback_check() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  k text;
  v jsonb;
begin
  if tg_op = 'INSERT' then
    new.statut := 'nouveau';
    new.created_at := now();
    if (select count(*) from public.feedback
        where user_id = new.user_id and created_at > now() - interval '1 hour') >= 5 then
      raise exception 'avis_limite' using errcode = 'P0001',
        hint = 'Cinq avis au maximum par heure.';
    end if;
  end if;

  if new.mode = 'formulaire' then
    -- La note de recommandation est obligatoire et recopiée dans « reco ».
    if jsonb_typeof(new.answers -> 'q_reco') is distinct from 'number'
       or (new.answers ->> 'q_reco')::numeric <> new.reco then
      raise exception 'avis_reco' using errcode = '23514';
    end if;
    -- Trois formats au maximum.
    if new.answers ? 'q_formats_souhaites' and (
         jsonb_typeof(new.answers -> 'q_formats_souhaites') <> 'array'
         or jsonb_array_length(new.answers -> 'q_formats_souhaites') > 3) then
      raise exception 'avis_formats' using errcode = '23514';
    end if;
    -- Prix : « refus », ou un entier de 0 à 500 par pas de 10.
    foreach k in array array['prix_general', 'prix_ici'] loop
      v := new.answers -> k;
      if v is not null and not (
           v = '"refus"'::jsonb
           or (jsonb_typeof(v) = 'number' and (v #>> '{}')::numeric between 0 and 500
               and (v #>> '{}')::numeric % 10 = 0)) then
        raise exception 'avis_prix' using errcode = '23514';
      end if;
    end loop;
  end if;
  return new;
end $$;

create trigger feedback_check before insert or update on public.feedback
  for each row execute function public.feedback_check();

-- Pour l'onglet « Avis » : nom et adresse des auteurs, lisibles par l'administrateur seulement.
create or replace function public.feedback_authors()
returns table (user_id uuid, email text, display_name text)
language sql stable security definer set search_path = public as $$
  select u.id, u.email::text, p.display_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where public.is_admin() and u.id in (select f.user_id from public.feedback f);
$$;
revoke all on function public.feedback_authors() from public, anon;
grant execute on function public.feedback_authors() to authenticated;
