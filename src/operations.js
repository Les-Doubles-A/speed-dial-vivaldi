// Opérations sur les signets (F3) : validation + appels à l'API des signets, injectée pour les tests.
// `api` a la forme de chrome.bookmarks : get, getChildren, create, update, remove, move (asynchrones).
import { estAdresseOuvrable } from './signets.js';

export const LONGUEUR_MAX_TITRE = 200;

/** Valide la saisie d'une tuile : titre de 1 à 200 caractères, adresse http(s) valide (AC-F3-1, AC-F3-2). */
export function validerSaisieTuile(saisie) {
  const titre = String(saisie?.titre ?? '').trim();
  const adresse = String(saisie?.adresse ?? '').trim();
  const erreurs = {};
  if (!titre) erreurs.titre = 'Le titre est obligatoire';
  else if ([...titre].length > LONGUEUR_MAX_TITRE) erreurs.titre = `Titre trop long (${LONGUEUR_MAX_TITRE} caractères maximum)`;
  if (!adresse) erreurs.adresse = "L'adresse est obligatoire";
  else if (!estAdresseOuvrable(adresse)) erreurs.adresse = 'Adresse invalide : elle doit commencer par http:// ou https://';
  const ok = Object.keys(erreurs).length === 0;
  return { ok, erreurs, valeurs: { titre, adresse } };
}

export async function ajouterTuile(api, idDossier, saisie) {
  const verdict = validerSaisieTuile(saisie);
  if (!verdict.ok) return { ok: false, erreurs: verdict.erreurs };
  const noeud = await api.create({ parentId: idDossier, title: verdict.valeurs.titre, url: verdict.valeurs.adresse });
  return { ok: true, noeud };
}

/** Modifie un signet. Les dossiers ne sont pas modifiables depuis la page. */
export async function modifierTuile(api, id, saisie) {
  const verdict = validerSaisieTuile(saisie);
  if (!verdict.ok) return { ok: false, erreurs: verdict.erreurs };
  const [noeud] = await api.get(id);
  if (!noeud || noeud.url === undefined) return { ok: false, erreurs: { titre: "Ce n'est pas un signet" } };
  const noeudModifie = await api.update(id, { title: verdict.valeurs.titre, url: verdict.valeurs.adresse });
  return { ok: true, noeud: noeudModifie };
}

/**
 * Supprime un signet et renvoie de quoi le restaurer (AC-F3-3).
 * Refuse les dossiers : leur suppression pourrait emporter beaucoup de signets.
 */
export async function supprimerTuile(api, id) {
  const [noeud] = await api.get(id);
  if (!noeud || noeud.url === undefined) return { ok: false, message: "Seuls les signets peuvent être supprimés ici" };
  const sauvegarde = { parentId: noeud.parentId, index: noeud.index, title: noeud.title, url: noeud.url };
  await api.remove(id);
  return { ok: true, sauvegarde };
}

/** Recrée un signet supprimé, à sa place d'origine (le nouvel identifiant diffère). */
export async function restaurerTuile(api, sauvegarde) {
  const freres = await api.getChildren(sauvegarde.parentId);
  const index = Math.min(Math.max(sauvegarde.index, 0), freres.length);
  const noeud = await api.create({ parentId: sauvegarde.parentId, index, title: sauvegarde.title, url: sauvegarde.url });
  return { ok: true, noeud };
}

/**
 * Place la tuile à la position demandée dans son dossier (AC-F3-4).
 * Dans Chrome, un déplacement vers l'avant dans le même dossier peut être décalé d'un cran : on vérifie la
 * position obtenue et on corrige une fois au besoin. **[À vérifier]** dans Vivaldi (scénario M5).
 */
export async function deplacerTuile(api, id, indexVoulu) {
  const [noeud] = await api.get(id);
  if (!noeud) return { ok: false, message: 'Tuile introuvable' };
  const freres = await api.getChildren(noeud.parentId);
  if (!Number.isInteger(indexVoulu) || indexVoulu < 0 || indexVoulu >= freres.length) {
    return { ok: false, message: 'Position invalide' };
  }
  if (indexVoulu === noeud.index) return { ok: true };
  const essais = indexVoulu > noeud.index ? [indexVoulu + 1, indexVoulu] : [indexVoulu];
  for (const index of essais) {
    await api.move(id, { parentId: noeud.parentId, index });
    const [apres] = await api.get(id);
    if (apres.index === indexVoulu) return { ok: true };
  }
  return { ok: false, message: "Le navigateur n'a pas placé la tuile à la position demandée" };
}
