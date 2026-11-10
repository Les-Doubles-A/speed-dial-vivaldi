# Speed Dial Vivaldi — Plan d'implémentation

> Version 1 · 2026-10-17 · Pour confier une tâche à Claude Code : « Implémente T3 de product/IMPLEMENTATION_PLAN.md » ou `/idea-to-product build T3`

## 1. Décisions à prendre avant de coder

| ID | Décision | Options | Recommandation | Bloque |
|---|---|---|---|---|
| D1 | Que signifie « fonctionnalités actuelles » (Q1) ? | Speed Dial natif de Vivaldi / page Speed Dial de Link Peek | Envoyer le code de Link Peek s'il existe ; sinon retenir le natif (H2). **Sans réponse : le natif a été retenu pour la tranche 1.** | T2 |
| D2 | Version de Vivaldi utilisée | Dernière stable / autre | Noter la version dans le README | T1 |
| D3 | Q3 : plusieurs ordinateurs ? | Oui (F9 dans le MVP) / Non | Non (H3) | Aucune tâche du MVP |

## 2. Étapes

1. **Fondations** — T1 : squelette, manifeste, outillage de test, vérification de H4 et H6.
2. **Parcours principal** — T2, T3 : lecture des signets, grille, groupes choisis.
3. **Compléments du MVP** — T4 à T7 : personnalisation, gestion des tuiles, vignettes, export/import.
4. **Validation du MVP** — T8 : scénarios manuels et README.

## 3. Tranche 1 — premier résultat testable

- **Ce que l'utilisateur pourra faire à la fin** : ouvrir un nouvel onglet dans Vivaldi, choisir des dossiers de signets, voir leurs tuiles en groupes et ouvrir des sites.
- **Tâches incluses** : T1, T2, T3.
- **Comment le tester** : `npm test` (soit `node --test "tests/*.test.js"`) passe ; scénario M1 puis M2 dans Vivaldi.

## 4. Tâches

### T1 — Squelette et vérification des hypothèses techniques

- **Objectif** : extension chargeable dans Vivaldi, outillage de test prêt, H4 et H6 vérifiées.
- **Dépend de** : D2.
- **Fichiers ou composants** : `manifest.json`, `newtab.html`, `tests/`, `README.md`.
- **À faire** :
  1. Manifest V3 avec permissions `bookmarks` et `storage`, et `chrome_url_overrides.newtab`.
  2. Page minimale listant les enfants du nœud racine des signets, pour confirmer H4.
  3. Dossier `tests/` et un premier test `node --test`.
  4. Noter dans le README ce qui est observé pour H4, H5, H6 et H7.
- **Tests** : `npm test` (soit `node --test "tests/*.test.js"`) s'exécute ; M1 manuel.
- **Terminé quand** : la page s'affiche dans un nouvel onglet de Vivaldi et le README consigne le résultat de H4 à H7.
- **Couvre** : fondations (aucun critère direct).
- **Statut** : en cours (code fait ; manuel restant) — `npm test` : 16 tests passent ; page et modules écrits, syntaxe vérifiée. **Reste** : M1 dans Vivaldi pour confirmer H4 à H7 et remplir la table du README.

### T2 — Lecture des signets et grille (F1)

- **Objectif** : afficher un dossier en tuiles, naviguer dans les sous-dossiers.
- **Dépend de** : T1, D1.
- **Fichiers ou composants** : `src/signets.js`, `src/interface.js`, `styles/page.css`, `tests/signets.test.js`.
- **À faire** :
  1. Fonctions pures de construction des tuiles à partir de l'arbre.
  2. Rendu de la grille, des états vide et erreur, du fil d'Ariane.
  3. Règle d'adresses `http`/`https` et infobulle.
  4. Icônes (API `favicon` si disponible, sinon initiale colorée).
- **Tests** : unitaires sur arbre simulé ; M-perf manuel avec 200 signets.
- **Terminé quand** : les tests passent et M2 est conforme.
- **Couvre** : F1, AC-F1-1 à AC-F1-6.
- **Statut** : en cours (code fait ; manuel restant) — tests automatiques de AC-F1-1, 3, 4, 6 passent (`tests/signets.test.js`) ; rendu vérifié dans un DOM simulé (jsdom, hors projet). **Reste** : M2 (AC-F1-2) et M-perf (AC-F1-5) dans Vivaldi.

