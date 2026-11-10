import test from 'node:test';
import assert from 'node:assert/strict';
import {
  construireTuiles,
  estAdresseOuvrable,
  etatGrille,
  filAriane,
  listerDossiers,
  titreAffiche,
  trouverNoeud,
} from '../src/signets.js';
import { arbreDeTest } from './arbre-test.js';

test('AC-F1-1 : 3 signets et 1 sous-dossier donnent 4 tuiles typées', () => {
  const dossier = trouverNoeud(arbreDeTest(), '1');
  const tuiles = construireTuiles(dossier.children);
  assert.equal(tuiles.length, 4);
  assert.deepEqual(tuiles.map((t) => t.genre), ['signet', 'signet', 'signet', 'dossier']);
  assert.equal(tuiles[0].titre, 'Exemple');
  assert.equal(tuiles[3].titre, 'Outils');
  assert.equal(tuiles[3].adresse, null);
});

test('AC-F1-1 : un signet sans titre affiche son nom d’hôte', () => {
  assert.equal(titreAffiche({ title: '  ', url: 'https://sans-titre.test/page' }), 'sans-titre.test');
});

test('AC-F1-3 : le fil d’Ariane va du dossier du groupe au sous-dossier courant', () => {
  const fil = filAriane(arbreDeTest(), '1', '13');
  assert.deepEqual(fil.map((e) => e.titre), ['Barre de favoris', 'Outils']);
  assert.deepEqual(filAriane(arbreDeTest(), '1', '1').map((e) => e.id), ['1']);
});

test('AC-F1-3 : fil d’Ariane nul si le dossier n’est pas sous le groupe', () => {
  assert.equal(filAriane(arbreDeTest(), '2', '13'), null);
  assert.equal(filAriane(arbreDeTest(), '1', 'inexistant'), null);
});

test('AC-F1-4 : un dossier vide donne l’état « vide »', () => {
  const vide = trouverNoeud(arbreDeTest(), '21');
  assert.equal(etatGrille(construireTuiles(vide.children)), 'vide');
  assert.equal(etatGrille(construireTuiles(trouverNoeud(arbreDeTest(), '1').children)), 'pret');
});

test('AC-F1-6 : seules les adresses http et https sont ouvrables', () => {
  assert.equal(estAdresseOuvrable('https://example.com'), true);
  assert.equal(estAdresseOuvrable('http://example.com'), true);
  assert.equal(estAdresseOuvrable('javascript:alert(1)'), false);
  assert.equal(estAdresseOuvrable('file:///etc/passwd'), false);
  assert.equal(estAdresseOuvrable('pas une adresse'), false);
  assert.equal(estAdresseOuvrable(undefined), false);
  const tuile = construireTuiles(trouverNoeud(arbreDeTest(), '2').children)[0];
  assert.equal(tuile.ouvrable, false);
});

test('listerDossiers : tous les dossiers, sans la racine, avec chemin et profondeur', () => {
  const dossiers = listerDossiers(arbreDeTest());
  assert.deepEqual(dossiers.map((d) => d.id), ['1', '13', '2', '21']);
  assert.deepEqual(dossiers[1].chemin, ['Barre de favoris', 'Outils']);
  assert.equal(dossiers[1].profondeur, 1);
});
