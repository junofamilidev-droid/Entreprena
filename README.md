# Entreprena (nom provisoire)

Plateforme de formation en ligne pour les professionnels dont le métier est transformé par l'IA.
Première formation : « Auditeur augmenté par l'IA ».

**Version de test.**

## Avancement

1. Charte graphique : page `/style` (en attente de validation)
2. Accueil et page de formation
3. Lecteur de module, avec le module 1 importé
4. Comptes et progression
5. Espace réservé
6. Mise en ligne

## Technique

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Motion. À venir : Supabase, TipTap, Vercel.

- Lancer en local : `npm install` puis `npm run dev`, puis ouvrir http://localhost:3000/style
- Serveur MCP shadcn : déclaré dans `.mcp.json`
- Contenu source du module 1 : `content/auditeur-augmente/` (il sera importé en base à l'étape 3)
