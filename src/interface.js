// Interface de la page : rendu et événements. La logique est dans signets.js et reglages.js.
// Vérifiée manuellement dans Vivaldi (scénarios M1 à M5), pas par tests automatiques.
import { appliquerApparence } from './apparence.js';
import {
  TAILLE_MAX_VIGNETTE,
  changerAdresseVignette,
  definirVignette,
  lireImage,
  lireVignettes,
  magasinDepuisBase,
  ouvrirBase,
  retirerVignette,
  validerImage,
} from './images.js';
import { initialiserPanneau } from './panneau.js';
import { initialiserSauvegarde } from './sauvegarde.js';
import { ajouterTuile, deplacerTuile, modifierTuile, restaurerTuile, supprimerTuile } from './operations.js';
import {
  construireTuiles,
  etatGrille,
  filAriane,
  listerDossiers,
  trouverNoeud,
} from './signets.js';
import {
  CLE_IMAGE_FOND,
  basculerDossier,
  chargerReglages,
  definirGroupeActif,
  deplacerGroupe,
  enregistrerReglages,
  renommerGroupe,
  statutGroupe,
} from './reglages.js';

const el = {
  groupes: document.getElementById('groupes'),
  fil: document.getElementById('fil'),
  statut: document.getElementById('statut'),
  grille: document.getElementById('grille'),
  dialogue: document.getElementById('dialogue'),
  listeGroupes: document.getElementById('liste-groupes'),
  arbre: document.getElementById('arbre'),
  boutonGerer: document.getElementById('bouton-gerer'),
  boutonFermer: document.getElementById('bouton-fermer'),
};

const etat = {
  arbre: [],
  reglages: null,
  dossierCourant: '', // dossier affiché dans le groupe actif (peut être un sous-dossier)
  versionRendu: 0, // invalide les chargements de vignettes d'un rendu périmé
};

function creer(balise, classe, texte) {
  const noeud = document.createElement(balise);
  if (classe) noeud.className = classe;
  if (texte !== undefined) noeud.textContent = texte; // toujours du texte, jamais du HTML
  return noeud;
}

function annoncer(message, erreur = false) {
  el.statut.textContent = message;
  el.statut.classList.toggle('erreur', erreur);
}

async function sauvegarder() {
  await enregistrerReglages(chrome.storage.local, etat.reglages);
}

// ---------- Apparence (F4) ----------

let base = null; // base IndexedDB des images, ou null si indisponible
let urlFond = ''; // adresse temporaire de l'image de fond

/** Applique l'apparence ; l'image de fond est relue depuis IndexedDB. */
async function majApparence() {
  let url = '';
  if (etat.reglages.fond.type === 'image' && base) {
    try {
      const image = await lireImage(base, CLE_IMAGE_FOND);
      if (image) url = URL.createObjectURL(image);
    } catch (erreur) {
      console.error("Impossible de lire l'image de fond :", erreur);
    }
  }
  appliquerApparence(document, etat.reglages, url);
  if (urlFond) URL.revokeObjectURL(urlFond); // libère l'ancienne image après application de la nouvelle
  urlFond = url;
}

/** Après un import (F5) : les nouveaux réglages remplacent les anciens et la page est redessinée. */
async function appliquerReglagesImportes(nouveaux) {
  etat.reglages = nouveaux;
  etat.dossierCourant = nouveaux.groupeActif;
  await sauvegarder(); // en dernier : les images ont déjà été écrites
  await majApparence();
  rendreTout();
}

/** Point d'entrée du panneau : enregistre puis applique, sans rechargement (AC-F4-5). */
async function changerReglages(nouveaux) {
  etat.reglages = nouveaux;
  await sauvegarder();
  await majApparence();
}

async function lireArbre() {
  etat.arbre = await chrome.bookmarks.getTree();
}

function groupeActif() {
  return etat.reglages.groupes.find((g) => g.idDossier === etat.reglages.groupeActif);
}

// ---------- Rendu ----------

