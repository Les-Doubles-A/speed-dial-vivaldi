# Speed Dial Vivaldi — Product Brief

> Version 1 · 2026-10-17 · Statut : brouillon à valider
> Légende : **[Fait]** vérifié (source ou « exprimé par l'utilisateur ») · **[H#]** hypothèse · **[Reco]** recommandation · **[À vérifier]**

## 1. Concept

Une page Speed Dial de remplacement pour Vivaldi (desktop) : elle affiche les signets et les dossiers de signets que l'utilisateur choisit, reprend les fonctions du Speed Dial actuel et ajoute une personnalisation plus poussée que celle des réglages de Vivaldi.

## 2. Problème

- **[Fait]** L'utilisateur veut une nouvelle page Speed Dial pour Vivaldi, avec toutes les fonctionnalités actuelles, plus de personnalisation, et l'affichage des signets et de dossiers choisis (exprimé par l'utilisateur).
- **[Fait]** Dans Vivaldi, un Speed Dial est un signet ; plusieurs dossiers de signets peuvent être affichés, avec sous-dossiers, vignette personnalisée, fond, nombre maximal de colonnes et taille des vignettes (aide Vivaldi, consultée le 2026-10-17).
- **[H2]** La limite ressentie porte sur la personnalisation (mise en page, thèmes, fond, libellés), pas sur le principe « signets = tuiles ».

## 3. Utilisateurs

- **Utilisateur principal** : l'utilisateur lui-même, sur son ordinateur, avec Vivaldi **[H1, H3]**.
- **Utilisateurs secondaires** : aucun pour le MVP.
- **Hors cible** : Vivaldi mobile, autres navigateurs, partage entre personnes.

## 4. Alternatives actuelles

| Alternative | Ce qu'elle fait bien | Limite pour notre cible | Statut de l'information |
|---|---|---|---|
| Ne rien faire : Speed Dial natif de Vivaldi | Intégré, tuiles = signets, dossiers multiples, sous-dossiers, vignette perso, fond, colonnes, taille | Personnalisation limitée aux réglages proposés | Vérifié le 2026-10-17 (help.vivaldi.com/article/speed-dials/) |
| Extensions de speed dial du Chrome Web Store | Remplacent la nouvelle page | Le comportement comme page de démarrage de Vivaldi a posé problème à des utilisateurs (forum Vivaldi) ; disponibilité actuelle non revérifiée | Mentionnées sur le forum Vivaldi (topics 57474, 84760) ; **[À vérifier]** aujourd'hui |
| Modification de Vivaldi par CSS/JS | Personnalisation très poussée | Fragile après mises à jour, hors extension | Mentionnée sur le forum Vivaldi (post 248485) ; **[À vérifier]** |

## 5. Proposition de valeur

Un Speed Dial entièrement maîtrisé par l'utilisateur, au-dessus de ses vrais signets Vivaldi. Différences : (1) il choisit lui-même les dossiers affichés et leur ordre ; (2) apparence réglable bien au-delà des options natives ; (3) aucune donnée dupliquée, car les tuiles restent des signets ; (4) réglages exportables.

**Évaluation franche** : le Speed Dial natif couvre déjà l'essentiel. La valeur repose uniquement sur la personnalisation et le contrôle. Si le prototype ne montre pas un gain net en deux semaines d'usage, le plus raisonnable est de rester sur le natif.

## 6. Hypothèses

| ID | Hypothèse | Type | Si elle est fausse | Comment la tester | Coût du test |
|---|---|---|---|---|---|
| H1 | Cible : Vivaldi desktop, extension Chromium Manifest V3 chargée non empaquetée | Technique | Revoir la plateforme (mobile = autre produit) | Charger T1 dans Vivaldi | 30 min |
| H2 | « Fonctionnalités actuelles » = celles du Speed Dial natif de Vivaldi (tuiles, groupes, sous-dossiers, ajout/édition/suppression, tri manuel, vignette perso, fond, colonnes, taille) | Usage | La liste F1–F5 est à refaire | Confirmer avec l'utilisateur ; comparer à sa page Speed Dial actuelle (voir Q1) | 5 min |
| H3 | Usage personnel, un seul ordinateur, pas de compte ni de serveur | Usage | Synchronisation = nouvelle architecture | Confirmer | 1 min |
| H4 | `chrome.bookmarks` lit et écrit l'arbre des signets dans Vivaldi | Technique | Page en lecture seule ou stockage propre des tuiles | Prototype T2 | 1 h |
| H5 | Les captures d'écran natives de Vivaldi ne sont pas accessibles à une extension ; vignettes = icône du site, image locale ou initiale colorée | Technique | Vignettes natives réutilisables | Inspecter les signets dans T2 | 30 min |
| H6 | Vivaldi permet d'utiliser la page d'extension comme nouvel onglet et comme page de démarrage (URL `chrome-extension://…`) | Technique | Repli : la page reste accessible en nouvel onglet ou en signet | Scénario M1 | 15 min |
| H7 | Les dossiers marqués « Speed Dial » par Vivaldi ne sont pas identifiables comme tels via l'API standard ; l'utilisateur choisit donc ses dossiers | Technique | Détection automatique possible | Prototype T2 | 30 min |

## 7. Tester l'intérêt avant d'investir

Réaliser la tranche 1 (T1–T3) et l'utiliser comme page de démarrage pendant deux semaines. **Arrêt ou pivot** si, au bout de deux semaines, l'utilisateur revient au Speed Dial natif plus d'une fois par jour, ou si H4 ou H6 s'avèrent faux.

## 8. Objectifs et indicateurs de réussite

| Objectif | Indicateur | Seuil de réussite du MVP | Mesure |
|---|---|---|---|
| Remplacer le Speed Dial natif au quotidien | Jours d'usage sur 14 | 12 jours sur 14 sans retour au natif | Auto-observation |
| Rapidité | Affichage de 200 tuiles | Moins de 1 s | Test M-perf (AC-F1-5) |
| Personnalisation | Réglages disponibles | Colonnes, taille, thème, fond (AC-F4-1 à AC-F4-6) | Matrice de couverture |

## 9. Périmètre du MVP

- **MVP** : F1 grille de signets · F2 dossiers choisis en groupes · F3 gestion des tuiles · F4 personnalisation · F5 export/import des réglages
- **Version 2** : F6 recherche · F7 raccourcis clavier numérotés · F8 sites les plus visités · F9 synchronisation des réglages · F10 widgets (horloge)
- **Hors périmètre** : F11 compte ou cloud · F12 version mobile · F13 IA

## 10. Contraintes

- **[Fait]** Cible : le navigateur Vivaldi (exprimé par l'utilisateur).
- **[Fait]** Fonctionnalités actuelles conservées, personnalisation en plus, affichage des signets et de dossiers choisis (exprimé par l'utilisateur).
- **[Reco]** Code en français (commentaires, messages de journal, noms de variables), conforme aux habitudes de l'utilisateur.

## 11. Questions ouvertes

- **Q1** : « Fonctionnalités actuelles » désigne-t-il le Speed Dial natif de Vivaldi, ou la page Speed Dial déjà présente dans l'extension Link Peek ? Dans le second cas, envoie le code (zip) : le plan sera aligné dessus, ou le mode amélioration sera plus adapté.
- **Q2** : quelles personnalisations comptent le plus (fond, taille, thèmes, forme des tuiles, polices) ? Ordre de priorité si le MVP doit être réduit.
- **Q3** : usage sur plusieurs ordinateurs ? Si oui, F9 passe dans le MVP.

## Sources

- Vivaldi, « Speed Dials » : https://help.vivaldi.com/article/speed-dials/ (consulté le 2026-10-17)
- Vivaldi, astuce 577 (vignette de dossier, taille recommandée 440×360 px) : https://vivaldi.com/blog/tips/tip-577 (consulté le 2026-10-17)
- Forum Vivaldi, « Speed Dials are just bookmarks » : https://forum.vivaldi.net/topic/115964/speed-dial-thumbnail-resizing (consulté le 2026-10-17)
- Forum Vivaldi, extension comme page de démarrage : https://forum.vivaldi.net/topic/57474/extension-as-start-page et https://forum.vivaldi.net/topic/84760/vivaldi-built-in-start-page-overrides-extension-with-new-tab-at-browser-launch/6 (consultés le 2026-10-17 ; messages anciens, comportement actuel **[À vérifier]**)
