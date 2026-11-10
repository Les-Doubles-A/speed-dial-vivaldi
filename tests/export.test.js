import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FORMAT_EXPORT,
  VERSION_EXPORT,
  base64VersBlob,
  blobVersBase64,
  construireExport,
  importerSauvegarde,
  lireFichierExport,
  nomFichierExport,
  serialiserExport,
} from '../src/export.js';
import { cleVignette } from '../src/images.js';
import {
  CLE_IMAGE_FOND,
  basculerDossier,
  definirColonnes,
  definirFond,
  definirTaille,
  definirTheme,
  reglagesParDefaut,
  renommerGroupe,
  statutGroupe,
} from '../src/reglages.js';
import { listerDossiers } from '../src/signets.js';
import { arbreDeTest } from './arbre-test.js';

const Mo = 1024 * 1024;
const image = (octets, type = 'image/png') => new Blob([new Uint8Array(octets).fill(7)], { type });

// Magasin en mémoire : même interface que le magasin IndexedDB (lire, ecrire, supprimer, cles).
function magasinSimule(initial = {}) {
  const donnees = new Map(Object.entries(initial));
  return {
    donnees,
    async lire(cle) { return donnees.get(cle); },
    async ecrire(cle, blob) { donnees.set(cle, blob); },
    async supprimer(cle) { donnees.delete(cle); },
    async cles() { return [...donnees.keys()]; },
  };
}

const dossiers = listerDossiers(arbreDeTest());
const parId = (id) => dossiers.find((d) => d.id === id);

/** Réglages de départ : 3 groupes, apparence personnalisée, fond image. */
function reglagesPersonnalises() {
  let r = reglagesParDefaut();
  r = basculerDossier(r, parId('1'), true);
  r = basculerDossier(r, parId('13'), true);
  r = basculerDossier(r, parId('2'), true);
  r = renommerGroupe(r, '13', 'Mes outils');
  r = { ...r, groupeActif: '13' };
  r = definirColonnes(definirTaille(definirTheme(r, 'sombre'), 'grande'), 8);
  return definirFond(r, { type: 'image', valeur: CLE_IMAGE_FOND, voile: 55 });
}

test('AC-F5-1 : nom de fichier speed-dial-reglages-AAAA-MM-JJ.json', () => {
  assert.equal(nomFichierExport(new Date(2026, 9, 18)), 'speed-dial-reglages-2026-10-18.json');
  assert.equal(nomFichierExport(new Date(2027, 0, 5)), 'speed-dial-reglages-2027-01-05.json');
});

test('AC-F5-1 : l’export contient format, version, groupes avec chemin, réglages et images', async () => {
  const magasin = magasinSimule({
    [CLE_IMAGE_FOND]: image(1000, 'image/jpeg'),
    [cleVignette('https://example.com/')]: image(500),
  });
  const objet = await construireExport({
    reglages: reglagesPersonnalises(), arbre: arbreDeTest(), magasin, date: new Date('2026-10-18T10:00:00Z'),
  });
  assert.equal(objet.format, FORMAT_EXPORT);
  assert.equal(objet.version, VERSION_EXPORT);
  assert.equal(objet.exporteLe, '2026-10-18T10:00:00.000Z');
  assert.deepEqual(objet.reglages.groupes.map((g) => g.cheminDossier), [
    ['Barre de favoris'], ['Barre de favoris', 'Outils'], ['Autres favoris'],
  ]);
  assert.equal(objet.reglages.groupes[1].libelle, 'Mes outils');
  assert.equal(objet.reglages.groupeActif, 1); // position du groupe actif, pas son identifiant
  assert.equal(objet.reglages.colonnesMax, 8);
  assert.equal(objet.reglages.tailleTuile, 'grande');
  assert.equal(objet.reglages.theme, 'sombre');
  assert.deepEqual(objet.reglages.fond, { type: 'image', valeur: 'fond', voile: 55 });
  assert.equal(objet.images.fond.type, 'image/jpeg');
  assert.equal(objet.images.vignettes.length, 1);
  assert.equal(objet.images.vignettes[0].adresse, 'https://example.com/');
  // aucun identifiant de dossier propre au profil dans le fichier
  assert.ok(!JSON.stringify(objet.reglages.groupes).includes('idDossier'));
});

test('AC-F5-1 : le texte exporté est du JSON UTF-8 avec un champ version, accents conservés', async () => {
  let r = renommerGroupe(basculerDossier(reglagesPersonnalises(), parId('1'), true), '1', 'Favoris — été ☀');
  const texte = serialiserExport(await construireExport({ reglages: r, arbre: arbreDeTest(), magasin: magasinSimule() }));
  const relu = JSON.parse(Buffer.from(texte, 'utf8').toString('utf8'));
  assert.equal(relu.version, 1);
  assert.equal(relu.reglages.groupes[0].libelle, 'Favoris — été ☀');
});