function rendreOnglets() {
  el.groupes.replaceChildren();
  for (const groupe of etat.reglages.groupes) {
    const introuvable = statutGroupe(groupe, etat.arbre) === 'introuvable';
    const onglet = creer('button', 'onglet' + (introuvable ? ' introuvable' : ''), groupe.libelle);
    onglet.type = 'button';
    onglet.setAttribute('role', 'tab');
    onglet.setAttribute('aria-selected', String(groupe.idDossier === etat.reglages.groupeActif));
    onglet.addEventListener('click', async () => {
      etat.reglages = definirGroupeActif(etat.reglages, groupe.idDossier);
      etat.dossierCourant = groupe.idDossier;
      await sauvegarder();
      rendreTout();
    });
    el.groupes.append(onglet);
  }
}

function rendreFil(groupe) {
  el.fil.replaceChildren();
  const fil = filAriane(etat.arbre, groupe.idDossier, etat.dossierCourant);
  if (!fil || fil.length < 2) return; // pas de fil à la racine du groupe
  fil.forEach((element, i) => {
    if (i > 0) el.fil.append(creer('span', '', '›'));
    if (i === fil.length - 1) {
      const courant = creer('span', '', element.titre);
      courant.setAttribute('aria-current', 'page');
      el.fil.append(courant);
    } else {
      const lien = creer('button', '', element.titre);
      lien.type = 'button';
      lien.addEventListener('click', () => {
        etat.dossierCourant = element.id;
        rendreTout();
      });
      el.fil.append(lien);
    }
  });
}

function urlIcone(adresse) {
  const base = chrome.runtime.getURL('/_favicon/');
  return `${base}?pageUrl=${encodeURIComponent(adresse)}&size=32`;
}

function creerTuile(tuile) {
  let racine;
  if (tuile.genre === 'dossier') {
    racine = creer('button', 'tuile');
    racine.type = 'button';
    racine.addEventListener('click', () => {
      etat.dossierCourant = tuile.id;
      rendreTout();
    });
  } else if (tuile.ouvrable) {
    racine = creer('a', 'tuile'); // lien natif : Ctrl+clic et clic molette ouvrent un nouvel onglet (AC-F1-2)
    racine.href = tuile.adresse;
  } else {
    racine = creer('span', 'tuile');
    racine.tabIndex = 0;
    racine.setAttribute('aria-disabled', 'true');
    racine.title = 'Adresse non prise en charge'; // AC-F1-6
  }
  racine.dataset.id = tuile.id;
  branchergestion(racine, tuile);
  const pastille = creer('span', 'pastille', tuile.genre === 'dossier' ? '📁' : tuile.initiale);
  pastille.style.background = `hsl(${tuile.teinte} 55% 38%)`;
  if (tuile.genre === 'signet' && tuile.ouvrable) {
    const image = document.createElement('img');
    image.alt = '';
    image.src = urlIcone(tuile.adresse);
    image.addEventListener('error', () => image.remove()); // repli : l'initiale reste visible
    pastille.append(image);
  }
  racine.append(pastille, creer('span', 'titre-tuile', tuile.titre));
  return racine;
}

function creerTuileAjout() {
  const bouton = creer('button', 'tuile ajout');
  bouton.type = 'button';
  bouton.append(creer('span', 'pastille', '+'), creer('span', 'titre-tuile', 'Ajouter un site'));
  bouton.querySelector('.pastille').style.background = 'transparent';
  bouton.addEventListener('click', () => ouvrirFormulaire(null));
  return bouton;
}

let urlsVignettes = []; // adresses temporaires des vignettes affichées

function libererVignettes() {
  for (const url of urlsVignettes) URL.revokeObjectURL(url);
  urlsVignettes = [];
}

