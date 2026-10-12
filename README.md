# Entreprena (nom provisoire)

Plateforme de formation en ligne pour les professionnels dont le métier est transformé par l'IA.
Première formation : « Auditeur augmenté par l'IA ».

**Version de test.**

## Avancement

Priorité actuelle : l'interface (pas de backend pour l'instant).

- Plateforme : tableau de bord, catalogue, page de formation, diagnostic, thème clair et sombre
- Lecteur de leçon et exercice guidé (blocs : texte, données à copier, saisie, contrôle de valeurs,
  tableau à lignes, relecture automatique, livrable assemblé), progression et saisies enregistrées sur l'appareil
- Auto-correction (grille sur 20, corrigé ouvert après dépôt, critères éliminatoires) et attestation de fin de module
- Comptes apprenants (Supabase) : inscription, connexion, mot de passe oublié, page « Mon compte » ;
  la progression et les saisies d'exercice suivent l'apprenant sur tous ses appareils
- Espace réservé (`/admin`, comptes inscrits dans la table `admins`) : formations, modules et étapes,
  éditeur de texte (TipTap) pour les leçons, mode avancé JSON pour les autres étapes, brouillon et publication,
  aperçu, import du contenu des fichiers dans la base
- À venir : retours des testeurs

La plateforme accueille des formations pour tous les métiers : aucun écran n'est propre à l'audit.

## Technique

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Motion, Supabase (comptes), Vercel. À venir : TipTap.

- Lancer en local : `npm install` puis `npm run dev`, puis ouvrir http://localhost:3000
- Serveurs MCP : shadcn et 21st.dev, déclarés dans `.mcp.json` (la clé 21st.dev est lue dans la variable `API_KEY_21ST`, jamais écrite dans le dépôt)
- Compétences de design pour Claude : `.claude/skills/` (frontend-design, ui-ux-pro-max)
- Réglages : voir `.env.example`. Sans Supabase, le site fonctionne sans comptes (progression sur l'appareil).
- Contenu : dès que la base contient une formation publiée (import depuis l'espace réservé), le site lit la base ;
  sinon, les fichiers du dossier `content/` (`CONTENT_SOURCE=files` force les fichiers). Attention : un nouvel import
  remplace, pour les éléments communs, les modifications faites dans l'espace réservé.
- Donner l'accès administrateur : dans l'éditeur SQL de Supabase,
  `insert into public.admins (user_id) select id from auth.users where email = '…';`
- Comptes : la progression est copiée dans le navigateur et dans la table `learner_progress`
  (`src/lib/progress/sync.ts`) ; la session est rafraîchie par `src/proxy.ts`.
- Base de données : `supabase/migrations/` (tables et règles d'accès). Tests des règles sur un PostgreSQL local :
  `PGHOST=… PGPORT=… PGUSER=postgres supabase/tests/run-local.sh`
- Exercice, auto-correction, fin de module : rédigés dans `content/<formation>/sources/*.json`, puis rangés dans `formation.json` par
  `node scripts/import-etape.mjs <source.json> <formation.json> <module> <étape>` (la balance CSV y est incluse)
- Tests : `npm test` (le moteur de diagnostic est comparé au prototype sur 500 jeux de réponses)
