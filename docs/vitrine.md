# Vitrine et plateforme : où changer quoi

| Je veux changer… | Fichier |
|---|---|
| Le nom de la marque (partout) | `src/lib/site.ts` (ligne `name`) |
| Un texte de l'accueil, la FAQ, le libellé des boutons | `src/lib/vitrine/textes.ts` |
| Les couleurs, tailles de titres, espacements, police des titres de la vitrine | `src/styles/vitrine-tokens.css` |
| Les liens du haut et du bas de la vitrine | `src/components/site/site-nav.ts` |
| Les captures de la plateforme (cartes flottantes) | `public/captures/` (liste dans `A-FOURNIR.md`) |
| L'animation du haut de page (vitesse, nombre d'éléments, teintes) | `src/components/site/hero-flow.tsx` |
| Une formation, ses modules (titre, promesse, disponibilité) | l'espace réservé `/admin` (comme avant) |

## Les adresses

- `/` : la vitrine (accueil). `/formations` : le catalogue public.
- `/app` : la plateforme des apprenants (tableau de bord, formations, compte, connexion…).
- `/admin` : l'espace réservé, inchangé.
- Les anciennes adresses de la plateforme (`/compte`, `/connexion`, `/catalogue`, `/formations/…/module`…)
  renvoient automatiquement vers la nouvelle (réglage `redirects` dans `next.config.ts`).

## Dossiers du code

- `src/app/(site)/` : pages de la vitrine, avec leur mise en page (en-tête et pied de page).
- `src/app/(plateforme)/app/` et `src/app/(lecteur)/app/` : pages de la plateforme.
- `src/components/site/` : briques de la vitrine (scène du prisme, cartes, FAQ…).
