import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLONNES_DEFAUT,
  CLE_IMAGE_FOND,
  DEGRADES,
  TAILLES,
  TAILLES_REM,
  VOILE_MAX,
  bornerEntier,
  chargerReglages,
  definirColonnes,
  definirFond,
  definirTaille,
  definirTheme,
  enregistrerReglages,
  fondParDefaut,
  normaliserReglages,
  reglagesParDefaut,
  reinitialiserApparence,
  basculerDossier,
} from '../src/reglages.js';
import { variablesApparence } from '../src/apparence.js';

function stockageSimule() {
  const donnees = {};
  return {
    async get(cle) {
      return cle in donnees ? { [cle]: structuredClone(donnees[cle]) } : {};
    },
    async set(objet) {
      Object.assign(donnees, structuredClone(objet));
    },
  };
}

test('AC-F4-1 : 6 colonnes sont acceptées, 1 devient 2 et 11 devient 10', () => {
  const r = reglagesParDefaut();
  assert.equal(definirColonnes(r, 6).colonnesMax, 6);
  assert.equal(definirColonnes(r, 1).colonnesMax, 2);
  assert.equal(definirColonnes(r, 11).colonnesMax, 10);
  assert.equal(definirColonnes(r, '7').colonnesMax, 7);
  assert.equal(definirColonnes(r, 4.6).colonnesMax, 5);
});

test('AC-F4-1 : saisie vide ou illisible → valeur par défaut', () => {
  const r = reglagesParDefaut();
  assert.equal(definirColonnes(r, '').colonnesMax, COLONNES_DEFAUT);
  assert.equal(definirColonnes(r, 'abc').colonnesMax, COLONNES_DEFAUT);
  assert.equal(bornerEntier(null, 2, 10, 6), 6);
});

test('AC-F4-2 : les trois tailles existent et la grande est plus large que la moyenne', () => {
  assert.deepEqual(TAILLES, ['petite', 'moyenne', 'grande']);
  assert.ok(TAILLES_REM.petite < TAILLES_REM.moyenne);
  assert.ok(TAILLES_REM.moyenne < TAILLES_REM.grande);
  const moyenne = variablesApparence(definirTaille(reglagesParDefaut(), 'moyenne'));
  const grande = variablesApparence(definirTaille(reglagesParDefaut(), 'grande'));
  assert.ok(parseFloat(grande.largeurTuile) > parseFloat(moyenne.largeurTuile));
  assert.equal(definirTaille(reglagesParDefaut(), 'énorme').tailleTuile, 'moyenne');
});

test('AC-F4-3 : thème clair, sombre ou automatique ; valeur inconnue ignorée', () => {
  const r = reglagesParDefaut();
  assert.equal(r.theme, 'auto');
  assert.equal(definirTheme(r, 'sombre').theme, 'sombre');
  assert.equal(definirTheme(r, 'clair').theme, 'clair');
  assert.equal(definirTheme(r, 'fluo'), r);
  assert.equal(variablesApparence(definirTheme(r, 'sombre')).theme, 'sombre');
});

test('fond : couleur #rrggbb, dégradé connu, image sous la clé « fond », sinon inchangé', () => {
  const r = reglagesParDefaut();
  assert.equal(definirFond(r, { type: 'couleur', valeur: '#A1B2C3', voile: 10 }).fond.valeur, '#a1b2c3');
  assert.equal(definirFond(r, { type: 'couleur', valeur: 'rouge', voile: 10 }), r);
  assert.equal(definirFond(r, { type: 'degrade', valeur: DEGRADES[0].id, voile: 10 }).fond.type, 'degrade');
  assert.equal(definirFond(r, { type: 'degrade', valeur: 'inconnu', voile: 10 }), r);
  assert.equal(definirFond(r, { type: 'image', valeur: CLE_IMAGE_FOND, voile: 10 }).fond.type, 'image');
  assert.equal(definirFond(r, { type: 'image', valeur: 'autre', voile: 10 }), r);
  assert.equal(definirFond(r, null), r);
});

