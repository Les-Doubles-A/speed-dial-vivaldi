# Speed Dial Vivaldi — Fonctionnalités et critères d'acceptation

> Version 1 · 2026-10-17

## 1. Priorités

| ID | Fonctionnalité | Priorité | Justification |
|---|---|---|---|
| F1 | Grille de signets (tuiles, sous-dossiers, ouverture) | MVP | Parcours principal : ouvrir un site depuis la page |
| F2 | Dossiers choisis, affichés en groupes | MVP | Demandé : « dossier choisi » ; H7 impose un choix manuel |
| F3 | Gestion des tuiles (ajouter, modifier, supprimer, réordonner, vignette perso) | MVP | Fonction actuelle du Speed Dial natif (H2) |
| F4 | Personnalisation (colonnes, taille, thème, fond) | MVP | Raison d'être du produit |
| F5 | Export et import des réglages | MVP | Les réglages sont perdus à la désinstallation de l'extension |
| F6 | Recherche (signets, puis web) | V2 | Utile, mais le parcours principal reste possible sans |
| F7 | Raccourcis clavier numérotés | V2 | Confort |
| F8 | Sites les plus visités | V2 | Demande la permission `topSites` |
| F9 | Synchronisation des réglages entre ordinateurs | V2 | Seulement si Q3 = oui |
| F10 | Widgets (horloge) | V2 | Décoratif |
| F11 | Compte ou cloud | Hors périmètre | Aucun partage, contraire à H3 |
| F12 | Version mobile | Hors périmètre | Autre plateforme (H1) |
| F13 | IA | Hors périmètre | Aucun besoin |

## 2. Parcours utilisateurs

### P1 — Ouvrir un site

1. L'utilisateur ouvre un nouvel onglet ou la page de démarrage.
2. La page affiche le groupe actif avec ses tuiles.
3. Il clique sur une tuile (ou entre dans un sous-dossier, puis clique).

**Résultat** : le site s'ouvre.

### P2 — Choisir ses dossiers et personnaliser

1. Premier lancement : la page propose de choisir des dossiers de signets.
2. L'utilisateur coche ses dossiers, valide ; un groupe par dossier apparaît.
3. Il ouvre les réglages, change colonnes, taille, thème et fond ; l'effet est immédiat.

**Résultat** : une page à son goût, conservée au redémarrage.

### P3 — Gérer une tuile

1. Dans un groupe, il ajoute un site (titre, adresse).
2. Il glisse la tuile à une autre place, ou modifie son titre et sa vignette.

**Résultat** : le signet correspondant est mis à jour dans Vivaldi.

## 3. Écrans et surfaces

| ID | Écran / surface | Rôle | État vide | Chargement | Erreur | Succès |
|---|---|---|---|---|---|---|
| E1 | Page principale | Groupes + grille de tuiles | Aucun groupe : invitation à choisir des dossiers ; dossier vide : « Ce dossier ne contient aucun signet » + bouton Ajouter | Squelette de tuiles | Bandeau « Impossible de lire les signets » + bouton Réessayer | Tuiles affichées |
| E2 | Sélecteur de dossiers | Arbre des signets avec cases à cocher | « Aucun dossier de signets trouvé » | Indicateur | Message avec Réessayer | Groupes créés |
| E3 | Panneau de réglages | Personnalisation et export/import | Valeurs par défaut | Sans objet | Message sous le champ fautif | Aperçu immédiat |
| E4 | Boîte d'édition de tuile | Ajouter ou modifier titre, adresse, vignette | Champs vides | Sans objet | Message sous le champ | Tuile mise à jour |

## 4. Spécifications du MVP

### F1 — Grille de signets

