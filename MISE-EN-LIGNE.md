# Mise en ligne de la vente : la liste

Tout ce qui est marqué ✅ est déjà prêt dans le site. Le jour du lancement, il reste à **activer** et à **payer**
ce qui est listé plus bas, dans l'ordre.

## ✅ Déjà prêt (rien à faire)

- Diagnostic « Votre métier face à l'IA », avec son onglet de suivi dans l'espace réservé.
- Pages des formations (Auditeur + les 10 métiers en préparation).
- Paiement par carte (Stripe) : bouton, case « J'accepte les CGV » sur la page Stripe, création du compte,
  connexion automatique, arrivée sur la session 1. **Il reste éteint tant que la clé Stripe n'est pas ajoutée**
  (le site affiche alors « Être prévenu de l'ouverture »).
- Sessions et outils réservés aux acheteurs et aux testeurs.
- Onglet « Accès et achats » de l'espace réservé : offrir un accès à un testeur, retirer un accès.
- Clé secrète Supabase : déjà réglée dans Vercel.

## À faire avant le lancement (dans cet ordre)

| # | Quoi | Prix | Pourquoi |
|---|------|------|----------|
| 1 | Créer votre statut (micro-entreprise par exemple), sur autoentrepreneur.urssaf.fr | Gratuit | Il faut un numéro SIRET pour encaisser et pour les mentions légales |
| 2 | Acheter le nom de domaine | ≈ 10 à 15 € par an | Adresse du site, et envoi des emails |
| 3 | Passer Vercel en offre **Pro** | ≈ 20 $ par mois | L'offre gratuite est interdite pour un site qui vend |
| 4 | Activer votre compte Stripe (identité, SIRET, IBAN) | Gratuit, puis ≈ 1,5 % + 0,25 € par vente | Recevoir l'argent des ventes |
| 5 | Donner vos informations légales (nom, adresse, SIRET, régime de TVA) | — | Pour remplir les pages légales préparées |

## Le jour J (après votre « mets en ligne »)

1. Offrir un accès à vos testeurs actuels (Espace réservé → Accès et achats) : sinon ils perdent l'accès aux sessions.
2. Coller la **vraie** clé Stripe dans Vercel (Production) : c'est l'interrupteur qui fait apparaître le bouton d'achat.
3. Claude applique la dernière migration (fermeture de la lecture publique des sessions) et publie le site.
