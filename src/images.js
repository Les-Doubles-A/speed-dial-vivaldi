// Images locales (fond de page ici, vignettes en T6) : validation pure + stockage IndexedDB.

export const TAILLE_MAX_FOND = 5 * 1024 * 1024; // 5 Mo (AC-F4-4)
export const TAILLE_MAX_VIGNETTE = 2 * 1024 * 1024; // 2 Mo (AC-F3-5, T6)
export const TYPES_IMAGE = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/** Contrôle le type et la taille d'un fichier choisi. Message prêt à afficher en cas de refus. */
export function validerImage(fichier, tailleMax) {
  if (!fichier || typeof fichier.size !== 'number') {
    return { ok: false, message: 'Aucun fichier choisi' };
  }
  if (!TYPES_IMAGE.includes(fichier.type)) {
    return { ok: false, message: 'Format non pris en charge (PNG, JPEG, WebP ou GIF)' };
  }
  if (fichier.size > tailleMax) {
    return { ok: false, message: `Image trop lourde (${Math.round(tailleMax / (1024 * 1024))} Mo maximum)` };
  }
  return { ok: true, message: '' };
}

// ---------- IndexedDB ----------

const NOM_BASE = 'speeddial';
const NOM_MAGASIN = 'images';

export function ouvrirBase(usine = globalThis.indexedDB) {
  return new Promise((resoudre, rejeter) => {
    const requete = usine.open(NOM_BASE, 1);
    requete.onupgradeneeded = () => requete.result.createObjectStore(NOM_MAGASIN);
    requete.onsuccess = () => resoudre(requete.result);
    requete.onerror = () => rejeter(requete.error);
  });
}

function dansTransaction(base, mode, action) {
  return new Promise((resoudre, rejeter) => {
    const transaction = base.transaction(NOM_MAGASIN, mode);
    const requete = action(transaction.objectStore(NOM_MAGASIN));
    transaction.oncomplete = () => resoudre(requete.result);
    transaction.onerror = () => rejeter(transaction.error);
    transaction.onabort = () => rejeter(transaction.error);
  });
}

export const enregistrerImage = (base, cle, blob) => dansTransaction(base, 'readwrite', (m) => m.put(blob, cle));
export const lireImage = (base, cle) => dansTransaction(base, 'readonly', (m) => m.get(cle));
export const supprimerImage = (base, cle) => dansTransaction(base, 'readwrite', (m) => m.delete(cle));
export const listerCles = (base) => dansTransaction(base, 'readonly', (m) => m.getAllKeys());

// ---------- Vignettes personnalisées (F3, T6) ----------
// Une vignette est rangée sous l'ADRESSE du signet, pas sous son identifiant : un signet supprimé puis
// restauré reçoit un nouvel identifiant, alors que son adresse ne change pas (et l'export de T7 s'en sert).
// Conséquence : deux signets de même adresse partagent la même vignette.

export const PREFIXE_VIGNETTE = 'vignette:';
export const cleVignette = (adresse) => PREFIXE_VIGNETTE + adresse;

/** Magasin {lire, ecrire, supprimer, cles} au-dessus d'IndexedDB ; les tests utilisent un magasin en mémoire. */
export function magasinDepuisBase(base) {
  return {
    lire: (cle) => lireImage(base, cle),
    ecrire: (cle, blob) => enregistrerImage(base, cle, blob),
    supprimer: (cle) => supprimerImage(base, cle),
    cles: () => listerCles(base),
  };
}

/** Valide (2 Mo maximum) puis enregistre. En cas de refus, rien n'est écrit et l'ancienne vignette reste. */
export async function definirVignette(magasin, adresse, fichier) {
  const verdict = validerImage(fichier, TAILLE_MAX_VIGNETTE);
  if (!verdict.ok) return verdict;
  // Copie en Blob simple : le nom du fichier d'origine n'est pas conservé.
  await magasin.ecrire(cleVignette(adresse), new Blob([fichier], { type: fichier.type }));
  return verdict;
}

export async function retirerVignette(magasin, adresse) {
  await magasin.supprimer(cleVignette(adresse));
}

/** Quand l'adresse d'un signet change, sa vignette suit. Renvoie vrai si une vignette a été déplacée. */
export async function changerAdresseVignette(magasin, ancienneAdresse, nouvelleAdresse) {
  if (ancienneAdresse === nouvelleAdresse) return false;
  const blob = await magasin.lire(cleVignette(ancienneAdresse));
  if (!blob) return false;
  await magasin.ecrire(cleVignette(nouvelleAdresse), blob);
  await magasin.supprimer(cleVignette(ancienneAdresse));
  return true;
}

/** Lit les vignettes de plusieurs adresses d'un coup : Map adresse → Blob (seules les adresses ayant une vignette). */
export async function lireVignettes(magasin, adresses) {
  const uniques = [...new Set(adresses)];
  const lues = await Promise.all(uniques.map((adresse) => magasin.lire(cleVignette(adresse))));
  const resultat = new Map();
  uniques.forEach((adresse, i) => {
    if (lues[i]) resultat.set(adresse, lues[i]);
  });
  return resultat;
}