### T3 — Dossiers choisis en groupes (F2)

- **Objectif** : sélecteur de dossiers, groupes, persistance.
- **Dépend de** : T2.
- **Fichiers ou composants** : `src/reglages.js`, `src/interface.js`, `tests/reglages.test.js`.
- **À faire** :
  1. Réglages par défaut, validation, version.
  2. Sélecteur en arbre avec cases à cocher.
  3. Onglets de groupes, renommage, ordre, groupe actif mémorisé.
  4. État « Dossier introuvable ».
- **Tests** : unitaires avec stockage simulé ; M3 manuel (redémarrage de Vivaldi).
- **Terminé quand** : les tests passent et M3 est conforme.
- **Couvre** : F2, AC-F2-1 à AC-F2-5.
- **Statut** : en cours (code fait ; manuel restant) — tests automatiques de AC-F2-1 à AC-F2-5 passent (`tests/reglages.test.js`) ; parcours choix/groupes/fil d'Ariane vérifié dans jsdom. **Reste** : M3 (redémarrage de Vivaldi) pour AC-F2-3 et AC-F2-4.

### T4 — Personnalisation (F4)

- **Objectif** : colonnes, taille, thème, fond.
- **Dépend de** : T3.
- **Fichiers ou composants** : `src/reglages.js`, `src/images.js`, `src/apparence.js`, `src/panneau.js`, `styles/page.css`, `newtab.html`.
- **À faire** :
  1. Panneau de réglages avec aperçu direct.
  2. Variables CSS pour thème, taille et colonnes.
  3. Fond couleur, dégradé, image (IndexedDB, 5 Mo maximum) et voile.
  4. Réinitialisation avec confirmation.
- **Tests** : unitaires sur les bornes ; M4 manuel (rendu et contraste sur 3 images).
- **Terminé quand** : les tests passent et M4 est conforme.
- **Couvre** : F4, AC-F4-1 à AC-F4-6.
- **Statut** : en cours (code fait ; manuel restant) — `npm test` : 36 tests passent (bornes, persistance, réinitialisation, images 4/6 Mo, contrastes des palettes ≥ 4,5:1 : minimum mesuré 5,13:1) ; panneau vérifié dans un DOM simulé (jsdom + IndexedDB simulée, hors projet) : colonnes 11→10 et 1→2, taille, thème, fond couleur/dégradé/image, refus de 6 Mo, voile, réinitialisation avec suppression de l'image. **Reste** : M4 dans Vivaldi (rendu réel, thème automatique suivant le système, 3 images d'essai, redémarrage).

### T5 — Gestion des tuiles (F3, hors vignette)

- **Objectif** : ajouter, modifier, supprimer avec annulation, réordonner.
- **Dépend de** : T2.
- **Fichiers ou composants** : `src/operations.js`, `src/interface.js`, `tests/operations.test.js`, `tests/api-simulee.js`.
- **À faire** :
  1. Boîte d'édition avec validation.
  2. Suppression avec confirmation et annulation de 10 secondes.
  3. Glisser-déposer et déplacement au clavier (Alt+flèches) via `bookmarks.move`.
- **Tests** : unitaires avec API simulée ; M5 manuel sur un dossier de test.
- **Terminé quand** : les tests passent et M5 est conforme.
- **Couvre** : F3, AC-F3-1 à AC-F3-4.
- **Statut** : en cours (code fait ; manuel restant) — `npm test` : 49 tests passent (validation, ajout, modification, suppression + restauration, déplacement avec et sans le décalage connu de Chrome) sur une API de signets simulée ; parcours complet vérifié dans un DOM simulé (jsdom, hors projet) : ajout refusé puis accepté, menu contextuel, modification, suppression + annulation dans la fenêtre de 10 s, Alt+flèches, glisser-déposer, Delete. **Reste** : M5 dans Vivaldi, sur un dossier de test dédié, pour confirmer H4 en écriture et la position réelle après un déplacement.

### T6 — Vignette personnalisée (F3)

