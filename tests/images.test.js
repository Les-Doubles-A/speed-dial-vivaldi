import test from 'node:test';
import assert from 'node:assert/strict';
import { TAILLE_MAX_FOND, TAILLE_MAX_VIGNETTE, validerImage } from '../src/images.js';

const Mo = 1024 * 1024;
const fichier = (type, octets) => ({ type, size: octets });

test('AC-F4-4 : une image de 4 Mo est acceptée comme fond', () => {
  assert.deepEqual(validerImage(fichier('image/jpeg', 4 * Mo), TAILLE_MAX_FOND), { ok: true, message: '' });
});

test('AC-F4-4 : une image de 6 Mo est refusée avec un message', () => {
  const verdict = validerImage(fichier('image/png', 6 * Mo), TAILLE_MAX_FOND);
  assert.equal(verdict.ok, false);
  assert.equal(verdict.message, 'Image trop lourde (5 Mo maximum)');
});

test('limite exacte de 5 Mo acceptée, un octet de plus refusé', () => {
  assert.equal(validerImage(fichier('image/webp', 5 * Mo), TAILLE_MAX_FOND).ok, true);
  assert.equal(validerImage(fichier('image/webp', 5 * Mo + 1), TAILLE_MAX_FOND).ok, false);
});

test('AC-F3-5 (limite vignette, utilisée en T6) : 1 Mo accepté, 3 Mo refusé à 2 Mo maximum', () => {
  assert.equal(validerImage(fichier('image/png', 1 * Mo), TAILLE_MAX_VIGNETTE).ok, true);
  const refus = validerImage(fichier('image/png', 3 * Mo), TAILLE_MAX_VIGNETTE);
  assert.equal(refus.message, 'Image trop lourde (2 Mo maximum)');
});

test('type non pris en charge et fichier absent', () => {
  assert.equal(validerImage(fichier('application/pdf', 1000), TAILLE_MAX_FOND).ok, false);
  assert.equal(validerImage(fichier('image/svg+xml', 1000), TAILLE_MAX_FOND).ok, false);
  assert.equal(validerImage(null, TAILLE_MAX_FOND).ok, false);
});