- **Objectif** : afficher le contenu d'un dossier de signets sous forme de tuiles.
- **Comportement attendu** : une tuile par signet (titre, icône du site ou initiale colorée) ; une tuile « dossier » par sous-dossier ; fil d'Ariane pour revenir en arrière.
- **Règles et limites** : seules les adresses `http` et `https` sont ouvertes ; titre tronqué à deux lignes.
- **Erreurs et cas limites** : dossier vide, adresse non prise en charge, 200 tuiles.
- **Critères d'acceptation** :
  - **AC-F1-1** — Étant donné un dossier contenant 3 signets et 1 sous-dossier, quand la page affiche ce dossier, alors 4 tuiles apparaissent ; chaque signet montre son titre et une icône, le sous-dossier montre une icône de dossier.
  - **AC-F1-2** — Quand l'utilisateur clique sur une tuile de signet, alors l'adresse s'ouvre dans l'onglet courant ; avec Ctrl+clic ou clic molette, elle s'ouvre dans un nouvel onglet.
  - **AC-F1-3** — Quand l'utilisateur clique sur une tuile de dossier, alors son contenu s'affiche avec un fil d'Ariane ; un clic sur un élément du fil revient au niveau choisi.
  - **AC-F1-4** — Étant donné un dossier vide, quand il est affiché, alors le message « Ce dossier ne contient aucun signet » et un bouton Ajouter apparaissent.
  - **AC-F1-5** — Étant donné un dossier de 200 signets, quand la page s'ouvre, alors toutes les tuiles sont affichées en moins d'une seconde sur un ordinateur portable courant.
  - **AC-F1-6** — Étant donné un signet dont l'adresse commence par `javascript:`, quand l'utilisateur clique sur sa tuile, alors rien ne s'ouvre et une infobulle indique « Adresse non prise en charge ».
- **Vérification** : automatique pour la logique (AC-F1-1, 3, 4, 6), manuelle dans Vivaldi pour l'ouverture et la durée (AC-F1-2, 5).

### F2 — Dossiers choisis, en groupes

- **Objectif** : l'utilisateur décide quels dossiers de signets sont affichés.
- **Comportement attendu** : sélecteur en arbre ; un groupe (onglet) par dossier coché ; ordre modifiable ; libellé d'affichage modifiable sans toucher au dossier Vivaldi.
- **Règles et limites** : 1 à 20 groupes ; un même dossier ne peut pas être choisi deux fois.
- **Erreurs et cas limites** : dossier supprimé dans Vivaldi.
- **Critères d'acceptation** :
  - **AC-F2-1** — Étant donné aucun réglage enregistré, quand la page s'ouvre, alors elle affiche l'invitation « Choisir des dossiers » et non une page blanche.
  - **AC-F2-2** — Quand l'utilisateur coche 3 dossiers dans le sélecteur et valide, alors 3 groupes apparaissent, dans l'ordre du cochage.
  - **AC-F2-3** — Quand l'utilisateur clique sur un groupe, alors ses tuiles s'affichent ; à la réouverture de la page, le dernier groupe actif est réaffiché.
  - **AC-F2-4** — Quand l'utilisateur renomme un groupe ou le déplace, alors le libellé et l'ordre sont conservés après redémarrage de Vivaldi, et le nom du dossier dans les signets reste inchangé.
  - **AC-F2-5** — Étant donné un groupe dont le dossier a été supprimé dans Vivaldi, quand la page s'ouvre, alors ce groupe affiche « Dossier introuvable » avec un bouton Retirer, et les autres groupes fonctionnent normalement.
- **Vérification** : automatique (logique et stockage simulé), manuelle pour le redémarrage de Vivaldi.

### F3 — Gestion des tuiles