test('export : seules les vignettes d’adresses encore présentes dans les signets sont incluses', async () => {
  const magasin = magasinSimule({
    [cleVignette('https://example.com/')]: image(10),
    [cleVignette('https://supprime.test/')]: image(10), // signet disparu : image orpheline
    autreCle: image(10),
  });
  const objet = await construireExport({ reglages: reglagesPersonnalises(), arbre: arbreDeTest(), magasin });
  assert.deepEqual(objet.images.vignettes.map((v) => v.adresse), ['https://example.com/']);
});

test('export : pas d’image de fond exportée si le fond n’est pas une image', async () => {
  const magasin = magasinSimule({ [CLE_IMAGE_FOND]: image(100) });
  const r = definirFond(reglagesPersonnalises(), { type: 'couleur', valeur: '#112233', voile: 0 });
  const objet = await construireExport({ reglages: r, arbre: arbreDeTest(), magasin });
  assert.equal(objet.images.fond, null);
});

test('export : le chemin du dossier est celui d’aujourd’hui si le dossier a été renommé', async () => {
  const arbre = arbreDeTest();
  const r = basculerDossier(reglagesParDefaut(), parId('13'), true); // chemin mémorisé : Barre de favoris / Outils
  arbre[0].children[0].children[3].title = 'Boîte à outils';
  const objet = await construireExport({ reglages: r, arbre, magasin: magasinSimule() });
  assert.deepEqual(objet.reglages.groupes[0].cheminDossier, ['Barre de favoris', 'Boîte à outils']);
});

test('base64 : aller-retour exact, y compris sur 1 Mo d’octets quelconques', async () => {
  const octets = new Uint8Array(1 * Mo).map((_, i) => (i * 31) % 256);
  const relu = base64VersBlob(await blobVersBase64(new Blob([octets], { type: 'image/png' })), 'image/png');
  assert.equal(relu.size, octets.length);
  assert.deepEqual(new Uint8Array(await relu.arrayBuffer()), octets);
});

test('AC-F5-2 : aller-retour vers un autre profil, dossiers retrouvés par leur chemin', async () => {
  // Profil A : export
  const magasinA = magasinSimule({
    [CLE_IMAGE_FOND]: image(2000),
    [cleVignette('https://example.com/')]: image(1500),
  });
  const texte = serialiserExport(await construireExport({
    reglages: reglagesPersonnalises(), arbre: arbreDeTest(), magasin: magasinA,
  }));

  // Profil B : mêmes dossiers mais identifiants différents, et le dossier « Autres favoris » n'existe plus
  const arbreB = [{ id: '0', title: '', children: [{
    id: '501', title: 'Barre de favoris', children: [
      { id: '600', title: 'Exemple', url: 'https://example.com/' },
      { id: '777', title: 'Outils', children: [] },
    ],
  }] }];
  const magasinB = magasinSimule({ [cleVignette('https://autre.test/')]: image(30) });

  const lu = lireFichierExport(texte);
  assert.equal(lu.ok, true);
  const { reglages, nombreVignettes } = await importerSauvegarde({ donnees: lu.donnees, arbre: arbreB, magasin: magasinB });

  assert.deepEqual(reglages.groupes.map((g) => g.idDossier), ['501', '777', 'introuvable:Autres favoris']);
  assert.equal(reglages.groupes[1].libelle, 'Mes outils');
  assert.equal(reglages.groupeActif, '777'); // le groupe actif suit son dossier
  assert.deepEqual(reglages.groupes.map((g) => statutGroupe(g, arbreB)), ['ok', 'ok', 'introuvable']); // AC-F2-5
  assert.equal(reglages.colonnesMax, 8);
  assert.equal(reglages.tailleTuile, 'grande');
  assert.equal(reglages.theme, 'sombre');
  assert.deepEqual(reglages.fond, { type: 'image', valeur: 'fond', voile: 55 });
  // images : fond remplacé, vignette ajoutée, vignette existante d'une autre adresse conservée
  assert.equal(nombreVignettes, 1);
  assert.equal((await magasinB.lire(CLE_IMAGE_FOND)).size, 2000);
  assert.equal((await magasinB.lire(cleVignette('https://example.com/'))).size, 1500);
  assert.equal((await magasinB.lire(cleVignette('https://autre.test/'))).size, 30);
});

test('AC-F5-2 : l’import remplace les groupes plutôt que de les additionner', async () => {
  const texte = serialiserExport(await construireExport({
    reglages: basculerDossier(reglagesParDefaut(), parId('1'), true), arbre: arbreDeTest(), magasin: magasinSimule(),
  }));
  const { reglages } = await importerSauvegarde({
    donnees: lireFichierExport(texte).donnees, arbre: arbreDeTest(), magasin: magasinSimule(),
  });
  assert.deepEqual(reglages.groupes.map((g) => g.idDossier), ['1']);
});

test('AC-F5-2 : un fond « image » sans image dans le fichier retombe sur le fond du thème', async () => {
  const r = definirFond(reglagesPersonnalises(), { type: 'image', valeur: CLE_IMAGE_FOND, voile: 20 });
  const texte = serialiserExport(await construireExport({ reglages: r, arbre: arbreDeTest(), magasin: magasinSimule() }));
  const { reglages } = await importerSauvegarde({
    donnees: lireFichierExport(texte).donnees, arbre: arbreDeTest(), magasin: magasinSimule(),
  });
  assert.equal(reglages.fond.type, 'theme');
});

