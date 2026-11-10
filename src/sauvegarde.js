// Boutons « Exporter » et « Importer » du panneau Personnaliser (F5). La logique est dans export.js.
import {
  TAILLE_MAX_IMPORT,
  construireExport,
  importerSauvegarde,
  lireFichierExport,
  nomFichierExport,
  serialiserExport,
} from './export.js';
import { magasinDepuisBase } from './images.js';

// Quand IndexedDB est indisponible : un magasin vide, pour que l'export des réglages reste possible.
const magasinVide = {
  async lire() { return undefined; },
  async ecrire() { throw new Error('Stockage des images indisponible'); },
  async supprimer() {},
  async cles() { return []; },
};

/**
 * obtenirReglages() : réglages courants. obtenirArbre() : arbre de signets à jour (async).
 * obtenirBase() : base IndexedDB ou null. appliquerImport(reglages) : enregistre et redessine (async).
 * annoncer(message, erreur) : message dans la zone d'état de la page.
 */
export function initialiserSauvegarde({ obtenirReglages, obtenirArbre, obtenirBase, appliquerImport, annoncer }) {
  const message = document.getElementById('message-sauvegarde');
  const erreur = document.getElementById('erreur-sauvegarde');
  const champImport = document.getElementById('champ-import');
  const dialogue = document.getElementById('dialogue-apparence');

  const magasin = () => {
    const base = obtenirBase();
    return base ? magasinDepuisBase(base) : magasinVide;
  };
  const effacerMessages = () => {
    message.textContent = '';
    erreur.textContent = '';
  };

  document.getElementById('bouton-exporter').addEventListener('click', async () => {
    effacerMessages();
    try {
      const objet = await construireExport({
        reglages: obtenirReglages(),
        arbre: await obtenirArbre(),
        magasin: magasin(),
      });
      const texte = serialiserExport(objet);
      const fichier = new Blob([texte], { type: 'application/json;charset=utf-8' }); // UTF-8
      const adresse = URL.createObjectURL(fichier);
      const lien = document.createElement('a');
      lien.href = adresse;
      lien.download = nomFichierExport(new Date());
      document.body.append(lien);
      lien.click();
      lien.remove();
      setTimeout(() => URL.revokeObjectURL(adresse), 10000);
      const taille = (fichier.size / (1024 * 1024)).toFixed(1);
      message.textContent = `Sauvegarde exportée : ${lien.download} (${taille} Mo).`;
    } catch (e) {
      console.error("Impossible d'exporter les réglages :", e);
      erreur.textContent = "Impossible d'exporter les réglages.";
    }
  });

  champImport.addEventListener('change', async () => {
    effacerMessages();
    const fichier = champImport.files?.[0];
    if (!fichier) return;
    try {
      if (fichier.size > TAILLE_MAX_IMPORT) {
        erreur.textContent = 'Fichier trop volumineux (120 Mo maximum).';
        return;
      }
      const lu = lireFichierExport(await fichier.text());
      if (!lu.ok) {
        erreur.textContent = lu.message; // AC-F5-3 : rien n'a été modifié
        return;
      }
      const { groupes } = lu.donnees.reglages;
      const nombreVignettes = lu.donnees.vignettes.length;
      const confirme = window.confirm(
        `Importer cette sauvegarde (${groupes.length} groupe(s), ${nombreVignettes} vignette(s)) ? ` +
          'Tes groupes et ta personnalisation actuels seront remplacés.',
      );
      if (!confirme) return;
      const resultat = await importerSauvegarde({ donnees: lu.donnees, arbre: await obtenirArbre(), magasin: magasin() });
      await appliquerImport(resultat.reglages);
      dialogue.close();
      annoncer('Sauvegarde importée.');
    } catch (e) {
      console.error("Impossible d'importer la sauvegarde :", e);
      erreur.textContent = "Impossible d'importer la sauvegarde. Tes réglages actuels n'ont pas été remplacés.";
    } finally {
      champImport.value = '';
    }
  });
}