- **Objectif** : image locale par tuile.
- **Dépend de** : T4, T5.
- **Fichiers ou composants** : `src/images.js`, `src/interface.js`, `newtab.html`, `styles/page.css`, `tests/vignettes.test.js`.
- **À faire** :
  1. Sélecteur d'image dans la boîte d'édition, contrôle de type et de taille (2 Mo).
  2. Stockage `vignette:<adresse du signet>` (voir ADR-5) et affichage sur la tuile.
- **Tests** : unitaires sur le contrôle de taille ; M5 manuel.
- **Terminé quand** : les tests passent et la vignette survit au redémarrage.
- **Couvre** : F3, AC-F3-5.
- **Statut** : en cours (code fait ; manuel restant) — `npm test` : 58 tests passent (dont `tests/vignettes.test.js` : 1 Mo accepté et relu, 3 Mo refusé avec « Image trop lourde (2 Mo maximum) » sans rien écrire, remplacement, retrait, vignette qui suit l'adresse) ; parcours vérifié dans un DOM simulé (jsdom + IndexedDB simulée, hors projet) : refus de 3 Mo, vignette de 1 Mo affichée, présente après un redémarrage simulé, conservée après suppression puis annulation, suivie lors d'un changement d'adresse, retirée, ajout avec vignette de 2 Mo. **Reste** : M5 dans Vivaldi (survie réelle au redémarrage du navigateur).

### T7 — Export et import (F5)

- **Objectif** : sauvegarde et restauration des réglages.
- **Dépend de** : T3, T4, T6.
- **Fichiers ou composants** : `src/export.js`, `src/sauvegarde.js`, `newtab.html`, `src/interface.js`, `tests/export.test.js`.
- **À faire** :
  1. Export JSON versionné, images encodées (les vignettes sont rangées par adresse de signet, donc exportables telles quelles).
  2. Import validé, rattachement des dossiers par chemin.
  3. Messages d'erreur sans modification des réglages.
- **Tests** : aller-retour export/import automatique ; M6 manuel.
- **Terminé quand** : les tests passent et M6 est conforme.
- **Couvre** : F5, AC-F5-1 à AC-F5-3.
- **Statut** : en cours (code fait ; manuel restant) — `npm test` : 75 tests passent (dont `tests/export.test.js` : nom de fichier, contenu, UTF-8, vignettes encore utiles seulement, aller-retour vers un autre profil avec dossiers retrouvés par chemin et dossier absent signalé « introuvable », remplacement des groupes, valeurs hors limites bornées, et 8 familles de fichiers refusés sans rien écrire) ; parcours vérifié dans un DOM simulé (jsdom, hors projet) : export du profil A, import dans un profil B aux identifiants différents, fichier invalide et version inconnue refusés, confirmation refusée sans effet, apparence, fond et vignette restaurés. **Reste** : M6 dans Vivaldi (téléchargement réel du fichier, import du fichier téléchargé).

### T8 — Validation du MVP et documentation

- **Objectif** : prouver que le MVP est terminé.
- **Dépend de** : T1 à T7.
- **Fichiers ou composants** : `README.md`, `product/RISKS_AND_TESTS.md`, `tests-interface/`, `package.json`.
- **À faire** :
  1. Exécuter tous les scénarios manuels dans Vivaldi.
  2. Documenter installation, définition de la page de démarrage, sauvegarde.
  3. Remplir le tableau de validation.
- **Tests** : `npm test` (soit `node --test "tests/*.test.js"`) + M1 à M6.
- **Terminé quand** : chaque critère MVP est marqué vérifié ou signalé non vérifié.
- **Couvre** : validation de F1 à F5.
- **Statut** : fait côté documentation et tests automatiques ; **validation manuelle à faire par l'utilisateur** — `npm test` (75) et `npm run test:interface` (7 parcours, stables sur 3 exécutions) passent ; tableau de validation rempli dans `RISKS_AND_TESTS.md` (section 6) ; README réécrit. **MVP non validé** : M1 à M6 et M-perf n'ont pas été exécutés dans Vivaldi.

## 5. Peut attendre

| Élément | Pourquoi attendre | Déclencheur |
|---|---|---|
| F6 à F10 | Pas nécessaires au parcours principal | Deux semaines d'usage du MVP |
| Publication sur un store | Usage personnel | Décision de partager |
