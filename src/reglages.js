// Réglages de la page : validation, groupes (dossiers choisis, F2) et apparence (F4), persistance.
import { trouverNoeud } from './signets.js';

export const VERSION_REGLAGES = 1;
export const MAX_GROUPES = 20;
const LONGUEUR_MAX_LIBELLE = 60;

// ---------- Apparence (F4) ----------

export const COLONNES_MIN = 2;
export const COLONNES_MAX = 10;
export const COLONNES_DEFAUT = 6;

export const TAILLES = ['petite', 'moyenne', 'grande'];
export const TAILLES_REM = { petite: 7, moyenne: 9, grande: 12 }; // largeur d'une tuile
export const TAILLE_DEFAUT = 'moyenne';

export const THEMES = ['clair', 'sombre', 'auto'];
export const THEME_DEFAUT = 'auto';

export const VOILE_MIN = 0;
export const VOILE_MAX = 80;
export const VOILE_DEFAUT = 40;

export const CLE_IMAGE_FOND = 'fond'; // clé de l'image de fond dans IndexedDB

export const DEGRADES = [
  { id: 'aurore', nom: 'Aurore', css: 'linear-gradient(135deg, #ff9a8b, #ff6a88 55%, #ff99ac)' },
  { id: 'ocean', nom: 'Océan', css: 'linear-gradient(135deg, #2193b0, #6dd5ed)' },
  { id: 'foret', nom: 'Forêt', css: 'linear-gradient(135deg, #134e5e, #71b280)' },
  { id: 'nuit', nom: 'Nuit', css: 'linear-gradient(135deg, #0f2027, #203a43 50%, #2c5364)' },
];

const MOTIF_COULEUR = /^#[0-9a-fA-F]{6}$/;

/** Entier ramené dans [min, max] ; valeur vide ou non numérique → défaut (AC-F4-1). */
export function bornerEntier(valeur, min, max, defaut) {
  if (valeur === '' || valeur === null || valeur === undefined) return defaut;
  const nombre = Math.round(Number(valeur));
  if (!Number.isFinite(nombre)) return defaut;
  return Math.min(max, Math.max(min, nombre));
}

export function fondParDefaut() {
  return { type: 'theme', valeur: '', voile: VOILE_DEFAUT };
}

/** Fond valide ou null : couleur #rrggbb, dégradé connu, image stockée sous la clé « fond ». */
export function normaliserFond(brut) {
  if (!brut || typeof brut !== 'object') return null;
  const voile = bornerEntier(brut.voile, VOILE_MIN, VOILE_MAX, VOILE_DEFAUT);
  switch (brut.type) {
    case 'theme':
      return { type: 'theme', valeur: '', voile };
    case 'couleur':
      return MOTIF_COULEUR.test(brut.valeur) ? { type: 'couleur', valeur: brut.valeur.toLowerCase(), voile } : null;
    case 'degrade':
      return DEGRADES.some((d) => d.id === brut.valeur) ? { type: 'degrade', valeur: brut.valeur, voile } : null;
    case 'image':
      return brut.valeur === CLE_IMAGE_FOND ? { type: 'image', valeur: CLE_IMAGE_FOND, voile } : null;
    default:
      return null;
  }
}

export function apparenceParDefaut() {
  return {
    colonnesMax: COLONNES_DEFAUT,
    tailleTuile: TAILLE_DEFAUT,
    theme: THEME_DEFAUT,
    fond: fondParDefaut(),
  };
}

function normaliserApparence(brut) {
  const defaut = apparenceParDefaut();
  return {
    colonnesMax: bornerEntier(brut.colonnesMax, COLONNES_MIN, COLONNES_MAX, defaut.colonnesMax),
    tailleTuile: TAILLES.includes(brut.tailleTuile) ? brut.tailleTuile : defaut.tailleTuile,
    theme: THEMES.includes(brut.theme) ? brut.theme : defaut.theme,
    fond: normaliserFond(brut.fond) ?? defaut.fond,
  };
}

export function definirColonnes(reglages, valeur) {
  return { ...reglages, colonnesMax: bornerEntier(valeur, COLONNES_MIN, COLONNES_MAX, COLONNES_DEFAUT) };
}

export function definirTaille(reglages, taille) {
  return TAILLES.includes(taille) ? { ...reglages, tailleTuile: taille } : reglages;
}

export function definirTheme(reglages, theme) {
  return THEMES.includes(theme) ? { ...reglages, theme } : reglages;
}

