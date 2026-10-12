-- Vérifie les règles d'accès. Chaque bloc lève une erreur si une règle est violée.
\set ON_ERROR_STOP on
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.fr'),
  ('00000000-0000-0000-0000-00000000000b', 'alice@test.fr'),
  ('00000000-0000-0000-0000-00000000000c', 'bob@test.fr');
insert into public.admins values ('00000000-0000-0000-0000-00000000000a');

insert into formations (id, slug, title, status) values
  ('10000000-0000-0000-0000-000000000001', 'publiee', 'Publiée', 'published'),
  ('10000000-0000-0000-0000-000000000002', 'brouillon', 'Brouillon', 'draft');
insert into modules (id, formation_id, slug, title, status) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'm1', 'M1', 'published'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'm2', 'M2', 'draft'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'm1', 'M1', 'published');
insert into steps (id, module_id, slug, kind, title, status) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 's1', 'lesson', 'S1', 'published'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 's1', 'lesson', 'S1', 'published');

-- Visiteur anonyme : ne voit que le publié dont toute la chaîne est publiée
set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$ begin
  assert (select count(*) from formations) = 1, 'anon: formations';
  assert (select count(*) from modules) = 1, 'anon: modules';
  assert (select count(*) from steps) = 1, 'anon: steps';
end $$;
do $$ begin
  begin insert into formations (slug, title) values ('pirate', 'X'); raise exception 'anon a pu écrire';
  exception when insufficient_privilege then null; end;
end $$;
insert into feedback (answers) values ('{"q1":"ok"}');
do $$ begin assert (select count(*) from feedback) = 0, 'anon lit les retours'; end $$;
do $$ begin
  begin insert into feedback (answers, user_id) values ('{}', '00000000-0000-0000-0000-00000000000b'); raise exception 'usurpation retour';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Alice : ses données uniquement
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
insert into learner_progress (step_key, data) values ('publiee/m1/s1', '{"screen":3,"inputs":{"x":"1"}}');
do $$ begin
  begin insert into learner_progress (user_id, step_key) values ('00000000-0000-0000-0000-00000000000c', 'publiee/m1/s2'); raise exception 'alice écrit pour bob';
  exception when insufficient_privilege then null; end;
  begin insert into learner_progress (step_key) values ('pas une clé'); raise exception 'clé invalide acceptée';
  exception when check_violation then null; end;
end $$;
do $$ begin
  begin update formations set title = 'piraté'; exception when insufficient_privilege then null; end;
  assert (select count(*) from formations where title = 'piraté') = 0, 'alice modifie le contenu';
  assert (select count(*) from profiles) = 1, 'alice: profils';
end $$;

-- Bob ne voit rien d'Alice
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$ begin
  assert (select count(*) from learner_progress) = 0, 'bob voit la progression d''alice';
  update learner_progress set data = '{}';
  delete from learner_progress;
end $$;

-- Admin : voit les brouillons et les retours, peut écrire
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$ begin
  assert (select count(*) from formations) = 2, 'admin: formations';
  assert (select count(*) from steps) = 2, 'admin: steps';
  assert (select count(*) from feedback) = 1, 'admin: retours';
  assert (select count(*) from learner_progress) = 0, 'admin voit la progression des apprenants';
end $$;
update formations set title = 'Publiée (modifiée)' where slug = 'publiee';
reset role;
do $$ begin assert (select data->'inputs'->>'x' from learner_progress) = '1', 'bob a modifié ou supprimé alice'; end $$;
select 'RLS OK' as resultat;
