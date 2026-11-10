// Arbre de signets simulé, forme identique à chrome.bookmarks.getTree().
export function arbreDeTest() {
  return [
    {
      id: '0',
      title: '',
      children: [
        {
          id: '1',
          title: 'Barre de favoris',
          children: [
            { id: '10', title: 'Exemple', url: 'https://example.com/' },
            { id: '11', title: 'Wikipédia', url: 'https://fr.wikipedia.org/' },
            { id: '12', title: '', url: 'https://sans-titre.test/page' },
            {
              id: '13',
              title: 'Outils',
              children: [{ id: '130', title: 'Dev', url: 'http://dev.test/' }],
            },
          ],
        },
        {
          id: '2',
          title: 'Autres favoris',
          children: [
            { id: '20', title: 'Bookmarklet', url: 'javascript:alert(1)' },
            { id: '21', title: 'Vide', children: [] },
          ],
        },
      ],
    },
  ];
}
