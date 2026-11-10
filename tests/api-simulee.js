// API de signets simulée, même forme que chrome.bookmarks (asynchrone), sur un arbre modifiable.
// Option `decalageAvant` : reproduit le comportement connu de Chrome où, dans le même dossier, `move` vers
// l'avant insère AVANT l'élément d'index d'origine (la position finale est alors index - 1).
export function creerApiSimulee(arbre, { decalageAvant = false } = {}) {
  let compteur = 1000;

  function trouverAvecParent(id, noeud = arbre[0], parent = null) {
    if (noeud.id === id) return { noeud, parent };
    for (const enfant of noeud.children || []) {
      const trouve = trouverAvecParent(id, enfant, noeud);
      if (trouve) return trouve;
    }
    return null;
  }

  function vue(noeud, parent) {
    const { children, ...reste } = noeud;
    return { ...reste, parentId: parent?.id, index: parent ? parent.children.indexOf(noeud) : 0 };
  }

  return {
    async getTree() {
      return structuredClone(arbre);
    },
    async get(id) {
      const t = trouverAvecParent(id);
      if (!t) throw new Error(`Aucun signet d'identifiant ${id}`);
      return [vue(t.noeud, t.parent)];
    },
    async getChildren(id) {
      const t = trouverAvecParent(id);
      if (!t) throw new Error(`Aucun dossier d'identifiant ${id}`);
      return (t.noeud.children || []).map((enfant) => vue(enfant, t.noeud));
    },
    async create({ parentId, index, title, url }) {
      const t = trouverAvecParent(parentId);
      if (!t || t.noeud.url !== undefined) throw new Error('Dossier parent invalide');
      const noeud = { id: String(++compteur), title: title ?? '' };
      if (url !== undefined) noeud.url = url;
      else noeud.children = [];
      const liste = (t.noeud.children ??= []);
      if (index !== undefined && (index < 0 || index > liste.length)) throw new Error('Index hors limites');
      liste.splice(index ?? liste.length, 0, noeud);
      return vue(noeud, t.noeud);
    },
    async update(id, changements) {
      const t = trouverAvecParent(id);
      if (!t) throw new Error(`Aucun signet d'identifiant ${id}`);
      if (changements.title !== undefined) t.noeud.title = changements.title;
      if (changements.url !== undefined) t.noeud.url = changements.url;
      return vue(t.noeud, t.parent);
    },
    async remove(id) {
      const t = trouverAvecParent(id);
      if (!t || !t.parent) throw new Error(`Aucun signet d'identifiant ${id}`);
      if (t.noeud.children?.length) throw new Error('Impossible de supprimer un dossier non vide');
      t.parent.children.splice(t.parent.children.indexOf(t.noeud), 1);
    },
    async move(id, { parentId, index }) {
      const t = trouverAvecParent(id);
      const cible = trouverAvecParent(parentId ?? t.parent.id);
      if (!t || !cible) throw new Error('Déplacement invalide');
      const depart = t.parent.children.indexOf(t.noeud);
      t.parent.children.splice(depart, 1);
      let arrivee = index ?? cible.noeud.children.length;
      if (decalageAvant && t.parent === cible.noeud && arrivee > depart) arrivee -= 1;
      cible.noeud.children.splice(arrivee, 0, t.noeud);
      return vue(t.noeud, cible.noeud);
    },
  };
}