/** Remplace l'icône par la vignette personnalisée, quand il y en a une (AC-F3-5). */
async function appliquerVignettes(tuiles, version) {
  if (!base) return;
  const adresses = tuiles.filter((t) => t.genre === 'signet' && t.adresse).map((t) => t.adresse);
  let vignettes;
  try {
    vignettes = await lireVignettes(magasinDepuisBase(base), adresses);
  } catch (erreur) {
    console.error('Impossible de lire les vignettes :', erreur);
    return;
  }
  if (version !== etat.versionRendu) return; // un autre rendu a eu lieu entre-temps
  for (const tuile of tuiles) {
    const blob = vignettes.get(tuile.adresse);
    const racine = blob && el.grille.querySelector(`[data-id="${tuile.id}"]`);
    if (!racine) continue;
    const url = URL.createObjectURL(blob);
    urlsVignettes.push(url);
    const image = document.createElement('img');
    image.className = 'vignette';
    image.alt = ''; // le titre est affiché juste dessous
    image.src = url;
    racine.classList.add('avec-vignette');
    racine.querySelector('.pastille')?.replaceWith(image);
  }
}

function rendreGrille(groupe) {
  libererVignettes();
  const version = ++etat.versionRendu;
  el.grille.replaceChildren();
  const dossier = trouverNoeud(etat.arbre, etat.dossierCourant);
  const tuiles = construireTuiles(dossier?.children ?? []);
  if (etatGrille(tuiles) === 'vide') {
    const vide = creer('div', 'vide');
    vide.append(creer('p', '', 'Ce dossier ne contient aucun signet'));
    const ajouter = creer('button', 'bouton', 'Ajouter');
    ajouter.type = 'button';
    ajouter.addEventListener('click', () => ouvrirFormulaire(null));
    vide.append(ajouter);
    el.grille.append(vide);
    return;
  }
  for (const tuile of tuiles) el.grille.append(creerTuile(tuile));
  el.grille.append(creerTuileAjout());
  appliquerVignettes(tuiles, version);
}

function rendreInvitation() {
  el.groupes.replaceChildren();
  el.fil.replaceChildren();
  el.grille.replaceChildren();
  const invitation = creer('div', 'vide');
  invitation.append(creer('p', '', 'Aucun dossier choisi pour le moment.'));
  const bouton = creer('button', 'bouton', 'Choisir des dossiers');
  bouton.type = 'button';
  bouton.addEventListener('click', ouvrirDialogue);
  invitation.append(bouton);
  el.grille.append(invitation); // AC-F2-1
}

function rendreTout() {
  annoncer('');
  if (etat.reglages.groupes.length === 0) {
    rendreInvitation();
    return;
  }
  rendreOnglets();
  const groupe = groupeActif();
  if (statutGroupe(groupe, etat.arbre) === 'introuvable') {
    // AC-F2-5 : le groupe est signalé, les autres restent utilisables
    el.fil.replaceChildren();
    el.grille.replaceChildren();
    const message = creer('div', 'vide');
    message.append(creer('p', '', `Dossier introuvable : « ${groupe.libelle} »`));
    const retirer = creer('button', 'bouton', 'Retirer ce groupe');
    retirer.type = 'button';
    retirer.addEventListener('click', async () => {
      etat.reglages = basculerDossier(etat.reglages, { id: groupe.idDossier }, false);
      etat.dossierCourant = etat.reglages.groupeActif;
      await sauvegarder();
      rendreTout();
    });
    message.append(retirer);
    el.grille.append(message);
    return;
  }
  if (!trouverNoeud(etat.arbre, etat.dossierCourant)) etat.dossierCourant = groupe.idDossier;
  rendreFil(groupe);
  rendreGrille(groupe);
}

// ---------- Dialogue « Dossiers et groupes » (F2) ----------