/** Fond invalide : réglages inchangés. */
export function definirFond(reglages, fond) {
  const propre = normaliserFond(fond);
  return propre ? { ...reglages, fond: propre } : reglages;
}

/** Remet l'apparence par défaut ; les groupes (dossiers choisis) sont conservés. */
export function reinitialiserApparence(reglages) {
  return { ...reglages, ...apparenceParDefaut() };
}

// ---------- Groupes (F2) ----------

export function reglagesParDefaut() {
  return { version: VERSION_REGLAGES, groupes: [], groupeActif: '', ...apparenceParDefaut() };
}

function groupeValide(g) {
  return (
    g &&
    typeof g.idDossier === 'string' &&
    g.idDossier !== '' &&
    Array.isArray(g.cheminDossier) &&
    g.cheminDossier.every((t) => typeof t === 'string') &&
    typeof g.libelle === 'string'
  );
}

/** Nettoie des réglages lus dans le stockage : jamais d'exception, valeurs par défaut en repli. */
export function normaliserReglages(brut) {
  const base = reglagesParDefaut();
  if (!brut || typeof brut !== 'object' || brut.version !== VERSION_REGLAGES) return base;
  const vus = new Set();
  const groupes = [];
  for (const g of Array.isArray(brut.groupes) ? brut.groupes : []) {
    if (!groupeValide(g) || vus.has(g.idDossier) || groupes.length >= MAX_GROUPES) continue;
    vus.add(g.idDossier);
    groupes.push({ idDossier: g.idDossier, cheminDossier: g.cheminDossier, libelle: g.libelle });
  }
  const actifValide = groupes.some((g) => g.idDossier === brut.groupeActif);
  return {
    version: VERSION_REGLAGES,
    groupes,
    groupeActif: actifValide ? brut.groupeActif : groupes[0]?.idDossier ?? '',
    ...normaliserApparence(brut),
  };
}

/** Coche ou décoche un dossier : un groupe par dossier, dans l'ordre du cochage (AC-F2-2). */
export function basculerDossier(reglages, dossier, coche) {
  const existe = reglages.groupes.some((g) => g.idDossier === dossier.id);
  let groupes = reglages.groupes;
  if (coche && !existe) {
    if (groupes.length >= MAX_GROUPES) return reglages;
    groupes = [...groupes, { idDossier: dossier.id, cheminDossier: dossier.chemin, libelle: dossier.titre }];
  } else if (!coche && existe) {
    groupes = groupes.filter((g) => g.idDossier !== dossier.id);
  } else {
    return reglages;
  }
  const actifPresent = groupes.some((g) => g.idDossier === reglages.groupeActif);
  return { ...reglages, groupes, groupeActif: actifPresent ? reglages.groupeActif : groupes[0]?.idDossier ?? '' };
}

/** Renomme le libellé d'affichage seulement ; le dossier Vivaldi n'est jamais touché (AC-F2-4). */
export function renommerGroupe(reglages, idDossier, libelle) {
  const propre = String(libelle).trim().slice(0, LONGUEUR_MAX_LIBELLE);
  if (!propre) return reglages;
  return {
    ...reglages,
    groupes: reglages.groupes.map((g) => (g.idDossier === idDossier ? { ...g, libelle: propre } : g)),
  };
}

export function deplacerGroupe(reglages, idDossier, decalage) {
  const depart = reglages.groupes.findIndex((g) => g.idDossier === idDossier);
  const arrivee = depart + decalage;
  if (depart === -1 || arrivee < 0 || arrivee >= reglages.groupes.length) return reglages;
  const groupes = [...reglages.groupes];
  const [groupe] = groupes.splice(depart, 1);
  groupes.splice(arrivee, 0, groupe);
  return { ...reglages, groupes };
}

export function definirGroupeActif(reglages, idDossier) {
  if (!reglages.groupes.some((g) => g.idDossier === idDossier)) return reglages;
  return { ...reglages, groupeActif: idDossier };
}

/** « introuvable » si le dossier a été supprimé dans Vivaldi (AC-F2-5). */
export function statutGroupe(groupe, arbre) {
  const noeud = trouverNoeud(arbre, groupe.idDossier);
  return noeud && noeud.url === undefined ? 'ok' : 'introuvable';
}

export async function chargerReglages(stockage) {
  const lu = await stockage.get('reglages');
  return normaliserReglages(lu?.reglages);
}

export async function enregistrerReglages(stockage, reglages) {
  await stockage.set({ reglages });
}
