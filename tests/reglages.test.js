import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_GROUPES,
  basculerDossier,
  chargerReglages,
  definirGroupeActif,
  deplacerGroupe,
  enregistrerReglages,
  normaliserReglages,
  renommerGroupe,
  reglagesParDefaut,
  statutGroupe,
} from '../src/reglages.js';
import { listerDossiers } from '../src/signets.js';
import { arbreDeTest } from './arbre-test.js';

// Stockage simulé : même interface que chrome.storage.local (get/set asynchrones).
function stockageSimule() {
  const donnees = {};
  return {
    donnees,
    async get(cle) {
      return cle in donnees ? { [cle]: structuredClone(donnees[cle]) } : {};
    },
    async set(objet) {
      Object.assign(donnees, structuredClone(objet));
    },
  };
}

const dossiers = listerDossiers(arbreDeTest());
const parId = (id) => dossiers.find((d) => d.id === id);

test('AC-F2-1 : sans réglage enregistré, aucun groupe (la page affiche l’invitation)', async () => {
  const reglages = await chargerReglages(stockageSimule());
  assert.deepEqual(reglages, reglagesParDefaut());
  assert.equal(reglages.groupes.length, 0);
});

test('AC-F2-2 : cocher 3 dossiers crée 3 groupes dans l’ordre du cochage', () => {
  let r = reglagesParDefaut();
  r = basculerDossier(r, parId('2'), true);
  r = basculerDossier(r, parId('1'), true);
  r = basculerDossier(r, parId('13'), true);
  assert.deepEqual(r.groupes.map((g) => g.idDossier), ['2', '1', '13']);
  assert.equal(r.groupeActif, '2');
  assert.deepEqual(r.groupes[2].cheminDossier, ['Barre de favoris', 'Outils']);
});

test('AC-F2-2 : un dossier ne peut pas être choisi deux fois, et la limite est respectée', () => {
  let r = basculerDossier(reglagesParDefaut(), parId('1'), true);
  r = basculerDossier(r, parId('1'), true);
  assert.equal(r.groupes.length, 1);
  let plein = reglagesParDefaut();
  for (let i = 0; i < MAX_GROUPES + 3; i++) {
    plein = basculerDossier(plein, { id: `d${i}`, titre: `D${i}`, chemin: [`D${i}`] }, true);
  }
  assert.equal(plein.groupes.length, MAX_GROUPES);
});

test('décocher le groupe actif active le premier groupe restant', () => {
  let r = basculerDossier(basculerDossier(reglagesParDefaut(), parId('1'), true), parId('2'), true);
  r = basculerDossier(r, parId('1'), false);
  assert.deepEqual(r.groupes.map((g) => g.idDossier), ['2']);
  assert.equal(r.groupeActif, '2');
});

test('AC-F2-3 : le groupe actif est conservé après enregistrement et rechargement', async () => {
  const stockage = stockageSimule();
  let r = basculerDossier(basculerDossier(reglagesParDefaut(), parId('1'), true), parId('2'), true);
  r = definirGroupeActif(r, '2');
  await enregistrerReglages(stockage, r);
  const relu = await chargerReglages(stockage);
  assert.equal(relu.groupeActif, '2');
});

test('AC-F2-4 : libellé et ordre survivent au rechargement, le dossier garde son nom', async () => {
  const stockage = stockageSimule();
  const arbre = arbreDeTest();
  let r = basculerDossier(basculerDossier(reglagesParDefaut(), parId('1'), true), parId('2'), true);
  r = renommerGroupe(r, '1', '  Mes favoris  ');
  r = deplacerGroupe(r, '1', 1);
  await enregistrerReglages(stockage, r);
  const relu = await chargerReglages(stockage);
  assert.deepEqual(relu.groupes.map((g) => g.idDossier), ['2', '1']);
  assert.equal(relu.groupes[1].libelle, 'Mes favoris');
  assert.equal(listerDossiers(arbre).find((d) => d.id === '1').titre, 'Barre de favoris');
});

test('renommer avec un libellé vide ou déplacer hors limites ne change rien', () => {
  const r = basculerDossier(reglagesParDefaut(), parId('1'), true);
  assert.equal(renommerGroupe(r, '1', '   '), r);
  assert.equal(deplacerGroupe(r, '1', -1), r);
  assert.equal(deplacerGroupe(r, 'inconnu', 1), r);
});

test('AC-F2-5 : un dossier supprimé dans Vivaldi donne le statut « introuvable »', () => {
  const r = basculerDossier(basculerDossier(reglagesParDefaut(), parId('1'), true), parId('21'), true);
  const arbre = arbreDeTest();
  assert.equal(statutGroupe(r.groupes[1], arbre), 'ok');
  arbre[0].children[1].children = [];
  assert.equal(statutGroupe(r.groupes[1], arbre), 'introuvable');
  assert.equal(statutGroupe(r.groupes[0], arbre), 'ok');
});

test('normaliserReglages : données corrompues ou version inconnue → valeurs par défaut', () => {
  assert.deepEqual(normaliserReglages(null), reglagesParDefaut());
  assert.deepEqual(normaliserReglages({ version: 99, groupes: [] }), reglagesParDefaut());
  const sale = {
    version: 1,
    groupes: [
      { idDossier: '1', cheminDossier: ['A'], libelle: 'A' },
      { idDossier: '1', cheminDossier: ['A'], libelle: 'doublon' },
      { idDossier: 5, cheminDossier: [], libelle: 'faux' },
      null,
    ],
    groupeActif: 'inexistant',
  };
  const propre = normaliserReglages(sale);
  assert.equal(propre.groupes.length, 1);
  assert.equal(propre.groupeActif, '1');
});