function rendreDialogue() {
  el.listeGroupes.replaceChildren();
  const { groupes } = etat.reglages;
  if (groupes.length === 0) {
    el.listeGroupes.append(creer('li', 'message-vide', 'Aucun groupe.'));
  }
  groupes.forEach((groupe, i) => {
    const ligne = creer('li');
    const champ = creer('input');
    champ.type = 'text';
    champ.value = groupe.libelle;
    champ.maxLength = 60;
    champ.setAttribute('aria-label', `Libellé du groupe ${groupe.cheminDossier.join(' / ')}`);
    champ.addEventListener('change', async () => {
      etat.reglages = renommerGroupe(etat.reglages, groupe.idDossier, champ.value);
      await sauvegarder();
      rendreTout();
      rendreDialogue();
    });
    ligne.append(champ);
    for (const [texte, decalage, etiquette] of [['↑', -1, 'Monter'], ['↓', 1, 'Descendre']]) {
      const bouton = creer('button', 'bouton', texte);
      bouton.type = 'button';
      bouton.setAttribute('aria-label', `${etiquette} le groupe ${groupe.libelle}`);
      bouton.disabled = (decalage === -1 && i === 0) || (decalage === 1 && i === groupes.length - 1);
      bouton.addEventListener('click', async () => {
        etat.reglages = deplacerGroupe(etat.reglages, groupe.idDossier, decalage);
        await sauvegarder();
        rendreTout();
        rendreDialogue();
      });
      ligne.append(bouton);
    }
    el.listeGroupes.append(ligne);
  });

  el.arbre.replaceChildren();
  const dossiers = listerDossiers(etat.arbre);
  if (dossiers.length === 0) {
    el.arbre.append(creer('p', 'message-vide', 'Aucun dossier de signets trouvé'));
  }
  for (const dossier of dossiers) {
    const etiquette = creer('label');
    etiquette.style.paddingLeft = `${dossier.profondeur * 1.25}rem`;
    const case_ = creer('input');
    case_.type = 'checkbox';
    case_.checked = groupes.some((g) => g.idDossier === dossier.id);
    case_.addEventListener('change', async () => {
      etat.reglages = basculerDossier(etat.reglages, dossier, case_.checked);
      if (!etat.dossierCourant || !groupeActif()) etat.dossierCourant = etat.reglages.groupeActif;
      await sauvegarder();
      rendreTout();
      rendreDialogue();
    });
    etiquette.append(case_, creer('span', '', dossier.titre));
    el.arbre.append(etiquette);
  }
}

function ouvrirDialogue() {
  rendreDialogue();
  el.dialogue.showModal();
}

// ---------- Gestion des tuiles (F3) ----------

const gestion = {
  tuileEnEdition: null, // null = ajout ; sinon la tuile modifiée
  tuileDuMenu: null,
  minuterieAnnulation: null,
  sauvegardeSuppression: null,
  vignette: { fichier: null, retirer: false }, // choix en attente, appliqué à l'enregistrement
};

const dlg = {
  dialogue: document.getElementById('dialogue-tuile'),
  titreDialogue: document.getElementById('titre-dialogue-tuile'),
  formulaire: document.getElementById('formulaire-tuile'),
  titre: document.getElementById('champ-titre'),
  adresse: document.getElementById('champ-adresse'),
  erreurTitre: document.getElementById('erreur-titre'),
  erreurAdresse: document.getElementById('erreur-adresse'),
  erreurEnregistrement: document.getElementById('erreur-enregistrement'),
  vignette: document.getElementById('champ-vignette'),
  etatVignette: document.getElementById('etat-vignette'),
  erreurVignette: document.getElementById('erreur-vignette'),
  retirerVignette: document.getElementById('bouton-retirer-vignette'),
  menu: document.getElementById('menu-tuile'),
  barreAnnulation: document.getElementById('annulation'),
  texteAnnulation: document.getElementById('annulation-texte'),
};

const DELAI_ANNULATION_MS = 10000; // AC-F3-3

async function rafraichir(idAFocaliser) {
  await lireArbre();
  rendreTout();
  if (idAFocaliser) el.grille.querySelector(`[data-id="${idAFocaliser}"]`)?.focus();
}

