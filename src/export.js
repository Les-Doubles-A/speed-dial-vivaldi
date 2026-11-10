// Export et import des réglages (F5) : fichier JSON versionné, groupes, apparence et images.
// Tout est validé AVANT la moindre écriture : un fichier refusé ne change rien (AC-F5-3).
import { PREFIXE_VIGNETTE, TAILLE_MAX_FOND, TAILLE_MAX_VIGNETTE, TYPES_IMAGE, cleVignette } from './images.js';
import { CLE_IMAGE_FOND, MAX_GROUPES, fondParDefaut, normaliserReglages } from './reglages.js';
import { adressesDeLArbre, cheminNoeuds, titreAffiche, trouverDossierParChemin } from './signets.js';

export const FORMAT_EXPORT = 'speed-dial-vivaldi';
export const VERSION_EXPORT = 1;
export const TAILLE_MAX_IMPORT = 120 * 1024 * 1024; // garde-fou : fichier d'import de 120 Mo au plus

/** `speed-dial-reglages-AAAA-MM-JJ.json` (AC-F5-1), date locale. */
export function nomFichierExport(date = new Date()) {
  const deux = (n) => String(n).padStart(2, '0');
  return `speed-dial-reglages-${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}.json`;
}

// ---------- Base64 ----------

export async function blobVersBase64(blob) {
  const octets = new Uint8Array(await blob.arrayBuffer());
  let texte = '';
  const paquet = 0x8000; // par paquets, pour ne pas dépasser la pile d'appels
  for (let i = 0; i < octets.length; i += paquet) {
    texte += String.fromCharCode(...octets.subarray(i, i + paquet));
  }
  return btoa(texte);
}

/** Lève une erreur si le texte n'est pas du base64 valide. */
export function base64VersBlob(base64, type) {
  const texte = atob(base64);
  const octets = new Uint8Array(texte.length);
  for (let i = 0; i < texte.length; i++) octets[i] = texte.charCodeAt(i);
  return new Blob([octets], { type });
}

// ---------- Export ----------

/** Chemin de titres du dossier tel qu'il est AUJOURD'HUI ; à défaut, celui mémorisé dans le groupe. */
function cheminActuel(arbre, groupe) {
  const chemin = cheminNoeuds(arbre, groupe.idDossier);
  if (chemin && chemin[chemin.length - 1].url === undefined) return chemin.slice(1).map(titreAffiche);
  return groupe.cheminDossier;
}

/**
 * Construit l'objet exportable. `magasin` = {lire, cles}. Les vignettes ne sont exportées que pour les
 * adresses encore présentes dans les signets (les images orphelines sont laissées de côté).
 */
export async function construireExport({ reglages, arbre, magasin, date = new Date() }) {
  const groupes = reglages.groupes.map((g) => ({ cheminDossier: cheminActuel(arbre, g), libelle: g.libelle }));
  const groupeActif = reglages.groupes.findIndex((g) => g.idDossier === reglages.groupeActif);

  let imageFond = null;
  if (reglages.fond.type === 'image') {
    const blob = await magasin.lire(CLE_IMAGE_FOND);
    if (blob) imageFond = { type: blob.type, donnees: await blobVersBase64(blob) };
  }

  const adresses = adressesDeLArbre(arbre);
  const vignettes = [];
  for (const cle of await magasin.cles()) {
    if (typeof cle !== 'string' || !cle.startsWith(PREFIXE_VIGNETTE)) continue;
    const adresse = cle.slice(PREFIXE_VIGNETTE.length);
    if (!adresses.has(adresse)) continue;
    const blob = await magasin.lire(cle);
    if (blob) vignettes.push({ adresse, type: blob.type, donnees: await blobVersBase64(blob) });
  }

  return {
    format: FORMAT_EXPORT,
    version: VERSION_EXPORT,
    exporteLe: date.toISOString(),
    reglages: {
      groupes,
      groupeActif,
      colonnesMax: reglages.colonnesMax,
      tailleTuile: reglages.tailleTuile,
      theme: reglages.theme,
      fond: reglages.fond,
    },
    images: { fond: imageFond, vignettes },
  };
}

export function serialiserExport(objet) {
  return JSON.stringify(objet, null, 2); // texte, encodé en UTF-8 au téléchargement
}

// ---------- Import ----------

const refus = (message) => ({ ok: false, message });

