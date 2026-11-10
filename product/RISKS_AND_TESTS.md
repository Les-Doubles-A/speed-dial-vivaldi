# Speed Dial Vivaldi — Risques et tests

> Version 1 · 2026-10-17

## 1. Risques

| ID | Risque | Type | Probabilité | Impact | Prévention | Repli |
|---|---|---|---|---|---|---|
| R1 | Vivaldi n'affiche pas la page de l'extension au démarrage (des utilisateurs l'ont signalé sur le forum Vivaldi ; comportement actuel **[À vérifier]**) | Plateforme | Moyenne | Moyen | Vérifier H6 dès T1 (M1) | Page ouverte en nouvel onglet ou ajoutée en signet |
| R2 | Captures d'écran natives indisponibles pour l'extension (H5) | Technique | Forte | Faible | Vignettes : icône, image locale, initiale | Aucun besoin |
| R3 | Dossiers Speed Dial natifs non détectables (H7) | Technique | Forte | Faible | Sélecteur manuel (F2) | Aucun besoin |
| R4 | `chrome.bookmarks` ou API `favicon` se comporte différemment dans Vivaldi (H4) | Technique | Faible | Fort | Prototype en T1 | Initiale colorée ; si les signets sont inaccessibles, revoir le produit |
| R5 | Réglages perdus à la désinstallation de l'extension | Fonctionnel | Moyenne | Moyen | F5 (export) | Réimport |
| R6 | Suppression ou modification involontaire de signets | Fonctionnel | Moyenne | Fort | Confirmation et annulation de 10 secondes (AC-F3-3) | Restauration depuis l'annulation ou depuis la sauvegarde de signets de Vivaldi |
| R7 | Mise à jour de Vivaldi qui change le comportement de la page d'accueil | Plateforme | Faible | Moyen | Relire les notes de version | Revenir au Speed Dial natif |
| R8 | Intérêt faible face au Speed Dial natif | Fonctionnel | Moyenne | Moyen | Test de deux semaines (brief, section 7) | Abandonner et garder le natif |

## 2. Hypothèses non vérifiées

| ID | Hypothèse | Comment la vérifier | Quand | Ce qu'on fait si elle est fausse |
|---|---|---|---|---|
| H1 | Vivaldi desktop, extension MV3 non empaquetée | Chargement dans T1 | T1 | Revoir la plateforme |
| H2 | « Fonctionnalités actuelles » = Speed Dial natif | Confirmation de l'utilisateur (Q1) | Avant T2 | Refaire la liste F1 à F5 |
| H3 | Un seul ordinateur, pas de compte | Confirmation (Q3) | Avant T3 | Passer F9 dans le MVP |
| H4 | `chrome.bookmarks` lecture/écriture dans Vivaldi | M1 | T1 | Revoir l'architecture |
| H5 | Captures natives inaccessibles | Inspection dans T2 | T2 | Les réutiliser si possible |
| H6 | Page utilisable comme nouvel onglet et page de démarrage | M1 | T1 | Repli de R1 |
| H7 | Dossiers Speed Dial natifs non détectables | Inspection dans T2 | T2 | Ajouter une détection automatique |

## 3. Stratégie de test

| Niveau | Outil | Ce qui est couvert | Quand l'exécuter |
|---|---|---|---|
| Unitaire | `node --test` | Arbre de signets, réglages, validation, export/import, bornes | À chaque modification |
| Intégration | `node --test` avec API `chrome.*` simulées | Écritures de signets, stockage | À chaque modification |
| Interface simulée | `node --test` + jsdom + IndexedDB simulée (`npm run test:interface`, après `npm install`) | La vraie page dans un DOM simulé : parcours F1 à F5 de bout en bout, sans Vivaldi | Avant chaque livraison |
| Bout en bout dans Vivaldi | Non automatisé | Voir les scénarios manuels | — |
| Manuel | Vivaldi, extension chargée non empaquetée | Signets réels, démarrage, rendu, contraste, téléchargement | Avant chaque livraison |

**Commandes** : `npm test` (soit `node --test "tests/*.test.js"`, aucune dépendance) ; `npm run test:interface` (nécessite `npm install` : jsdom et fake-indexeddb, outils de développement uniquement).

## 4. Couverture des critères d'acceptation

| Critère | Vérification | Test ou scénario | Tâche |
|---|---|---|---|
| AC-F1-1 | Automatique | `tests/signets.test.js` | T2 |
| AC-F1-2 | Manuelle | M2 | T2 |
| AC-F1-3 | Automatique | `tests/signets.test.js` | T2 |
| AC-F1-4 | Automatique | `tests/signets.test.js` | T2 |
| AC-F1-5 | Manuelle | M-perf | T2 |
| AC-F1-6 | Automatique | `tests/signets.test.js` | T2 |
| AC-F2-1 | Automatique | `tests/reglages.test.js` | T3 |
| AC-F2-2 | Automatique | `tests/reglages.test.js` | T3 |
| AC-F2-3 | Automatique + manuelle | `tests/reglages.test.js` ; M3 | T3 |
| AC-F2-4 | Automatique + manuelle | `tests/reglages.test.js` ; M3 | T3 |
| AC-F2-5 | Automatique | `tests/reglages.test.js` | T3 |
| AC-F3-1 | Automatique + manuelle | `tests/operations.test.js` ; M5 | T5 |
| AC-F3-2 | Automatique + manuelle | `tests/operations.test.js` ; M5 | T5 |
| AC-F3-3 | Automatique + manuelle | `tests/operations.test.js` ; M5 | T5 |
| AC-F3-4 | Automatique + manuelle | `tests/operations.test.js` (position après déplacement) ; M5 (souris, clavier, ordre réel dans Vivaldi) | T5 |
| AC-F3-5 | Automatique + manuelle | `tests/vignettes.test.js`, `tests/images.test.js` ; M5 (survie au redémarrage de Vivaldi) | T6 |
| AC-F4-1 | Automatique | `tests/apparence.test.js` | T4 |
| AC-F4-2 | Automatique + manuelle | `tests/apparence.test.js` (largeurs) ; M4 (rendu) | T4 |
| AC-F4-3 | Automatique + manuelle | `tests/apparence.test.js` (valeurs) ; M4 (thème automatique du système) | T4 |
| AC-F4-4 | Automatique + manuelle | `tests/images.test.js` ; M4 | T4 |
| AC-F4-5 | Automatique + manuelle | `tests/apparence.test.js` ; M4 | T4 |
| AC-F4-6 | Automatique + manuelle | `tests/contraste.test.js` (palettes) ; M4 (3 images d'essai) | T4 |
| AC-F5-1 | Automatique + manuelle | `tests/export.test.js` ; M6 | T7 |
| AC-F5-2 | Automatique | `tests/export.test.js` | T7 |
| AC-F5-3 | Automatique | `tests/export.test.js` | T7 |

## 5. Scénarios de test manuels

### M1 — Chargement et page de démarrage

- **Préparation** : Vivaldi à jour, mode développeur activé sur la page des extensions.
- **Étapes** : charger le dossier de l'extension ; ouvrir un nouvel onglet ; renseigner l'adresse de la page de l'extension comme page de démarrage ; quitter complètement Vivaldi puis le relancer.
- **Résultat attendu** : la page s'affiche en nouvel onglet et au démarrage, ou le comportement réel est consigné dans le README (R1).
- **Critères couverts** : vérification de H4 et H6.

### M2 — Ouvrir des sites

- **Préparation** : un dossier de test avec 3 signets et 1 sous-dossier.
- **Étapes** : cliquer sur un signet ; Ctrl+clic sur un autre ; entrer dans le sous-dossier et revenir par le fil d'Ariane.
- **Résultat attendu** : sites ouverts dans l'onglet courant puis dans un nouvel onglet ; navigation correcte.
- **Critères couverts** : AC-F1-2.

### M3 — Groupes et redémarrage

- **Préparation** : réglages vierges.
- **Étapes** : choisir 3 dossiers ; renommer et réordonner un groupe ; quitter et relancer Vivaldi.
- **Résultat attendu** : groupes, libellés, ordre et groupe actif conservés ; nom du dossier de signets inchangé.
- **Critères couverts** : AC-F2-3, AC-F2-4.

### M4 — Personnalisation

- **Préparation** : trois images d'essai (claire, sombre, colorée) de moins de 5 Mo.
- **Étapes** : régler colonnes, taille, thème ; appliquer chaque image en fond ; mesurer le contraste des titres ; redémarrer Vivaldi.
- **Résultat attendu** : effet immédiat, contraste d'au moins 4,5:1, réglages conservés, image de 6 Mo refusée.
- **Critères couverts** : AC-F4-2, AC-F4-3, AC-F4-4, AC-F4-5, AC-F4-6.

### M5 — Gestion des tuiles

- **Préparation** : dossier de test dédié (jamais un dossier réel).
- **Étapes** : ajouter, modifier, supprimer puis annuler ; déplacer une tuile à la souris puis au clavier ; poser une vignette de 1 Mo et tenter 3 Mo ; recharger.
- **Résultat attendu** : le gestionnaire de signets de Vivaldi reflète chaque changement ; l'ordre est conservé ; image de 3 Mo refusée.
- **Critères couverts** : AC-F3-1 à AC-F3-5.

### M6 — Export et import

- **Préparation** : réglages personnalisés.
- **Étapes** : exporter ; réinitialiser ; importer le fichier ; importer un fichier corrompu.
- **Résultat attendu** : fichier nommé `speed-dial-reglages-AAAA-MM-JJ.json` ; réglages restaurés ; fichier corrompu refusé sans changement.
- **Critères couverts** : AC-F5-1.

### M-perf — Durée d'affichage

- **Préparation** : dossier de 200 signets.
- **Étapes** : ouvrir la page et chronométrer jusqu'à l'affichage complet.
- **Résultat attendu** : moins de 1 s.
- **Critères couverts** : AC-F1-5.

## 6. Validation du MVP

Le MVP est validé quand :

- [ ] tous les critères d'acceptation MVP sont vérifiés (tableau de la section 4) — **partiel** : partie automatique et interface simulée vérifiées ; partie manuelle dans Vivaldi non vérifiée ;
- [x] `npm test` passe sans échec — **75 tests passés** (2026-10-18) ;
- [x] `npm run test:interface` passe sans échec — **7 parcours passés, stables sur 3 exécutions** (2026-10-18) ;
- [ ] M1 à M6 et M-perf ont été exécutés dans Vivaldi — **non exécutés** ;
- [ ] l'usage sur 14 jours atteint le seuil du brief (12 jours sans retour au natif) — **non commencé**.

### Résultat de la validation (T8, 2026-10-18)

**Verdict : MVP complet côté code, non validé.** Ce qui est prouvé tient à des tests automatiques et à une page simulée dans jsdom ; ce n'est pas Vivaldi. Les points qui dépendent du navigateur réel restent non vérifiés, et c'est eux qui peuvent encore faire échouer le produit.

| Critère | Automatique (`npm test`) | Interface simulée (`npm run test:interface`) | Dans Vivaldi |
|---|---|---|---|
| AC-F1-1 | vérifié | vérifié | non vérifié (M1, M2) |
| AC-F1-2 | — | — | non vérifié (M2) |
| AC-F1-3 | vérifié | vérifié | non vérifié (M2) |
| AC-F1-4 | vérifié | vérifié | non vérifié (M2) |
| AC-F1-5 | — | — | non vérifié (M-perf) |
| AC-F1-6 | vérifié | vérifié | non vérifié (M2) |
| AC-F2-1 | vérifié | vérifié | non vérifié (M3) |
| AC-F2-2 | vérifié | vérifié | non vérifié (M3) |
| AC-F2-3 | vérifié (stockage simulé) | — | non vérifié (M3, redémarrage réel) |
| AC-F2-4 | vérifié (stockage simulé) | — | non vérifié (M3, redémarrage réel) |
| AC-F2-5 | vérifié | vérifié | non vérifié (M3) |
| AC-F3-1 | vérifié | vérifié | non vérifié (M5) |
| AC-F3-2 | vérifié | vérifié | non vérifié (M5) |
| AC-F3-3 | vérifié | vérifié | non vérifié (M5) |
| AC-F3-4 | vérifié (avec et sans le décalage connu de Chrome) | vérifié (clavier et glisser-déposer) | non vérifié (M5, ordre réel) |
| AC-F3-5 | vérifié | vérifié | non vérifié (M5, redémarrage réel) |
| AC-F4-1 | vérifié | vérifié | non vérifié (M4) |
| AC-F4-2 | vérifié (largeurs) | vérifié (variable de taille) | non vérifié (M4, rendu) |
| AC-F4-3 | vérifié (valeurs) | vérifié | non vérifié (M4, thème automatique du système) |
| AC-F4-4 | vérifié | vérifié | non vérifié (M4) |
| AC-F4-5 | vérifié | vérifié | non vérifié (M4, redémarrage réel) |
| AC-F4-6 | vérifié (contraste des palettes, minimum mesuré 5,13:1) | — | non vérifié (M4, 3 images d'essai) |
| AC-F5-1 | vérifié | vérifié (nom, version, contenu) | non vérifié (M6, téléchargement réel) |
| AC-F5-2 | vérifié | vérifié | non vérifié (M6) |
| AC-F5-3 | vérifié | vérifié | non vérifié (M6) |

**Hypothèses toujours ouvertes** (aucune n'a été testée dans Vivaldi) : H1, H4, H5, H6, H7, ainsi que le comportement de `bookmarks.move` et de l'API `favicon`. H2 (« fonctionnalités actuelles » = Speed Dial natif) attend toujours la réponse à Q1.

**Pour passer au vert** : charger l'extension (README), exécuter M1 d'abord (il confirme H4 et H6, dont dépend tout le reste), puis M2 à M6 et M-perf sur un dossier de test pour ce qui écrit dans les signets, remplir le tableau d'observations du README, puis cocher les cases ci-dessus.

## 7. Après le lancement

Observer pendant les deux semaines d'usage : nombre de retours au Speed Dial natif, erreurs affichées, réglages qui manquent. Ces observations confirment ou infirment H2, H6 et R8, et décident du contenu de la version 2.