function ouvrirFormulaire(tuile) {
  gestion.tuileEnEdition = tuile;
  dlg.titreDialogue.textContent = tuile ? 'Modifier le signet' : 'Ajouter un site';
  dlg.titre.value = tuile ? tuile.titre : '';
  dlg.adresse.value = tuile ? tuile.adresse : '';
  dlg.erreurTitre.textContent = '';
  dlg.erreurAdresse.textContent = '';
  dlg.erreurEnregistrement.textContent = '';
  gestion.vignette = { fichier: null, retirer: false };
  dlg.vignette.value = '';
  dlg.erreurVignette.textContent = '';
  dlg.etatVignette.textContent = MESSAGE_TAILLE_VIGNETTE;
  dlg.retirerVignette.hidden = true;
  dlg.dialogue.showModal();
  dlg.titre.focus();
  if (tuile && base) {
    // Propose « Retirer la vignette » seulement s'il y en a une
    lireVignettes(magasinDepuisBase(base), [tuile.adresse])
      .then((trouvees) => {
        if (gestion.tuileEnEdition === tuile && trouvees.size > 0) {
          dlg.etatVignette.textContent = 'Une vignette est en place. Choisis une image pour la remplacer.';
          dlg.retirerVignette.hidden = false;
        }
      })
      .catch((erreur) => console.error('Impossible de lire la vignette :', erreur));
  }
}

const MESSAGE_TAILLE_VIGNETTE = 'Taille conseillée : 440×360 px.';

dlg.vignette.addEventListener('change', () => {
  const fichier = dlg.vignette.files?.[0];
  gestion.vignette = { fichier: null, retirer: false };
  if (!fichier) return;
  const verdict = validerImage(fichier, TAILLE_MAX_VIGNETTE); // AC-F3-5 : refus immédiat, avec le message
  if (!verdict.ok) {
    dlg.erreurVignette.textContent = verdict.message;
    dlg.vignette.value = '';
    return;
  }
  dlg.erreurVignette.textContent = '';
  dlg.etatVignette.textContent = `Image choisie : ${fichier.name}. Elle sera appliquée à l'enregistrement.`;
  gestion.vignette.fichier = fichier;
});

dlg.retirerVignette.addEventListener('click', () => {
  gestion.vignette = { fichier: null, retirer: true };
  dlg.vignette.value = '';
  dlg.erreurVignette.textContent = '';
  dlg.etatVignette.textContent = "La vignette sera retirée à l'enregistrement.";
  dlg.retirerVignette.hidden = true;
});

/** Applique le choix de vignette après l'enregistrement du signet. Renvoie un message d'erreur ou ''. */
async function appliquerChoixVignette(adresseAvant, adresseApres) {
  if (!base) return gestion.vignette.fichier || gestion.vignette.retirer ? 'Stockage des images indisponible.' : '';
  const magasin = magasinDepuisBase(base);
  try {
    if (gestion.vignette.fichier) {
      const verdict = await definirVignette(magasin, adresseApres, gestion.vignette.fichier);
      if (!verdict.ok) return verdict.message;
      if (adresseAvant && adresseAvant !== adresseApres) await retirerVignette(magasin, adresseAvant);
    } else if (gestion.vignette.retirer) {
      await retirerVignette(magasin, adresseAvant ?? adresseApres);
    } else if (adresseAvant) {
      await changerAdresseVignette(magasin, adresseAvant, adresseApres); // la vignette suit l'adresse
    }
  } catch (erreur) {
    console.error("Impossible d'enregistrer la vignette :", erreur);
    return "Signet enregistré, mais la vignette n'a pas pu l'être.";
  }
  return '';
}

dlg.formulaire.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();
  const saisie = { titre: dlg.titre.value, adresse: dlg.adresse.value };
  try {
    const enEdition = gestion.tuileEnEdition;
    const resultat = enEdition
      ? await modifierTuile(chrome.bookmarks, enEdition.id, saisie)
      : await ajouterTuile(chrome.bookmarks, etat.dossierCourant, saisie);
    if (!resultat.ok) {
      // AC-F3-2 : message sous le champ fautif, rien n'est écrit
      dlg.erreurTitre.textContent = resultat.erreurs.titre ?? '';
      dlg.erreurAdresse.textContent = resultat.erreurs.adresse ?? '';
      return;
    }
    const adresseApres = resultat.noeud?.url ?? saisie.adresse.trim();
    const erreurVignette = await appliquerChoixVignette(enEdition?.adresse ?? null, adresseApres);
    if (erreurVignette) {
      // Le signet est enregistré ; on garde le formulaire ouvert pour corriger la vignette
      dlg.erreurVignette.textContent = erreurVignette;
      await rafraichir(resultat.noeud?.id);
      return;
    }
    dlg.dialogue.close();
    await rafraichir(resultat.noeud?.id);
    annoncer(enEdition ? 'Signet modifié.' : 'Signet ajouté.');
  } catch (erreur) {
    console.error("Impossible d'enregistrer le signet :", erreur);
    dlg.erreurEnregistrement.textContent = "Impossible d'enregistrer le signet.";
  }
});
document.getElementById('bouton-annuler-tuile').addEventListener('click', () => dlg.dialogue.close());

