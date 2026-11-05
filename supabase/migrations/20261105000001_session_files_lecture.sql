-- Téléversement des fichiers de session : Supabase exige aussi une règle de lecture pour
-- remplacer un fichier (upsert) ou en supprimer un. Sans elle : « new row violates row-level
-- security policy ». Les fichiers restent publics par leur lien ; cette règle ne concerne que
-- la liste et le remplacement depuis l'espace réservé.
drop policy if exists "fichiers de session : lecture admin" on storage.objects;
create policy "fichiers de session : lecture admin" on storage.objects for select to authenticated
  using (bucket_id = 'session-files' and public.is_admin());