test('AC-F5-2 : des valeurs hors limites dans le fichier sont ramenées dans les bornes', async () => {
  const objet = await construireExport({ reglages: reglagesPersonnalises(), arbre: arbreDeTest(), magasin: magasinSimule() });
  objet.reglages.colonnesMax = 99;
  objet.reglages.theme = 'fluo';
  const lu = lireFichierExport(JSON.stringify(objet));
  const { reglages } = await importerSauvegarde({ donnees: lu.donnees, arbre: arbreDeTest(), magasin: magasinSimule() });
  assert.equal(reglages.colonnesMax, 10);
  assert.equal(reglages.theme, 'auto');
});

// ---------- AC-F5-3 : fichiers refusés, rien n'est modifié ----------

async function exportValide() {
  return construireExport({
    reglages: reglagesPersonnalises(), arbre: arbreDeTest(),
    magasin: magasinSimule({ [CLE_IMAGE_FOND]: image(100), [cleVignette('https://example.com/')]: image(100) }),
  });
}

test('AC-F5-3 : fichier vide, JSON invalide ou autre format → refus avec un message', async () => {
  for (const texte of ['', '   ', '{ pas du json', '[]', 'null', '{"format":"autre","version":1}']) {
    const res = lireFichierExport(texte);
    assert.equal(res.ok, false, texte);
    assert.ok(res.message.length > 0);
  }
  assert.equal(lireFichierExport(undefined).ok, false);
});

test('AC-F5-3 : version inconnue ou absente → refus', async () => {
  const objet = await exportValide();
  const futur = lireFichierExport(JSON.stringify({ ...objet, version: 2 }));
  assert.equal(futur.ok, false);
  assert.match(futur.message, /Version de fichier inconnue \(2\)/);
  const { version, ...sansVersion } = objet;
  assert.equal(lireFichierExport(JSON.stringify(sansVersion)).message, 'Version de fichier absente');
  assert.equal(lireFichierExport(JSON.stringify({ ...objet, version: '1' })).ok, false);
});

test('AC-F5-3 : groupes mal formés → refus', async () => {
  const objet = await exportValide();
  const variantes = [
    { ...objet, reglages: null },
    { ...objet, reglages: { ...objet.reglages, groupes: 'x' } },
    { ...objet, reglages: { ...objet.reglages, groupes: [{ cheminDossier: [], libelle: 'A' }] } },
    { ...objet, reglages: { ...objet.reglages, groupes: [{ cheminDossier: [1], libelle: 'A' }] } },
    { ...objet, reglages: { ...objet.reglages, groupes: [{ cheminDossier: ['A'] }] } },
    { ...objet, reglages: { ...objet.reglages, groupes: Array(21).fill({ cheminDossier: ['A'], libelle: 'A' }) } },
  ];
  for (const v of variantes) assert.equal(lireFichierExport(JSON.stringify(v)).ok, false);
});

test('AC-F5-3 : image corrompue, de mauvais type ou trop lourde → refus', async () => {
  const objet = await exportValide();
  const cas = [
    { ...objet, images: { ...objet.images, fond: { type: 'image/png', donnees: '!!! pas du base64 !!!' } } },
    { ...objet, images: { ...objet.images, fond: { type: 'application/pdf', donnees: 'AAAA' } } },
    { ...objet, images: { ...objet.images, fond: { type: 'image/png', donnees: await blobVersBase64(image(6 * Mo)) } } },
    { ...objet, images: { ...objet.images, vignettes: [{ adresse: 'https://a.test/', type: 'image/png', donnees: await blobVersBase64(image(3 * Mo)) }] } },
    { ...objet, images: { ...objet.images, vignettes: [{ type: 'image/png', donnees: 'AAAA' }] } },
  ];
  for (const c of cas) {
    const res = lireFichierExport(JSON.stringify(c));
    assert.equal(res.ok, false);
    assert.match(res.message, /Fichier invalide/);
  }
});

test('AC-F5-3 : un fichier refusé n’écrit rien (la validation ne touche pas au magasin)', async () => {
  const magasin = magasinSimule({ [CLE_IMAGE_FOND]: image(10), [cleVignette('https://a.test/')]: image(10) });
  const avant = [...magasin.donnees.entries()];
  const objet = await exportValide();
  const res = lireFichierExport(JSON.stringify({ ...objet, version: 99 }));
  assert.equal(res.ok, false);
  assert.deepEqual([...magasin.donnees.entries()], avant);
});

test('AC-F5-3 : une sauvegarde sans images est valide', async () => {
  const objet = await construireExport({
    reglages: basculerDossier(reglagesParDefaut(), parId('1'), true), arbre: arbreDeTest(), magasin: magasinSimule(),
  });
  delete objet.images;
  assert.equal(lireFichierExport(JSON.stringify(objet)).ok, true);
});
