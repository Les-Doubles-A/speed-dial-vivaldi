# Speed Dial Vivaldi

Dépôt GitHub : **https://github.com/Les-Doubles-A/speed-dial-vivaldi**

Page Speed Dial de remplacement pour Vivaldi (desktop) : tes signets en tuiles, depuis les dossiers que tu choisis, avec une personnalisation poussée. Extension Manifest V3, JavaScript sans framework ni serveur. Cadrage complet dans `product/`.

> **État : code du MVP complet (T1 à T8), non validé dans Vivaldi.** Les tests automatiques passent, mais aucun scénario manuel n'a encore été exécuté dans le vrai navigateur (voir « Valider dans Vivaldi » ci-dessous).

## Fonctions

- **Grille de signets :** tuiles avec icône du site, sous-dossiers, fil d'Ariane. Clic = ouvre ; Ctrl+clic ou clic molette = nouvel onglet. Seules les adresses `http` et `https` s'ouvrent.
- **Dossiers choisis :** bouton « Dossiers et groupes ». Un onglet par dossier coché, renommable (le nom du dossier dans tes signets ne change pas) et réordonnable.
- **Gestion des tuiles :** tuile « Ajouter un site » ; clic droit, Maj+F10 ou F2 pour modifier ; Suppr pour supprimer (confirmation, puis « Annuler » pendant 10 secondes) ; glisser-déposer ou Alt+flèches pour réordonner. Seuls les signets se modifient et se suppriment, pas les dossiers.
- **Vignette personnalisée :** dans « Modifier » (image de 2 Mo maximum, 440×360 px conseillé), rangée par adresse du signet.
- **Personnaliser :** colonnes de 2 à 10, taille des tuiles (petite, moyenne, grande), thème clair, sombre ou automatique, fond en couleur unie, dégradé ou image locale (5 Mo maximum) avec voile, réinitialisation.
- **Sauvegarde :** export et import d'un fichier `speed-dial-reglages-AAAA-MM-JJ.json` (groupes, personnalisation, fond, vignettes). Les dossiers sont retrouvés par leur chemin (« Barre de favoris / Outils ») ; un dossier absent donne un groupe « Dossier introuvable » à retirer.

**Cette page écrit dans tes vrais signets** (ajout, modification, suppression, ordre). Fais tes premiers essais dans un dossier de test.

## Installer dans Vivaldi

1. Ouvre `vivaldi://extensions` et active le **mode développeur**.
2. Clique sur **Charger l'extension non empaquetée** et choisis ce dossier (celui qui contient `manifest.json`).
3. Ouvre un nouvel onglet : la page s'affiche. Clique sur « Choisir des dossiers » pour créer tes groupes.
4. Pour l'utiliser aussi au démarrage : dans les réglages de Vivaldi (page de démarrage / page d'accueil), renseigne `chrome-extension://<identifiant>/newtab.html` (l'identifiant est affiché sur `vivaldi://extensions`). Le comportement au démarrage est à vérifier (M1, risque R1) ; en repli, la page reste disponible en nouvel onglet.

Pense à exporter ta sauvegarde après avoir réglé la page : réglages et images sont stockés dans l'extension et disparaissent si tu la désinstalles.

## Valider dans Vivaldi

Les scénarios détaillés sont dans `product/RISKS_AND_TESTS.md` (section 5). Ordre conseillé :

1. **M1** : chargement, nouvel onglet, page de démarrage (confirme que les signets sont lisibles et inscriptibles dans Vivaldi).
2. **M2** : ouvrir des sites. **M-perf** : 200 signets affichés en moins d'une seconde.
3. **M3** : groupes, redémarrage de Vivaldi.
4. **M4** : personnalisation, thème automatique, 3 images de fond d'essai.
5. **M5** : gestion des tuiles et vignettes, sur un dossier de test.
6. **M6** : export puis import du fichier téléchargé.

Note ce que tu observes dans le tableau ci-dessous, puis coche la validation dans `product/RISKS_AND_TESTS.md` (section 6).

| Point | Observation |
|---|---|
| Version de Vivaldi (D2) | à noter |
| H4 : `chrome.bookmarks` lit et écrit les signets | à vérifier |
| H5 : captures natives de Vivaldi accessibles ? | à vérifier |
| H6 : page utilisable comme page de démarrage ? | à vérifier |
| H7 : dossiers Speed Dial natifs repérables ? | à vérifier |
| API `favicon` : icônes affichées ? | à vérifier (repli : initiale colorée) |
| M4 : thème automatique, fond lisible, réglages conservés après redémarrage | à vérifier |
| M5 : écritures réelles, ordre après déplacement, vignette conservée après redémarrage | à vérifier |
| M6 : fichier téléchargé, import, fichier corrompu refusé | à vérifier |

## Tests

```
npm test                 # 75 tests unitaires, aucune dépendance
npm install              # une seule fois : jsdom et fake-indexeddb (développement seulement)
npm run test:interface   # 7 parcours de la vraie page dans un DOM simulé
```

`npm test` équivaut à `node --test "tests/*.test.js"` (Node.js 22 utilisé pour le développement). Les tests d'interface simulent Vivaldi : ils ne remplacent pas les scénarios manuels.

## Limites connues

- Les vignettes natives de Vivaldi (captures d'écran) ne sont pas réutilisées : icône du site, image locale ou initiale colorée.
- Deux signets de même adresse partagent leur vignette ; supprimer un signet laisse sa vignette en réserve.
- À l'import, si plusieurs dossiers portent le même titre au même niveau, le premier est retenu ; un dossier renommé n'est plus retrouvé.
- Pas de recherche, de raccourcis numérotés, de sites les plus visités ni de synchronisation entre ordinateurs (version 2, voir `product/FEATURES_AND_ACCEPTANCE.md`).

## Structure

```
manifest.json, newtab.html, styles/page.css
src/        signets.js, reglages.js, operations.js, images.js, apparence.js, panneau.js,
            export.js, sauvegarde.js, interface.js
tests/             tests unitaires (npm test)
tests-interface/   parcours de la page dans jsdom (npm run test:interface)
product/           brief, fonctionnalités, architecture, plan, risques et tests
```

<!-- installeur-release -->
## Installation

Téléchargez **`speed-dial-vivaldi-Setup-0.1.1.exe`** depuis la [dernière release](https://github.com/Les-Doubles-A/speed-dial-vivaldi/releases/latest), puis lancez-le.

L'installeur copie l'extension dans `%LOCALAPPDATA%\Programs\speed-dial-vivaldi\extension` puis affiche la marche à suivre :

1. Ouvrez la page des extensions du navigateur (`chrome://extensions`, `edge://extensions`, `vivaldi://extensions`...).
2. Activez le **Mode développeur**.
3. Cliquez sur **Charger l'extension non empaquetée** et choisissez le dossier `extension` (raccourci dans le menu Démarrer).

L'installeur n'est pas signé : si Windows SmartScreen l'affiche, cliquez sur « Informations complémentaires » puis « Exécuter quand même ».

### Recréer l'installeur

Lancer [Inno Setup 6](https://jrsoftware.org/isinfo.php) : `iscc installer\speed-dial-vivaldi.iss`. Le setup est créé dans `installer\Output\`.