async function demanderSuppression(tuile) {
  if (!window.confirm(`Supprimer le signet « ${tuile.titre} » ?`)) return;
  try {
    const resultat = await supprimerTuile(chrome.bookmarks, tuile.id);
    if (!resultat.ok) {
      annoncer(resultat.message, true);
      return;
    }
    gestion.sauvegardeSuppression = resultat.sauvegarde;
    await rafraichir();
    afficherAnnulation(tuile.titre);
  } catch (erreur) {
    console.error('Impossible de supprimer le signet :', erreur);
    annoncer('Impossible de supprimer le signet.', true);
  }
}

function afficherAnnulation(titre) {
  clearTimeout(gestion.minuterieAnnulation);
  dlg.texteAnnulation.textContent = `Signet « ${titre} » supprimé.`;
  dlg.barreAnnulation.hidden = false;
  gestion.minuterieAnnulation = setTimeout(masquerAnnulation, DELAI_ANNULATION_MS);
}

function masquerAnnulation() {
  clearTimeout(gestion.minuterieAnnulation);
  dlg.barreAnnulation.hidden = true;
  gestion.sauvegardeSuppression = null;
}

document.getElementById('bouton-annuler-suppression').addEventListener('click', async () => {
  const sauvegarde = gestion.sauvegardeSuppression;
  masquerAnnulation();
  if (!sauvegarde) return;
  try {
    const resultat = await restaurerTuile(chrome.bookmarks, sauvegarde);
    await rafraichir(resultat.noeud?.id);
    annoncer('Signet restauré.');
  } catch (erreur) {
    console.error('Impossible de restaurer le signet :', erreur);
    annoncer('Impossible de restaurer le signet.', true);
  }
});

async function deplacer(tuile, indexVoulu) {
  try {
    const resultat = await deplacerTuile(chrome.bookmarks, tuile.id, indexVoulu);
    if (!resultat.ok) {
      if (resultat.message !== 'Position invalide') annoncer(resultat.message, true); // bords de liste : silence
      return;
    }
    await rafraichir(tuile.id);
  } catch (erreur) {
    console.error('Impossible de déplacer la tuile :', erreur);
    annoncer('Impossible de déplacer la tuile.', true);
  }
}

// Menu contextuel : clic droit, ou Maj+F10 / touche Menu (le navigateur déclenche alors « contextmenu »).
function ouvrirMenu(x, y, tuile) {
  gestion.tuileDuMenu = tuile;
  dlg.menu.style.left = `${x}px`;
  dlg.menu.style.top = `${y}px`;
  dlg.menu.hidden = false;
  document.getElementById('menu-modifier').focus();
}

function fermerMenu() {
  dlg.menu.hidden = true;
  gestion.tuileDuMenu = null;
}

document.getElementById('menu-modifier').addEventListener('click', () => {
  const tuile = gestion.tuileDuMenu;
  fermerMenu();
  if (tuile) ouvrirFormulaire(tuile);
});
document.getElementById('menu-supprimer').addEventListener('click', () => {
  const tuile = gestion.tuileDuMenu;
  fermerMenu();
  if (tuile) demanderSuppression(tuile);
});
document.addEventListener('click', (evenement) => {
  if (!dlg.menu.hidden && !dlg.menu.contains(evenement.target)) fermerMenu();
});
document.addEventListener('keydown', (evenement) => {
  if (evenement.key === 'Escape' && !dlg.menu.hidden) fermerMenu();
});