test('voile borné entre 0 et 80', () => {
  const r = reglagesParDefaut();
  assert.equal(definirFond(r, { type: 'theme', valeur: '', voile: 200 }).fond.voile, VOILE_MAX);
  assert.equal(definirFond(r, { type: 'theme', valeur: '', voile: -5 }).fond.voile, 0);
});

test('variablesApparence : image + voile, dégradé, couleur, thème', () => {
  const base = reglagesParDefaut();
  const image = definirFond(base, { type: 'image', valeur: CLE_IMAGE_FOND, voile: 50 });
  const v = variablesApparence(image, 'blob:test');
  assert.match(v.fondCss, /rgba\(0, 0, 0, 0\.5\)/);
  assert.match(v.fondCss, /url\("blob:test"\)/);
  assert.equal(v.avecFond, true);
  // image sans fichier lisible : retour au fond du thème, sans erreur
  assert.equal(variablesApparence(image, '').avecFond, false);
  assert.equal(variablesApparence(base).avecFond, false);
  const couleur = definirFond(base, { type: 'couleur', valeur: '#112233', voile: 0 });
  assert.equal(variablesApparence(couleur).couleurFond, '#112233');
  const degrade = definirFond(base, { type: 'degrade', valeur: 'ocean', voile: 0 });
  assert.match(variablesApparence(degrade).fondCss, /^linear-gradient/);
});

test('AC-F4-5 : les réglages d’apparence survivent à un rechargement', async () => {
  const stockage = stockageSimule();
  let r = definirColonnes(reglagesParDefaut(), 8);
  r = definirTaille(r, 'grande');
  r = definirTheme(r, 'sombre');
  r = definirFond(r, { type: 'degrade', valeur: 'foret', voile: 20 });
  await enregistrerReglages(stockage, r);
  const relu = await chargerReglages(stockage);
  assert.equal(relu.colonnesMax, 8);
  assert.equal(relu.tailleTuile, 'grande');
  assert.equal(relu.theme, 'sombre');
  assert.deepEqual(relu.fond, { type: 'degrade', valeur: 'foret', voile: 20 });
});

test('AC-F4-5 : réinitialiser restaure l’apparence par défaut et garde les groupes', () => {
  let r = basculerDossier(reglagesParDefaut(), { id: '1', titre: 'Barre', chemin: ['Barre'] }, true);
  r = definirColonnes(definirTheme(r, 'clair'), 3);
  r = definirFond(r, { type: 'couleur', valeur: '#000000', voile: 0 });
  const remis = reinitialiserApparence(r);
  assert.equal(remis.colonnesMax, COLONNES_DEFAUT);
  assert.equal(remis.theme, 'auto');
  assert.deepEqual(remis.fond, fondParDefaut());
  assert.equal(remis.groupes.length, 1);
});

test('anciens réglages (sans apparence) : valeurs par défaut ajoutées, rien de perdu', () => {
  const ancien = {
    version: 1,
    groupes: [{ idDossier: '1', cheminDossier: ['A'], libelle: 'A' }],
    groupeActif: '1',
  };
  const r = normaliserReglages(ancien);
  assert.equal(r.groupes.length, 1);
  assert.equal(r.colonnesMax, COLONNES_DEFAUT);
  assert.equal(r.theme, 'auto');
});

test('valeurs d’apparence corrompues dans le stockage → défauts', () => {
  const r = normaliserReglages({
    version: 1, groupes: [], groupeActif: '',
    colonnesMax: 99, tailleTuile: 'x', theme: 'y', fond: { type: 'couleur', valeur: 'zzz' },
  });
  assert.equal(r.colonnesMax, 10);
  assert.equal(r.tailleTuile, 'moyenne');
  assert.equal(r.theme, 'auto');
  assert.deepEqual(r.fond, fondParDefaut());
});
