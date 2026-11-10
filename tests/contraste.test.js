// Garde-fou de lisibilité (AC-F4-6, partie automatique) : lit les palettes dans styles/page.css.
// Les textes sont toujours posés sur --fond ou --carte (surface opaque), jamais directement sur l'image.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../styles/page.css', import.meta.url), 'utf8');

function bloc(debut) {
  const i = css.indexOf(debut);
  assert.notEqual(i, -1, `bloc introuvable : ${debut}`);
  const fin = css.indexOf('}', i);
  const variables = {};
  for (const m of css.slice(i, fin).matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6});/g)) variables[m[1]] = m[2];
  return variables;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [claire, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (claire + 0.05) / (sombre + 0.05);
}

const palettes = {
  clair: bloc(':root {'),
  'sombre (auto)': bloc(':root:not([data-theme="clair"])'),
  'sombre (choisi)': bloc(':root[data-theme="sombre"]'),
};

for (const [nom, p] of Object.entries(palettes)) {
  test(`AC-F4-6 : contraste d’au moins 4,5:1 dans la palette ${nom}`, () => {
    for (const texte of ['texte', 'texte-doux', 'accent', 'erreur']) {
      for (const surface of ['fond', 'carte']) {
        const valeur = ratio(p[texte], p[surface]);
        assert.ok(valeur >= 4.5, `${texte} sur ${surface} : ${valeur.toFixed(2)}:1`);
      }
    }
  });
}

test('les deux palettes sombres sont identiques', () => {
  assert.deepEqual(palettes['sombre (auto)'], palettes['sombre (choisi)']);
});
