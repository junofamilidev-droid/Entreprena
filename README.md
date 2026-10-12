# Entreprena (nom provisoire)

Plateforme de formation en ligne pour les professionnels dont le métier est transformé par l'IA.
Première formation : « Auditeur augmenté par l'IA ».

**Version de test.**

## Avancement

Priorité actuelle : l'interface (pas de backend pour l'instant).

- Plateforme : tableau de bord, catalogue, page de formation, diagnostic, thème clair et sombre
- À venir : lecteur de module, exercice guidé, auto-correction, espace réservé
- L'avancement affiché est fictif (`src/lib/demo/progress.ts`) tant que les comptes ne sont pas ouverts

La plateforme accueille des formations pour tous les métiers : aucun écran n'est propre à l'audit.

## Technique

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Motion. À venir : Supabase, TipTap, Vercel.

- Lancer en local : `npm install` puis `npm run dev`, puis ouvrir http://localhost:3000
- Serveurs MCP : shadcn et 21st.dev, déclarés dans `.mcp.json` (la clé 21st.dev est lue dans la variable `API_KEY_21ST`, jamais écrite dans le dépôt)
- Compétences de design pour Claude : `.claude/skills/` (frontend-design, ui-ux-pro-max)
- Contenu : chaque formation a un dossier dans `content/` (fichiers d'import). En ligne, tout est lu dans Supabase ;
  sans Supabase, en local uniquement, le site lit directement ces fichiers pour l'aperçu.
- Base de données : `supabase/migrations/` (tables et règles d'accès). Tests des règles sur un PostgreSQL local :
  `PGHOST=… PGPORT=… PGUSER=postgres supabase/tests/run-local.sh`
- Tests : `npm test` (le moteur de diagnostic est comparé au prototype sur 500 jeux de réponses)