function decoderImage(image, tailleMax) {
  if (!image || typeof image.donnees !== 'string' || !TYPES_IMAGE.includes(image.type)) return null;
  let blob;
  try {
    blob = base64VersBlob(image.donnees, image.type);
  } catch {
    return null;
  }
  return blob.size <= tailleMax ? blob : null;
}

/**
 * Lit et valide le contenu d'un fichier d'import, sans rien écrire (AC-F5-3).
 * Renvoie { ok: true, donnees } ou { ok: false, message }.
 */
export function lireFichierExport(texte) {
  if (typeof texte !== 'string' || texte.trim() === '') return refus('Fichier vide');
  let objet;
  try {
    objet = JSON.parse(texte);
  } catch {
    return refus("Fichier illisible : ce n'est pas un fichier JSON valide");
  }
  if (!objet || typeof objet !== 'object' || objet.format !== FORMAT_EXPORT) {
    return refus("Ce fichier n'est pas une sauvegarde de Speed Dial Vivaldi");
  }
  if (typeof objet.version !== 'number') return refus('Version de fichier absente');
  if (objet.version !== VERSION_EXPORT) {
    return refus(`Version de fichier inconnue (${objet.version}) : cette extension lit la version ${VERSION_EXPORT}`);
  }

  const r = objet.reglages;
  if (!r || typeof r !== 'object' || !Array.isArray(r.groupes) || r.groupes.length > MAX_GROUPES) {
    return refus('Fichier invalide : groupes incorrects');
  }
  const groupesValides = r.groupes.every(
    (g) => g && Array.isArray(g.cheminDossier) && g.cheminDossier.length > 0 &&
      g.cheminDossier.every((t) => typeof t === 'string') && typeof g.libelle === 'string',
  );
  if (!groupesValides) return refus('Fichier invalide : groupes incorrects');

  const images = objet.images ?? {};
  let blobFond = null;
  if (images.fond) {
    blobFond = decoderImage(images.fond, TAILLE_MAX_FOND);
    if (!blobFond) return refus('Fichier invalide : image de fond corrompue ou trop lourde');
  }
  const vignettes = [];
  for (const v of Array.isArray(images.vignettes) ? images.vignettes : []) {
    const blob = typeof v?.adresse === 'string' ? decoderImage(v, TAILLE_MAX_VIGNETTE) : null;
    if (!blob) return refus('Fichier invalide : une vignette est corrompue ou trop lourde');
    vignettes.push({ adresse: v.adresse, blob });
  }

  return { ok: true, donnees: { reglages: r, blobFond, vignettes } };
}

/**
 * Transforme les données validées en réglages pour CE profil : chaque groupe est rattaché à son dossier retrouvé
 * par son chemin ; un dossier absent donne un groupe « introuvable » (AC-F5-2, AC-F2-5).
 */
export function preparerImport(donnees, arbre) {
  const { reglages: brut, blobFond } = donnees;
  const idsOriginaux = [];
  const groupes = [];
  const vus = new Set();
  for (const g of brut.groupes) {
    const dossier = trouverDossierParChemin(arbre, g.cheminDossier);
    const id = dossier ? dossier.id : `introuvable:${g.cheminDossier.join('/')}`;
    idsOriginaux.push(id);
    if (vus.has(id)) continue;
    vus.add(id);
    groupes.push({ idDossier: id, cheminDossier: g.cheminDossier, libelle: g.libelle });
  }
  const reglages = normaliserReglages({
    version: 1,
    groupes,
    groupeActif: idsOriginaux[brut.groupeActif] ?? '',
    colonnesMax: brut.colonnesMax,
    tailleTuile: brut.tailleTuile,
    theme: brut.theme,
    fond: brut.fond,
  });
  if (reglages.fond.type === 'image' && !blobFond) reglages.fond = fondParDefaut(); // image absente du fichier
  return reglages;
}

/**
 * Écrit les images du fichier (fond, puis vignettes : elles s'ajoutent ou remplacent par adresse, les autres
 * sont conservées) et renvoie les réglages à enregistrer EN DERNIER par l'appelant.
 */
export async function importerSauvegarde({ donnees, arbre, magasin }) {
  const reglages = preparerImport(donnees, arbre);
  if (donnees.blobFond) await magasin.ecrire(CLE_IMAGE_FOND, donnees.blobFond);
  else await magasin.supprimer(CLE_IMAGE_FOND);
  for (const { adresse, blob } of donnees.vignettes) await magasin.ecrire(cleVignette(adresse), blob);
  return { reglages, nombreVignettes: donnees.vignettes.length };
}