- **Objectif** : modifier les signets sans quitter la page.
- **Comportement attendu** : bouton Ajouter ; menu contextuel Modifier / Supprimer ; glisser-déposer ; vignette personnalisée.
- **Règles et limites** : titre 1 à 200 caractères ; adresse `http(s)` valide, saisie complète avec `http://` ou `https://` ; image de vignette de 2 Mo au plus (taille recommandée par Vivaldi pour ses vignettes : 440×360 px). Modifier et supprimer ne s'appliquent qu'aux signets : un dossier peut être déplacé mais ni renommé ni supprimé depuis la page (sa suppression pourrait emporter beaucoup de signets). Une vignette est rangée par adresse de signet : deux signets de même adresse la partagent, et modifier l'adresse la déplace. Accès : tuile « Ajouter un site » en fin de grille, menu contextuel (clic droit ou Maj+F10), F2 pour modifier, Suppr pour supprimer, Alt+flèches pour déplacer.
- **Erreurs et cas limites** : adresse invalide, image trop lourde, suppression accidentelle.
- **Critères d'acceptation** :
  - **AC-F3-1** — Quand l'utilisateur ajoute le titre « Exemple » et l'adresse `https://example.com` dans un groupe, alors un signet est créé dans le dossier courant et la tuile apparaît sans rechargement.
  - **AC-F3-2** — Quand l'utilisateur modifie le titre ou l'adresse d'une tuile, alors le signet Vivaldi correspondant porte les nouvelles valeurs ; une adresse invalide est refusée avec un message sous le champ.
  - **AC-F3-3** — Quand l'utilisateur supprime une tuile et confirme, alors le signet est supprimé ; une action « Annuler » reste disponible pendant 10 secondes et restaure le signet.
  - **AC-F3-4** — Quand l'utilisateur déplace une tuile (souris ou clavier), alors le nouvel ordre est affiché et conservé dans le dossier Vivaldi après rechargement.
  - **AC-F3-5** — Quand l'utilisateur choisit une image de 1 Mo comme vignette, alors elle s'affiche sur la tuile et survit au redémarrage ; une image de 3 Mo est refusée avec le message « Image trop lourde (2 Mo maximum) ».
- **Vérification** : automatique pour la validation et la logique, manuelle dans Vivaldi pour les écritures réelles de signets.

### F4 — Personnalisation

- **Objectif** : adapter l'apparence de la page.
- **Comportement attendu** : réglages appliqués en direct ; bouton Réinitialiser.
- **Règles et limites** : colonnes de 2 à 10 ; trois tailles de tuile (petite, moyenne, grande) ; thème clair, sombre ou automatique ; fond : couleur unie, dégradé prédéfini ou image locale de 5 Mo au plus avec voile de lisibilité réglable.
- **Erreurs et cas limites** : valeur hors limites, image trop lourde, fond clair sous du texte clair.
- **Critères d'acceptation** :
  - **AC-F4-1** — Quand l'utilisateur règle le nombre maximal de colonnes sur 6, alors la grille ne dépasse jamais 6 colonnes ; une valeur 1 ou 11 est ramenée à 2 ou 10.
  - **AC-F4-2** — Quand l'utilisateur choisit la taille « grande », alors les tuiles sont plus grandes que la taille « moyenne » et la grille se réorganise sans chevauchement.
  - **AC-F4-3** — Quand l'utilisateur choisit « automatique », alors le thème suit le thème clair ou sombre du système.
  - **AC-F4-4** — Quand l'utilisateur choisit une image de 4 Mo comme fond, alors elle s'affiche ; une image de 6 Mo est refusée avec un message.
  - **AC-F4-5** — Quand un réglage change, alors l'effet est visible sans rechargement et persiste après redémarrage de Vivaldi ; « Réinitialiser » restaure les valeurs par défaut après confirmation.
  - **AC-F4-6** — Sur un fond image avec le voile par défaut, le texte des titres a un contraste d'au moins 4,5:1 (mesuré avec un outil de contraste sur 3 images d'essai : claire, sombre, colorée).
- **Vérification** : automatique pour les limites et le stockage, manuelle pour le rendu et le contraste.

### F5 — Export et import des réglages

