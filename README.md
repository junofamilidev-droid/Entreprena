# Entreprena (nom provisoire)

Plateforme de formation en ligne pour les professionnels dont le métier est transformé par l'IA.
Première formation : « Auditeur augmenté par l'IA ».

**Version de test.**

## Avancement

1. Charte graphique : page `/style` (validée)
2. Accueil, page de formation et diagnostic (en attente de validation)
3. Lecteur de module, avec le module 1 importé
4. Comptes et progression
5. Espace réservé
6. Mise en ligne

## Technique

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Motion. À venir : Supabase, TipTap, Vercel.

- Lancer en local : `npm install` puis `npm run dev`, puis ouvrir http://localhost:3000/style
- Serveur MCP shadcn : déclaré dans `.mcp.json`
- Contenu : chaque formation a un dossier dans `content/` (fichiers d'import). En ligne, tout est lu dans Supabase ;
  sans Supabase, en local uniquement, le site lit directement ces fichiers pour l'aperçu.
- Base de données : `supabase/migrations/` (tables et règles d'accès). Tests des règles sur un PostgreSQL local :
  `PGHOST=… PGPORT=… PGUSER=postgres supabase/tests/run-local.sh`
- Tests : `npm test` (le moteur de diagnostic est comparé au prototype sur 500 jeux de réponses)
