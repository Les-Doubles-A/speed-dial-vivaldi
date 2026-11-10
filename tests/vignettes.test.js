import test from 'node:test';
import assert from 'node:assert/strict';
import {
  changerAdresseVignette,
  cleVignette,
  definirVignette,
  lireVignettes,
  retirerVignette,
} from '../src/images.js';

const Mo = 1024 * 1024;
const image = (octets, type = 'image/png') => new Blob([new Uint8Array(octets)], { type });

// Magasin en mémoire : même interface que le magasin IndexedDB.
function magasinSimule() {
  const donnees = new Map();
  return {
    donnees,
    async lire(cle) {
      return donnees.get(cle);
    },
    async ecrire(cle, blob) {
      donnees.set(cle, blob);
    },
    async supprimer(cle) {
      donnees.delete(cle);
    },
  };
}

test('AC-F3-5 : une vignette de 1 Mo est acceptée, enregistrée et relue', async () => {
  const magasin = magasinSimule();
  const verdict = await definirVignette(magasin, 'https://example.com/', image(1 * Mo));
  assert.equal(verdict.ok, true);
  const relue = await magasin.lire(cleVignette('https://example.com/'));
  assert.equal(relue.size, 1 * Mo);
  assert.equal(relue.type, 'image/png');
});

test('AC-F3-5 : une vignette de 3 Mo est refusée avec le message prévu, sans rien écrire', async () => {
  const magasin = magasinSimule();
  const verdict = await definirVignette(magasin, 'https://example.com/', image(3 * Mo));
  assert.equal(verdict.ok, false);
  assert.equal(verdict.message, 'Image trop lourde (2 Mo maximum)');
  assert.equal(magasin.donnees.size, 0);
});

test('AC-F3-5 : un refus laisse intacte la vignette déjà en place', async () => {
  const magasin = magasinSimule();
  await definirVignette(magasin, 'https://example.com/', image(1 * Mo));
  const refus = await definirVignette(magasin, 'https://example.com/', image(3 * Mo));
  assert.equal(refus.ok, false);
  assert.equal((await magasin.lire(cleVignette('https://example.com/'))).size, 1 * Mo);
});

test('format non pris en charge refusé', async () => {
  const magasin = magasinSimule();
  const verdict = await definirVignette(magasin, 'https://example.com/', image(1000, 'application/pdf'));
  assert.equal(verdict.ok, false);
  assert.equal(magasin.donnees.size, 0);
});

test('remplacer une vignette garde une seule entrée par adresse', async () => {
  const magasin = magasinSimule();
  await definirVignette(magasin, 'https://example.com/', image(1000));
  await definirVignette(magasin, 'https://example.com/', image(2000));
  assert.equal(magasin.donnees.size, 1);
  assert.equal((await magasin.lire(cleVignette('https://example.com/'))).size, 2000);
});

test('retirer une vignette la supprime ; retirer une absente ne casse rien', async () => {
  const magasin = magasinSimule();
  await definirVignette(magasin, 'https://example.com/', image(1000));
  await retirerVignette(magasin, 'https://example.com/');
  assert.equal(magasin.donnees.size, 0);
  await retirerVignette(magasin, 'https://absente.test/');
});

test('la vignette suit l’adresse quand le signet est modifié', async () => {
  const magasin = magasinSimule();
  await definirVignette(magasin, 'https://ancien.test/', image(1500));
  assert.equal(await changerAdresseVignette(magasin, 'https://ancien.test/', 'https://nouveau.test/'), true);
  assert.equal(await magasin.lire(cleVignette('https://ancien.test/')), undefined);
  assert.equal((await magasin.lire(cleVignette('https://nouveau.test/'))).size, 1500);
  // sans vignette ou sans changement d'adresse : rien à faire
  assert.equal(await changerAdresseVignette(magasin, 'https://sans.test/', 'https://autre.test/'), false);
  assert.equal(await changerAdresseVignette(magasin, 'https://nouveau.test/', 'https://nouveau.test/'), false);
});

test('une vignette survit à la suppression puis à la restauration d’un signet (adresse inchangée)', async () => {
  const magasin = magasinSimule();
  await definirVignette(magasin, 'https://example.com/', image(1000));
  // la suppression d'un signet ne touche pas au magasin ; le signet restauré a un autre identifiant, même adresse
  const vignettes = await lireVignettes(magasin, ['https://example.com/']);
  assert.equal(vignettes.get('https://example.com/').size, 1000);
});

test('lireVignettes : ne renvoie que les adresses qui en ont une, sans doublon', async () => {
  const magasin = magasinSimule();
  await definirVignette(magasin, 'https://a.test/', image(10));
  const vignettes = await lireVignettes(magasin, ['https://a.test/', 'https://b.test/', 'https://a.test/']);
  assert.deepEqual([...vignettes.keys()], ['https://a.test/']);
});