- **Objectif** : ne pas perdre ses réglages.
- **Comportement attendu** : fichier JSON versionné contenant groupes (avec chemin du dossier), réglages et images ; import avec confirmation.
- **Règles et limites** : les boutons Exporter et Importer sont dans le panneau Personnaliser. Le fichier contient les groupes (chemin des dossiers et libellés), l'apparence, l'image de fond si le fond est une image, et les vignettes des signets encore présents. Il ne contient aucun identifiant propre à un profil Vivaldi : les dossiers sont retrouvés par leur chemin de titres (si plusieurs dossiers portent le même titre au même niveau, le premier est retenu ; un dossier renommé n'est plus retrouvé). L'import remplace les groupes et la personnalisation ; les vignettes du fichier s'ajoutent ou remplacent celles de même adresse, les autres sont conservées. Tout est vérifié avant la première écriture ; le fichier peut être volumineux (jusqu'à 120 Mo accepté en import).
- **Erreurs et cas limites** : fichier corrompu, version inconnue, dossier absent, image corrompue ou trop lourde dans le fichier.
- **Critères d'acceptation** :
  - **AC-F5-1** — Quand l'utilisateur clique sur Exporter, alors un fichier `speed-dial-reglages-AAAA-MM-JJ.json` est téléchargé, encodé en UTF-8, avec un champ `version`.
  - **AC-F5-2** — Quand l'utilisateur importe un fichier valide et confirme, alors groupes et réglages sont remplacés, et chaque groupe est rattaché à son dossier retrouvé par son chemin ; un dossier absent donne l'état de AC-F2-5.
  - **AC-F5-3** — Quand l'utilisateur importe un fichier invalide ou d'une version inconnue, alors un message d'erreur s'affiche et les réglages actuels restent inchangés.
- **Vérification** : automatique (aller-retour export/import), manuelle pour le téléchargement dans Vivaldi.

## 5. Permissions et données sensibles

| Permission ou donnée | Pourquoi elle est nécessaire | Alternative plus faible envisagée | Ce qui se passe si elle est refusée |
|---|---|---|---|
| `bookmarks` | Lire et modifier les signets (F1 à F3) | Aucune : sans elle, pas de signets | Pas de produit |
| `storage` | Enregistrer les réglages (F2, F4) | `localStorage` de la page, sans permission, mais moins pratique à exporter | Réglages perdus à chaque ouverture |
| `favicon` **[À vérifier]** | Afficher l'icône des sites | Initiale colorée, sans réseau | Icônes remplacées par l'initiale |
| `chrome_url_overrides.newtab` | Remplacer la nouvelle page | Utiliser l'URL de l'extension comme page de démarrage ou signet | La page reste utilisable via son adresse |
| Aucune permission d'hôte | Aucun accès aux sites visités | Sans objet | Sans objet |

Données : titres et adresses de signets, lus localement, jamais envoyés ailleurs.

## 6. Accessibilité

- Tout est utilisable au clavier : tuiles focalisables, Entrée pour ouvrir, Maj+F10 ou touche Menu pour le menu contextuel, Alt+flèches pour déplacer une tuile (alternative au glisser-déposer).
- Focus toujours visible ; boutons et champs avec libellé ; icônes informatives avec texte alternatif.
- Contraste : 4,5:1 minimum pour le texte (AC-F4-6) ; l'état d'une tuile n'est jamais porté par la couleur seule.
- Messages d'erreur annoncés aux lecteurs d'écran (`aria-live`) et indiquant comment corriger.

## 7. Version 2

| ID | Fonctionnalité | Condition pour la lancer |
|---|---|---|
| F6 | Recherche | MVP utilisé 2 semaines ; Q1 la place dans les « fonctionnalités actuelles » |
| F7 | Raccourcis clavier numérotés | Besoin ressenti à l'usage |
| F8 | Sites les plus visités | Besoin confirmé ; accepter la permission `topSites` |
| F9 | Synchronisation des réglages | Q3 = oui ; réglages sous la limite de `storage.sync` |
| F10 | Widgets | Après F4 stabilisée |

## 8. Hors périmètre

| Fonctionnalité | Raison |
|---|---|
| F11 Compte ou cloud | Aucun partage ni multi-utilisateur (H3) |
| F12 Version mobile | Autre produit, autre plateforme (H1) |
| F13 IA | Aucun besoin identifié |
