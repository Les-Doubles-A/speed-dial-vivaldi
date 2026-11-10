import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ajouterTuile,
  deplacerTuile,
  modifierTuile,
  restaurerTuile,
  supprimerTuile,
  validerSaisieTuile,
} from '../src/operations.js';
import { construireTuiles } from '../src/signets.js';
import { arbreDeTest } from './arbre-test.js';
import { creerApiSimulee } from './api-simulee.js';

const titres = async (api, idDossier) => (await api.getChildren(idDossier)).map((n) => n.title);

test('AC-F3-1 : ajouter « Exemple » crée un signet dans le dossier courant', async () => {
  const api = creerApiSimulee(arbreDeTest());
  const res = await ajouterTuile(api, '2', { titre: 'Exemple', adresse: 'https://example.com' });
  assert.equal(res.ok, true);
  const enfants = await api.getChildren('2');
  const ajoute = enfants.at(-1);
  assert.equal(ajoute.title, 'Exemple');
  assert.equal(ajoute.url, 'https://example.com');
  assert.equal(ajoute.parentId, '2');
  assert.equal(construireTuiles(enfants).at(-1).genre, 'signet'); // la tuile apparaît dans la grille
});

test('AC-F3-1 : le titre et l’adresse sont nettoyés avant l’ajout', async () => {
  const api = creerApiSimulee(arbreDeTest());
  await ajouterTuile(api, '2', { titre: '  Mon site  ', adresse: ' https://example.org/ ' });
  const ajoute = (await api.getChildren('2')).at(-1);
  assert.equal(ajoute.title, 'Mon site');
  assert.equal(ajoute.url, 'https://example.org/');
});

test('AC-F3-2 : modifier le titre et l’adresse met à jour le signet', async () => {
  const api = creerApiSimulee(arbreDeTest());
  const res = await modifierTuile(api, '10', { titre: 'Nouveau', adresse: 'https://nouveau.test/' });
  assert.equal(res.ok, true);
  const [noeud] = await api.get('10');
  assert.equal(noeud.title, 'Nouveau');
  assert.equal(noeud.url, 'https://nouveau.test/');
});

test('AC-F3-2 : une adresse invalide est refusée avec un message, le signet reste intact', async () => {
  const api = creerApiSimulee(arbreDeTest());
  for (const adresse of ['example.com', 'javascript:alert(1)', 'ftp://exemple.test', '']) {
    const res = await modifierTuile(api, '10', { titre: 'Exemple', adresse });
    assert.equal(res.ok, false, adresse);
    assert.ok(res.erreurs.adresse);
  }
  const [noeud] = await api.get('10');
  assert.equal(noeud.url, 'https://example.com/');
  const ajout = await ajouterTuile(api, '2', { titre: 'X', adresse: 'nimporte quoi' });
  assert.equal(ajout.ok, false);
  assert.equal((await api.getChildren('2')).length, 2);
});

test('validation du titre : obligatoire, 200 caractères au plus', () => {
  assert.equal(validerSaisieTuile({ titre: '   ', adresse: 'https://a.test' }).erreurs.titre, 'Le titre est obligatoire');
  assert.equal(validerSaisieTuile({ titre: 'x'.repeat(200), adresse: 'https://a.test' }).ok, true);
  assert.match(validerSaisieTuile({ titre: 'x'.repeat(201), adresse: 'https://a.test' }).erreurs.titre, /200/);
  assert.equal(validerSaisieTuile({}).ok, false);
});

test('modifier refuse un dossier', async () => {
  const api = creerApiSimulee(arbreDeTest());
  const res = await modifierTuile(api, '13', { titre: 'Autre', adresse: 'https://a.test' });
  assert.equal(res.ok, false);
  assert.equal((await api.get('13'))[0].title, 'Outils');
});

test('AC-F3-3 : supprimer puis annuler restaure le signet à sa place', async () => {
  const api = creerApiSimulee(arbreDeTest());
  const avant = await titres(api, '1');
  const res = await supprimerTuile(api, '11');
  assert.equal(res.ok, true);
  assert.deepEqual(await titres(api, '1'), ['Exemple', '', 'Outils']);
  const retour = await restaurerTuile(api, res.sauvegarde);
  assert.equal(retour.ok, true);
  assert.deepEqual(await titres(api, '1'), avant);
  assert.equal((await api.getChildren('1'))[1].url, 'https://fr.wikipedia.org/');
});

test('AC-F3-3 : restaurer un signet situé en dernière position', async () => {
  const api = creerApiSimulee(arbreDeTest());
  const res = await supprimerTuile(api, '20');
  const autres = await api.getChildren('2');
  assert.equal(autres.length, 1);
  await restaurerTuile(api, { ...res.sauvegarde, index: 99 }); // index trop grand : ramené en fin de liste
  assert.equal((await api.getChildren('2')).length, 2);
});

test('supprimer refuse un dossier, même vide', async () => {
  const api = creerApiSimulee(arbreDeTest());
  assert.equal((await supprimerTuile(api, '21')).ok, false);
  assert.equal((await supprimerTuile(api, '13')).ok, false);
  assert.equal((await api.getChildren('2')).length, 2);
});

for (const [nom, options] of [
  ['navigateur sans décalage', {}],
  ['navigateur avec décalage vers l’avant (comportement connu de Chrome)', { decalageAvant: true }],
]) {
  test(`AC-F3-4 : déplacer une tuile, ${nom}`, async () => {
    const api = creerApiSimulee(arbreDeTest(), options);
    // ordre initial du dossier 1 : Exemple(10), Wikipédia(11), sans-titre(12), Outils(13)
    assert.equal((await deplacerTuile(api, '10', 2)).ok, true);
    assert.deepEqual((await api.getChildren('1')).map((n) => n.id), ['11', '12', '10', '13']);
    assert.equal((await deplacerTuile(api, '10', 3)).ok, true); // jusqu'à la dernière place
    assert.deepEqual((await api.getChildren('1')).map((n) => n.id), ['11', '12', '13', '10']);
    assert.equal((await deplacerTuile(api, '10', 0)).ok, true); // vers l'arrière
    assert.deepEqual((await api.getChildren('1')).map((n) => n.id), ['10', '11', '12', '13']);
    assert.equal((await deplacerTuile(api, '11', 2)).ok, true); // cran par cran, comme au clavier
    assert.deepEqual((await api.getChildren('1')).map((n) => n.id), ['10', '12', '11', '13']);
    assert.equal((await deplacerTuile(api, '13', 1)).ok, true); // un dossier se déplace aussi
    assert.deepEqual((await api.getChildren('1')).map((n) => n.id), ['10', '13', '12', '11']);
  });
}

test('AC-F3-4 : positions invalides refusées, position identique sans effet', async () => {
  const api = creerApiSimulee(arbreDeTest());
  assert.equal((await deplacerTuile(api, '10', -1)).ok, false);
  assert.equal((await deplacerTuile(api, '10', 4)).ok, false);
  assert.equal((await deplacerTuile(api, '10', 1.5)).ok, false);
  assert.equal((await deplacerTuile(api, '10', 0)).ok, true);
  assert.deepEqual((await api.getChildren('1')).map((n) => n.id), ['10', '11', '12', '13']);
});

test('construireTuiles donne la position de chaque tuile', () => {
  const tuiles = construireTuiles([{ id: 'a', title: 'A', url: 'https://a.test' }, { id: 'b', title: 'B', children: [] }]);
  assert.deepEqual(tuiles.map((t) => t.index), [0, 1]);
});
