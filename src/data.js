// Menu taken from @robertjuniorpatisserie posts (Jun–Aug 2026). Only items with a clean single-subject photo are listed.
// No prices published yet, so none are shown.
export const PRODUCTS = [
  { id: 'almond-berry-croissant', name: 'Almond Berry Croissant', note: 'frangipani · berry gel', cat: 'viennoiserie', img: 'img/almond-berry-croissant.webp', tag: 'New', alt: 'Almond berry croissant with berry gel and almond frangipani' },
  { id: 'raspberry-vanilla-tart', name: 'Raspberry Vanilla Tart', note: 'a classic, a favourite', cat: 'tarts', img: 'img/raspberry-vanilla-tart.webp', tag: 'Signature', alt: 'Raspberry vanilla tart topped with a single raspberry' },
  { id: 'tiramisu', name: 'Tiramisu', note: 'came for this one', cat: 'tarts', img: 'img/card-tiramisu.webp', alt: 'Tiramisu in a cup, dusted with cocoa, on a speckled saucer' },
  { id: 'berliner', name: 'Berliner', note: 'filled & sugar-dusted', cat: 'viennoiserie', img: 'img/card-berliner.webp', alt: 'Sugar-dusted berliners piped with vanilla cream' },
  { id: 'chocolate-orange-cake', name: 'Chocolate Orange Cake', note: 'orange, chocolate & love', cat: 'chocolate', img: 'img/card-chocolate-orange.webp', alt: 'Slice of layered chocolate orange cake with candied orange' },
  { id: 'happiness-tray', name: 'The Happiness Tray', note: 'our most loved, together', cat: 'boxes', img: 'img/happiness-tray.webp', tag: 'To share', alt: 'A tray of croissants, berliners, cookies and cruffins' },
];

export const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export const IG_HANDLE = 'robertjuniorpatisserie';
