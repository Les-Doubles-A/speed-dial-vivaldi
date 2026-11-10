// Aide pour les tests d'interface : la vraie page (newtab.html + src/interface.js) dans jsdom,
// avec une API de signets simulée et une IndexedDB simulée. Ce n'est pas Vivaldi : voir M1 à M6.
import { IDBFactory } from 'fake-indexeddb';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { creerApiSimulee } from '../tests/api-simulee.js';

const RACINE = new URL('../', import.meta.url);
const HTML = readFileSync(new URL('newtab.html', RACINE), 'utf8').replace(/<script[^>]*><\/script>/, '');
let compteur = 0;

export const attendre = (ms = 40) => new Promise((resoudre) => setTimeout(resoudre, ms));

/** Réglages enregistrés d'un profil : 1 groupe sur le dossier « Barre de favoris » (id 1). */
export const reglagesAvecGroupe = (extra = {}) => ({
  version: 1,
  groupes: [{ idDossier: '1', cheminDossier: ['Barre de favoris'], libelle: 'Barre' }],
  groupeActif: '1',
  ...extra,
});

/**
 * Ouvre la page. `donnees` = contenu simulé de chrome.storage.local (modifié par la page).
 * `reutiliserBase: true` garde l'IndexedDB précédente : sert à simuler un redémarrage du navigateur.
 */
export async function ouvrirPage({ arbre, donnees = {}, reutiliserBase = false, confirmer = () => true } = {}) {
  if (!reutiliserBase || !globalThis.indexedDB) globalThis.indexedDB = new IDBFactory();
  const dom = new JSDOM(HTML, { pretendToBeVisual: true });
  const { window } = dom;
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.location = window.location;
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  window.confirm = (texte) => confirmer(texte);

  const telechargements = [];
  window.HTMLAnchorElement.prototype.click = function () { telechargements.push(this.download); };
  const blobsCrees = [];
  const creerOrigine = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (blob) => {
    blobsCrees.push(blob);
    return creerOrigine(blob);
  };

  const api = creerApiSimulee(arbre);
  globalThis.chrome = {
    bookmarks: api,
    storage: {
      local: {
        get: async (cle) => (cle in donnees ? { [cle]: structuredClone(donnees[cle]) } : {}),
        set: async (objet) => Object.assign(donnees, structuredClone(objet)),
      },
    },
    runtime: { getURL: (chemin) => `chrome-extension://test${chemin}` },
  };

  await import(`../src/interface.js?page=${++compteur}`); // adresse unique : état du module neuf à chaque page
  await attendre(100);

  const $ = (id) => window.document.getElementById(id);
  const evt = (noeud, type, init = {}) => {
    const e = new window.Event(type, { bubbles: true, cancelable: true });
    Object.assign(e, init);
    noeud.dispatchEvent(e);
    return e;
  };
  const tuiles = () => [...window.document.querySelectorAll('#grille .tuile')];
  const tuile = (titre) => tuiles().find((t) => t.querySelector('.titre-tuile')?.textContent === titre);
  const choisirFichier = (champ, fichier) => {
    Object.defineProperty(champ, 'files', { value: fichier ? [fichier] : [], configurable: true });
    evt(champ, 'change');
  };
  return { window, $, evt, tuiles, tuile, choisirFichier, api, donnees, telechargements, blobsCrees };
}

export const octets = (n) => new Uint8Array(n).fill(3);
export const Mo = 1024 * 1024;
