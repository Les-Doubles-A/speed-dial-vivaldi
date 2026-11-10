// Applique l'apparence (F4) à la page : variables CSS, thème et fond.
import { DEGRADES, TAILLES_REM } from './reglages.js';

/** Valeurs d'apparence calculées à partir des réglages (pure, testable). */
export function variablesApparence(reglages, urlImage = '') {
  const { fond } = reglages;
  let fondCss = '';
  let couleurFond = '';
  if (fond.type === 'couleur') {
    couleurFond = fond.valeur;
  } else if (fond.type === 'degrade') {
    fondCss = DEGRADES.find((d) => d.id === fond.valeur)?.css ?? '';
  } else if (fond.type === 'image' && urlImage) {
    const voile = fond.voile / 100;
    fondCss = `linear-gradient(rgba(0, 0, 0, ${voile}), rgba(0, 0, 0, ${voile})), url("${urlImage}")`;
  }
  return {
    theme: reglages.theme,
    colonnesMax: String(reglages.colonnesMax),
    largeurTuile: `${TAILLES_REM[reglages.tailleTuile]}rem`,
    fondCss,
    couleurFond,
    avecFond: Boolean(fondCss || couleurFond),
  };
}

export function appliquerApparence(document, reglages, urlImage = '') {
  const v = variablesApparence(reglages, urlImage);
  const racine = document.documentElement;
  racine.dataset.theme = v.theme;
  racine.style.setProperty('--colonnes-max', v.colonnesMax);
  racine.style.setProperty('--tuile-min', v.largeurTuile);
  document.body.style.backgroundColor = v.couleurFond;
  document.body.style.backgroundImage = v.fondCss;
  document.body.classList.toggle('avec-fond', v.avecFond);
}
