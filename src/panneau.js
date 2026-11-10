// Panneau « Personnaliser » (F4) : lit les contrôles, applique aussitôt, sans rechargement.
import {
  CLE_IMAGE_FOND,
  DEGRADES,
  definirColonnes,
  definirFond,
  definirTaille,
  definirTheme,
  reinitialiserApparence,
} from './reglages.js';
import { TAILLE_MAX_FOND, enregistrerImage, lireImage, supprimerImage, validerImage } from './images.js';

/**
 * obtenirReglages() : réglages courants.
 * changer(nouveaux) : enregistre, applique l'apparence (async).
 * obtenirBase() : base IndexedDB (ou null si indisponible).
 */
export function initialiserPanneau({ obtenirReglages, changer, obtenirBase }) {
  const $ = (id) => document.getElementById(id);
  const el = {
    dialogue: $('dialogue-apparence'),
    colonnes: $('reglage-colonnes'),
    erreurColonnes: $('erreur-colonnes'),
    taille: $('reglage-taille'),
    theme: $('reglage-theme'),
    fondType: $('reglage-fond-type'),
    zoneCouleur: $('zone-couleur'),
    couleur: $('reglage-couleur'),
    zoneDegrade: $('zone-degrade'),
    degrade: $('reglage-degrade'),
    zoneImage: $('zone-image'),
    image: $('reglage-image'),
    erreurImage: $('erreur-image'),
    voile: $('reglage-voile'),
  };

  for (const degrade of DEGRADES) {
    const option = document.createElement('option');
    option.value = degrade.id;
    option.textContent = degrade.nom;
    el.degrade.append(option);
  }

  function afficherZones(type) {
    el.zoneCouleur.hidden = type !== 'couleur';
    el.zoneDegrade.hidden = type !== 'degrade';
    el.zoneImage.hidden = type !== 'image';
  }

  /** Recopie les réglages dans les contrôles. */
  function synchroniser() {
    const r = obtenirReglages();
    el.colonnes.value = String(r.colonnesMax);
    el.taille.value = r.tailleTuile;
    el.theme.value = r.theme;
    el.fondType.value = r.fond.type;
    if (r.fond.type === 'couleur') el.couleur.value = r.fond.valeur;
    if (r.fond.type === 'degrade') el.degrade.value = r.fond.valeur;
    el.voile.value = String(r.fond.voile);
    afficherZones(r.fond.type);
    el.erreurColonnes.textContent = '';
    el.erreurImage.textContent = '';
  }

  el.colonnes.addEventListener('change', async () => {
    const saisie = el.colonnes.value;
    const nouveau = definirColonnes(obtenirReglages(), saisie);
    el.erreurColonnes.textContent =
      String(nouveau.colonnesMax) !== saisie.trim()
        ? `Valeur ramenée à ${nouveau.colonnesMax} (entre 2 et 10).`
        : '';
    el.colonnes.value = String(nouveau.colonnesMax);
    await changer(nouveau);
  });

  el.taille.addEventListener('change', () => changer(definirTaille(obtenirReglages(), el.taille.value)));
  el.theme.addEventListener('change', () => changer(definirTheme(obtenirReglages(), el.theme.value)));

  el.fondType.addEventListener('change', async () => {
    const type = el.fondType.value;
    const r = obtenirReglages();
    afficherZones(type);
    el.erreurImage.textContent = '';
    if (type === 'theme') {
      await changer(definirFond(r, { type, valeur: '', voile: r.fond.voile }));
    } else if (type === 'couleur') {
      await changer(definirFond(r, { type, valeur: el.couleur.value, voile: r.fond.voile }));
    } else if (type === 'degrade') {
      await changer(definirFond(r, { type, valeur: el.degrade.value, voile: r.fond.voile }));
    } else if (type === 'image') {
      // On n'active le fond image que si une image est déjà stockée ; sinon on attend le choix du fichier.
      const base = obtenirBase();
      const existante = base ? await lireImage(base, CLE_IMAGE_FOND).catch(() => null) : null;
      if (existante) await changer(definirFond(r, { type, valeur: CLE_IMAGE_FOND, voile: r.fond.voile }));
    }
  });

  el.couleur.addEventListener('input', () => {
    const r = obtenirReglages();
    changer(definirFond(r, { type: 'couleur', valeur: el.couleur.value, voile: r.fond.voile }));
  });

  el.degrade.addEventListener('change', () => {
    const r = obtenirReglages();
    changer(definirFond(r, { type: 'degrade', valeur: el.degrade.value, voile: r.fond.voile }));
  });

  el.image.addEventListener('change', async () => {
    const fichier = el.image.files?.[0];
    if (!fichier) return;
    const verdict = validerImage(fichier, TAILLE_MAX_FOND); // AC-F4-4 : refus sans toucher au fond actuel
    if (!verdict.ok) {
      el.erreurImage.textContent = verdict.message;
      el.image.value = '';
      return;
    }
    const base = obtenirBase();
    if (!base) {
      el.erreurImage.textContent = "Stockage des images indisponible dans ce navigateur.";
      el.image.value = '';
      return;
    }
    try {
      await enregistrerImage(base, CLE_IMAGE_FOND, fichier);
    } catch (erreur) {
      console.error("Impossible d'enregistrer l'image de fond :", erreur);
      el.erreurImage.textContent = "Impossible d'enregistrer l'image.";
      return;
    }
    el.erreurImage.textContent = '';
    const r = obtenirReglages();
    await changer(definirFond(r, { type: 'image', valeur: CLE_IMAGE_FOND, voile: r.fond.voile }));
  });

  el.voile.addEventListener('input', () => {
    const r = obtenirReglages();
    changer(definirFond(r, { ...r.fond, voile: el.voile.value }));
  });

  $('bouton-reinitialiser').addEventListener('click', async () => {
    if (!window.confirm('Réinitialiser toute la personnalisation (colonnes, taille, thème, fond) ?')) return;
    const base = obtenirBase();
    if (base) await supprimerImage(base, CLE_IMAGE_FOND).catch((e) => console.error('Suppression du fond :', e));
    await changer(reinitialiserApparence(obtenirReglages()));
    el.image.value = '';
    synchroniser();
  });

  $('bouton-fermer-apparence').addEventListener('click', () => el.dialogue.close());
  $('bouton-apparence').addEventListener('click', () => {
    synchroniser();
    el.dialogue.showModal();
  });
}
