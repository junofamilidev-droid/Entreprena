-- ⚠️ À APPLIQUER SEULEMENT AU MOMENT DE LA MISE EN LIGNE, en même temps que le déploiement du code
-- qui lit les sessions avec la clé secrète. Appliquée trop tôt, elle couperait l'accès aux sessions
-- sur le site actuellement en ligne.
--
-- Réserve le contenu des sessions et leurs fichiers (données, outils Claude) :
-- - les sessions ne sont plus lisibles avec la clé publique (le serveur vérifie l'accès, puis lit avec la clé secrète) ;
-- - le stockage des fichiers devient privé : le site les sert par des liens temporaires, après vérification.

drop policy if exists "lecture publique ou admin" on public.sessions;
create policy "lecture admin" on public.sessions for select using (public.is_admin());

update storage.buckets set public = false where id = 'session-files';