/** Branche menu, raccourcis clavier et glisser-déposer sur une tuile. */
function branchergestion(racine, tuile) {
  racine.draggable = true;

  if (tuile.genre === 'signet') {
    racine.addEventListener('contextmenu', (evenement) => {
      evenement.preventDefault();
      const zone = racine.getBoundingClientRect();
      const x = evenement.clientX || zone.left + 8; // au clavier, pas de coordonnées : on se place sur la tuile
      const y = evenement.clientY || zone.bottom;
      ouvrirMenu(x, y, tuile);
    });
  }

  racine.addEventListener('keydown', (evenement) => {
    if (evenement.altKey && ['ArrowLeft', 'ArrowUp'].includes(evenement.key)) {
      evenement.preventDefault();
      deplacer(tuile, tuile.index - 1); // AC-F3-4 au clavier
    } else if (evenement.altKey && ['ArrowRight', 'ArrowDown'].includes(evenement.key)) {
      evenement.preventDefault();
      deplacer(tuile, tuile.index + 1);
    } else if (tuile.genre === 'signet' && evenement.key === 'F2') {
      evenement.preventDefault();
      ouvrirFormulaire(tuile);
    } else if (tuile.genre === 'signet' && evenement.key === 'Delete') {
      evenement.preventDefault();
      demanderSuppression(tuile);
    }
  });

  racine.addEventListener('dragstart', (evenement) => {
    evenement.dataTransfer.setData('text/plain', tuile.id);
    evenement.dataTransfer.effectAllowed = 'move';
    racine.classList.add('glissee');
  });
  racine.addEventListener('dragend', () => racine.classList.remove('glissee'));
  racine.addEventListener('dragover', (evenement) => {
    evenement.preventDefault();
    racine.classList.add('cible');
  });
  racine.addEventListener('dragleave', () => racine.classList.remove('cible'));
  racine.addEventListener('drop', (evenement) => {
    evenement.preventDefault();
    racine.classList.remove('cible');
    const idGlisse = evenement.dataTransfer.getData('text/plain');
    if (!idGlisse || idGlisse === tuile.id) return;
    const dossier = trouverNoeud(etat.arbre, etat.dossierCourant);
    const source = construireTuiles(dossier?.children ?? []).find((t) => t.id === idGlisse);
    if (source) deplacer(source, tuile.index); // la tuile prend la place de la cible
  });
}

// ---------- Démarrage ----------

async function demarrer() {
  annoncer('Chargement…');
  try {
    etat.reglages = await chargerReglages(chrome.storage.local);
    try {
      base = await ouvrirBase();
    } catch (erreur) {
      console.error('IndexedDB indisponible, images désactivées :', erreur);
    }
    await majApparence(); // l'apparence s'applique même si les signets sont illisibles
    initialiserPanneau({
      obtenirReglages: () => etat.reglages,
      changer: changerReglages,
      obtenirBase: () => base,
    });
    initialiserSauvegarde({
      obtenirReglages: () => etat.reglages,
      obtenirArbre: async () => {
        await lireArbre(); // arbre frais : l'import retrouve les dossiers tels qu'ils sont maintenant
        return etat.arbre;
      },
      obtenirBase: () => base,
      appliquerImport: appliquerReglagesImportes,
      annoncer,
    });
    await lireArbre();
    etat.dossierCourant = etat.reglages.groupeActif;
    rendreTout();
  } catch (erreur) {
    console.error('Impossible de lire les signets ou les réglages :', erreur);
    annoncer('Impossible de lire les signets.', true);
    const reessayer = creer('button', 'bouton', 'Réessayer');
    reessayer.type = 'button';
    reessayer.addEventListener('click', () => location.reload());
    el.grille.replaceChildren(reessayer);
  }
}

el.boutonGerer.addEventListener('click', ouvrirDialogue);
el.boutonFermer.addEventListener('click', () => el.dialogue.close());
demarrer();
