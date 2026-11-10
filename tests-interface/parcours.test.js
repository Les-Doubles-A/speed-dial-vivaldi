// Parcours complets de la vraie page, dans jsdom. Complète `npm test` ; ne remplace pas les essais dans Vivaldi.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Mo, attendre, octets, ouvrirPage, reglagesAvecGroupe } from './aide.js';
import { arbreDeTest } from '../tests/arbre-test.js';

const clicDroit = (p, noeud) => p.evt(noeud, 'contextmenu', { clientX: 10, clientY: 10 });

test('F1/F2 : invitation au premier lancement, choix de dossiers, groupes, sous-dossier et fil d’Ariane', async () => {
  const p = await ouvrirPage({ arbre: arbreDeTest() });
  assert.match(p.$('grille').textContent, /Aucun dossier choisi/); // AC-F2-1
  p.$('bouton-gerer').click();
  const cases = [...p.window.document.querySelectorAll('#arbre input')];
  for (const indice of [0, 2]) { // « Barre de favoris » puis « Autres favoris »
    cases[indice].checked = true;
    p.evt(cases[indice], 'change');
    await attendre();
  }
  assert.deepEqual([...p.window.document.querySelectorAll('.onglet')].map((o) => o.textContent), ['Barre de favoris', 'Autres favoris']); // AC-F2-2
  assert.deepEqual(p.tuiles().slice(0, 4).map((t) => t.querySelector('.titre-tuile').textContent), ['Exemple', 'Wikipédia', 'sans-titre.test', 'Outils']); // AC-F1-1
  p.tuile('Outils').click(); // AC-F1-3
  await attendre();
  assert.match(p.$('fil').textContent, /Barre de favoris.*Outils/);
  p.window.document.querySelector('#fil button').click();
  await attendre();
  assert.ok(p.tuile('Exemple'));
});

test('F1 : dossier vide avec bouton Ajouter, adresse non prise en charge désactivée', async () => {
  const donnees = { reglages: reglagesAvecGroupe({ groupes: [{ idDossier: '2', cheminDossier: ['Autres favoris'], libelle: 'Autres' }], groupeActif: '2' }) };
  const p = await ouvrirPage({ arbre: arbreDeTest(), donnees });
  const bookmarklet = p.tuile('Bookmarklet');
  assert.equal(bookmarklet.getAttribute('aria-disabled'), 'true'); // AC-F1-6
  assert.equal(bookmarklet.title, 'Adresse non prise en charge');
  assert.equal(bookmarklet.tagName, 'SPAN');
  p.tuile('Vide').click();
  await attendre();
  assert.match(p.$('grille').textContent, /Ce dossier ne contient aucun signet/); // AC-F1-4
  assert.ok([...p.window.document.querySelectorAll('#grille button')].some((b) => b.textContent === 'Ajouter'));
});

test('F2 : groupe dont le dossier a disparu → « Dossier introuvable », bouton Retirer', async () => {
  const donnees = { reglages: reglagesAvecGroupe({
    groupes: [
      { idDossier: '1', cheminDossier: ['Barre de favoris'], libelle: 'Barre' },
      { idDossier: '99', cheminDossier: ['Disparu'], libelle: 'Disparu' },
    ],
    groupeActif: '99',
  }) };
  const p = await ouvrirPage({ arbre: arbreDeTest(), donnees });
  assert.match(p.$('grille').textContent, /Dossier introuvable/); // AC-F2-5
  assert.ok(p.window.document.querySelectorAll('.onglet.introuvable').length === 1);
  [...p.window.document.querySelectorAll('#grille button')].find((b) => b.textContent === 'Retirer ce groupe').click();
  await attendre(80);
  assert.deepEqual(donnees.reglages.groupes.map((g) => g.idDossier), ['1']);
  assert.ok(p.tuile('Exemple')); // les autres groupes restent utilisables
});

