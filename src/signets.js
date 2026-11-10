// Logique pure des signets : aucune dépendance à chrome.* pour rester testable (voir tests/).

const SCHEMAS_OUVRABLES = ['http:', 'https:'];

/** Seules les adresses http et https sont ouvertes (AC-F1-6). */
export function estAdresseOuvrable(adresse) {
  if (typeof adresse !== 'string') return false;
  try {
    return SCHEMAS_OUVRABLES.includes(new URL(adresse).protocol);
  } catch {
    return false;
  }
}

/** Titre à afficher : titre du signet, sinon nom d'hôte, sinon texte par défaut. */
export function titreAffiche(noeud) {
  const titre = (noeud.title || '').trim();
  if (titre) return titre;
  if (noeud.url) {
    try {
      return new URL(noeud.url).hostname;
    } catch {
      return noeud.url;
    }
  }
  return 'Sans titre';
}

export function initiale(titre) {
  const premier = [...(titre || '').trim()][0];
  return premier ? premier.toUpperCase() : '?';
}

/** Teinte (0-359) stable pour l'initiale colorée. */
export function teinteInitiale(titre) {
  let teinte = 0;
  for (const caractere of titre || '') {
    teinte = (teinte * 31 + caractere.codePointAt(0)) % 360;
  }
  return teinte;
}

/** Transforme les enfants d'un dossier en tuiles (AC-F1-1). L'ordre de l'API est conservé. */
export function construireTuiles(enfants = []) {
  return enfants.map((noeud, index) => {
    const estDossier = noeud.url === undefined;
    const titre = titreAffiche(noeud);
    return {
      id: noeud.id,
      index, // position parmi les frères : sert au déplacement (F3)
      genre: estDossier ? 'dossier' : 'signet',
      titre,
      adresse: estDossier ? null : noeud.url,
      ouvrable: estDossier ? false : estAdresseOuvrable(noeud.url),
      initiale: initiale(titre),
      teinte: teinteInitiale(titre),
    };
  });
}

/** État de la grille : « vide » déclenche le message de AC-F1-4. */
export function etatGrille(tuiles) {
  return tuiles.length === 0 ? 'vide' : 'pret';
}

function racines(arbre) {
  return Array.isArray(arbre) ? arbre : [arbre];
}

/** Chemin de nœuds (de la racine au nœud demandé), ou null si introuvable. */
export function cheminNoeuds(arbre, id) {
  function parcourir(noeud, trace) {
    const nouvelleTrace = [...trace, noeud];
    if (noeud.id === id) return nouvelleTrace;
    for (const enfant of noeud.children || []) {
      const trouve = parcourir(enfant, nouvelleTrace);
      if (trouve) return trouve;
    }
    return null;
  }
  for (const racine of racines(arbre)) {
    const trouve = parcourir(racine, []);
    if (trouve) return trouve;
  }
  return null;
}

export function trouverNoeud(arbre, id) {
  const chemin = cheminNoeuds(arbre, id);
  return chemin ? chemin[chemin.length - 1] : null;
}

/** Fil d'Ariane du dossier racine du groupe jusqu'au dossier courant (AC-F1-3). */
export function filAriane(arbre, idRacineGroupe, idCourant) {
  const chemin = cheminNoeuds(arbre, idCourant);
  if (!chemin) return null;
  const debut = chemin.findIndex((noeud) => noeud.id === idRacineGroupe);
  if (debut === -1) return null;
  return chemin.slice(debut).map((noeud) => ({ id: noeud.id, titre: titreAffiche(noeud) }));
}

/** Liste à plat de tous les dossiers (hors racine) pour le sélecteur de F2. */
export function listerDossiers(arbre) {
  const resultat = [];
  function parcourir(noeud, titres, profondeur) {
    for (const enfant of noeud.children || []) {
      if (enfant.url !== undefined) continue;
      const chemin = [...titres, titreAffiche(enfant)];
      resultat.push({ id: enfant.id, titre: titreAffiche(enfant), chemin, profondeur });
      parcourir(enfant, chemin, profondeur + 1);
    }
  }
  for (const racine of racines(arbre)) parcourir(racine, [], 0);
  return resultat;
}

/**
 * Retrouve un dossier à partir de son chemin de titres (sans la racine), ou null.
 * S'il y a plusieurs dossiers de même titre au même niveau, le premier est retenu.
 */
export function trouverDossierParChemin(arbre, chemin) {
  if (!Array.isArray(chemin) || chemin.length === 0) return null;
  let courant = racines(arbre)[0];
  for (const titre of chemin) {
    courant = (courant?.children || []).find((e) => e.url === undefined && titreAffiche(e) === titre);
    if (!courant) return null;
  }
  return courant;
}

/** Toutes les adresses de signets de l'arbre (pour ne sauvegarder que les vignettes encore utiles). */
export function adressesDeLArbre(arbre) {
  const adresses = new Set();
  function parcourir(noeud) {
    if (noeud.url !== undefined) adresses.add(noeud.url);
    for (const enfant of noeud.children || []) parcourir(enfant);
  }
  for (const racine of racines(arbre)) parcourir(racine);
  return adresses;
}