test('F4 : colonnes, taille, thème, fond (couleur, image), refus de 6 Mo, réinitialisation', async () => {
  const donnees = { reglages: reglagesAvecGroupe() };
  const p = await ouvrirPage({ arbre: arbreDeTest(), donnees });
  const racine = p.window.document.documentElement;
  p.$('bouton-apparence').click();

  p.$('reglage-colonnes').value = '11'; p.evt(p.$('reglage-colonnes'), 'change'); await attendre();
  assert.equal(p.$('reglage-colonnes').value, '10'); // AC-F4-1
  assert.equal(racine.style.getPropertyValue('--colonnes-max'), '10');
  p.$('reglage-colonnes').value = '1'; p.evt(p.$('reglage-colonnes'), 'change'); await attendre();
  assert.equal(racine.style.getPropertyValue('--colonnes-max'), '2');

  p.$('reglage-taille').value = 'grande'; p.evt(p.$('reglage-taille'), 'change'); await attendre();
  assert.equal(racine.style.getPropertyValue('--tuile-min'), '12rem'); // AC-F4-2
  p.$('reglage-theme').value = 'sombre'; p.evt(p.$('reglage-theme'), 'change'); await attendre();
  assert.equal(racine.dataset.theme, 'sombre'); // AC-F4-3

  p.$('reglage-fond-type').value = 'couleur'; p.evt(p.$('reglage-fond-type'), 'change'); await attendre();
  assert.ok(p.window.document.body.classList.contains('avec-fond'));
  p.$('reglage-fond-type').value = 'image'; p.evt(p.$('reglage-fond-type'), 'change'); await attendre();
  const avant = JSON.stringify(donnees.reglages.fond);
  p.choisirFichier(p.$('reglage-image'), new File([octets(6 * Mo)], 'gros.png', { type: 'image/png' }));
  await attendre();
  assert.equal(p.$('erreur-image').textContent, 'Image trop lourde (5 Mo maximum)'); // AC-F4-4
  assert.equal(JSON.stringify(donnees.reglages.fond), avant);
  p.choisirFichier(p.$('reglage-image'), new File([octets(4 * Mo)], 'ok.png', { type: 'image/png' }));
  await attendre(120);
  assert.equal(donnees.reglages.fond.type, 'image');
  assert.match(p.window.document.body.style.backgroundImage, /url\(/);

  assert.equal(donnees.reglages.theme, 'sombre'); // AC-F4-5 : enregistré au fil des changements
  p.$('bouton-reinitialiser').click(); await attendre(100);
  assert.equal(racine.dataset.theme, 'auto');
  assert.equal(donnees.reglages.colonnesMax, 6);
  assert.equal(donnees.reglages.groupes.length, 1); // les groupes sont conservés
});

test('F3 : ajout (refusé puis accepté), modification, suppression puis annulation, clavier, glisser-déposer', async () => {
  const delais = [];
  const setTimeoutOrigine = globalThis.setTimeout;
  globalThis.setTimeout = (f, d, ...a) => { delais.push(d); return setTimeoutOrigine(f, d, ...a); };
  try {
    const p = await ouvrirPage({ arbre: arbreDeTest(), donnees: { reglages: reglagesAvecGroupe() } });
    const titres = async () => (await p.api.getChildren('1')).map((n) => n.title || '(sans titre)');

    p.tuile('Ajouter un site').click();
    p.$('champ-titre').value = 'Neuf'; p.$('champ-adresse').value = 'neuf.test';
    p.evt(p.$('formulaire-tuile'), 'submit'); await attendre();
    assert.match(p.$('erreur-adresse').textContent, /Adresse invalide/); // AC-F3-2
    assert.equal((await p.api.getChildren('1')).length, 4);
    p.$('champ-adresse').value = 'https://neuf.test/';
    p.evt(p.$('formulaire-tuile'), 'submit'); await attendre(80);
    assert.equal((await titres()).at(-1), 'Neuf'); // AC-F3-1
    assert.equal(p.$('dialogue-tuile').open, false);

    clicDroit(p, p.tuile('Neuf')); p.$('menu-modifier').click(); await attendre();
    assert.equal(p.$('champ-titre').value, 'Neuf');
    p.$('champ-titre').value = 'Renommé'; p.evt(p.$('formulaire-tuile'), 'submit'); await attendre(80);
    assert.ok((await titres()).includes('Renommé')); // AC-F3-2

    const avant = await titres();
    clicDroit(p, p.tuile('Wikipédia')); p.$('menu-supprimer').click(); await attendre(80);
    assert.ok(!(await titres()).includes('Wikipédia')); // AC-F3-3
    assert.equal(p.$('annulation').hidden, false);
    assert.ok(delais.includes(10000));
    p.$('bouton-annuler-suppression').click(); await attendre(100);
    assert.deepEqual(await titres(), avant);

    p.evt(p.tuiles()[0], 'keydown', { key: 'ArrowRight', altKey: true }); await attendre(80); // AC-F3-4 (clavier)
    assert.deepEqual((await titres()).slice(0, 2), ['Wikipédia', 'Exemple']);

    const transfert = { donnees: {}, setData(k, v) { this.donnees[k] = v; }, getData(k) { return this.donnees[k]; } }; // AC-F3-4 (souris)
    const source = p.tuiles().at(2);
    const idSource = source.dataset.id;
    p.evt(source, 'dragstart', { dataTransfer: transfert });
    p.evt(p.tuiles()[0], 'drop', { dataTransfer: transfert }); await attendre(80);
    assert.equal((await p.api.getChildren('1'))[0].id, idSource);

    clicDroit(p, p.tuile('Outils')); // un dossier n'a ni modification ni suppression
    assert.equal(p.$('menu-tuile').hidden, true);
  } finally {
    globalThis.setTimeout = setTimeoutOrigine;
  }
});

test('F3 : vignette de 3 Mo refusée, de 1 Mo gardée après redémarrage, suit l’adresse, se retire', async () => {
  const donnees = { reglages: reglagesAvecGroupe() };
  const arbre = arbreDeTest();
  let p = await ouvrirPage({ arbre, donnees });
  clicDroit(p, p.tuile('Exemple')); p.$('menu-modifier').click(); await attendre();
  p.choisirFichier(p.$('champ-vignette'), new File([octets(3 * Mo)], 'grosse.png', { type: 'image/png' }));
  assert.equal(p.$('erreur-vignette').textContent, 'Image trop lourde (2 Mo maximum)'); // AC-F3-5
  p.choisirFichier(p.$('champ-vignette'), new File([octets(1 * Mo)], 'petite.png', { type: 'image/png' }));
  p.evt(p.$('formulaire-tuile'), 'submit'); await attendre(120);
  assert.ok(p.tuile('Exemple').querySelector('img.vignette'));

  p = await ouvrirPage({ arbre: await p.api.getTree(), donnees, reutiliserBase: true }); // « redémarrage »
  assert.ok(p.tuile('Exemple').querySelector('img.vignette'));

  clicDroit(p, p.tuile('Exemple')); p.$('menu-modifier').click(); await attendre();
  p.$('champ-adresse').value = 'https://nouvelle.test/';
  p.evt(p.$('formulaire-tuile'), 'submit'); await attendre(120);
  assert.ok(p.tuile('Exemple').querySelector('img.vignette')); // la vignette suit l'adresse

  clicDroit(p, p.tuile('Exemple')); p.$('menu-modifier').click(); await attendre();
  p.$('bouton-retirer-vignette').click();
  p.evt(p.$('formulaire-tuile'), 'submit'); await attendre(120);
  assert.equal(p.window.document.querySelectorAll('.vignette').length, 0);
});

test('F5 : export d’un profil, import dans un autre, fichiers invalides refusés sans rien changer', async () => {
  const donneesA = { reglages: reglagesAvecGroupe({
    groupes: [
      { idDossier: '1', cheminDossier: ['Barre de favoris'], libelle: 'Barre' },
      { idDossier: '13', cheminDossier: ['Barre de favoris', 'Outils'], libelle: 'Mes outils' },
      { idDossier: '2', cheminDossier: ['Autres favoris'], libelle: 'Autres' },
    ],
    groupeActif: '1', colonnesMax: 8, tailleTuile: 'grande', theme: 'sombre',
  }) };
  const a = await ouvrirPage({ arbre: arbreDeTest(), donnees: donneesA });
  clicDroit(a, a.tuile('Exemple')); a.$('menu-modifier').click(); await attendre();
  a.choisirFichier(a.$('champ-vignette'), new File([octets(1500)], 'v.png', { type: 'image/png' }));
  a.evt(a.$('formulaire-tuile'), 'submit'); await attendre(120);
  a.window.document.querySelectorAll('.onglet')[1].click(); await attendre(60); // groupe actif = « Mes outils »
  a.$('bouton-apparence').click();
  a.$('bouton-exporter').click(); await attendre(150);
  assert.match(a.telechargements.at(-1), /^speed-dial-reglages-\d{4}-\d{2}-\d{2}\.json$/); // AC-F5-1
  const texte = await a.blobsCrees.at(-1).text();
  const objet = JSON.parse(texte);
  assert.equal(objet.version, 1);
  assert.equal(objet.images.vignettes.length, 1);

  // Profil B : autres identifiants, dossier « Autres favoris » absent, base vide
  const arbreB = [{ id: '0', title: '', children: [{ id: '501', title: 'Barre de favoris', children: [
    { id: '600', title: 'Exemple', url: 'https://example.com/' },
    { id: '777', title: 'Outils', children: [] }] }] }];
  const donneesB = {};
  const b = await ouvrirPage({ arbre: arbreB, donnees: donneesB });
  b.$('bouton-apparence').click();

  b.choisirFichier(b.$('champ-import'), new File(['{ pas du json'], 'x.json')); await attendre(60);
  assert.match(b.$('erreur-sauvegarde').textContent, /pas un fichier JSON valide/); // AC-F5-3
  b.choisirFichier(b.$('champ-import'), new File([JSON.stringify({ ...objet, version: 5 })], 'x.json')); await attendre(60);
  assert.match(b.$('erreur-sauvegarde').textContent, /Version de fichier inconnue \(5\)/);
  assert.equal(donneesB.reglages, undefined); // rien n'a changé

  b.choisirFichier(b.$('champ-import'), new File([texte], 'sauvegarde.json')); await attendre(250); // AC-F5-2
  assert.deepEqual(donneesB.reglages.groupes.map((g) => g.idDossier), ['501', '777', 'introuvable:Autres favoris']);
  assert.equal(donneesB.reglages.groupeActif, '777');
  assert.equal(donneesB.reglages.colonnesMax, 8);
  assert.equal(b.$('dialogue-apparence').open, false);
  assert.ok(b.window.document.querySelector('.onglet.introuvable'));
  b.window.document.querySelector('.onglet').click(); await attendre(120);
  assert.ok(b.tuile('Exemple').querySelector('img.vignette')); // la vignette est revenue
});
