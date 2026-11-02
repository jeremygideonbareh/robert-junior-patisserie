// Menu taken from @robertjuniorpatisserie posts (Jun–Aug 2026). Only items with a clean single-subject photo are listed.
// No prices published yet, so none are shown.
export const PRODUCTS = [
  { id: 'raspberry-vanilla-tart', name: 'Raspberry Vanilla Tart', note: 'a classic, a favourite', cat: 'tarts', img: 'img/raspberry-vanilla-tart.webp', plate: 'img/raspberry-vanilla-tart.webp', bg: '#e8c47a', ink: '#22060a', alt: 'Raspberry vanilla tart with vanilla cream, blueberries and gold leaf' },
  { id: 'almond-berry-croissant', name: 'Almond Berry Croissant', note: 'frangipani · berry gel', cat: 'viennoiserie', img: 'img/almond-berry-croissant.webp', plate: 'img/almond-berry-croissant.webp', bg: '#b3122e', ink: '#f3e8d6', alt: 'Almond berry croissant with berry gel and almond frangipani' },
  { id: 'tiramisu', name: 'Tiramisu', note: 'came for this one', cat: 'tarts', img: 'img/card-tiramisu.webp', plate: 'img/card-tiramisu.webp', bg: '#6f7d4a', ink: '#f3e8d6', alt: 'Tiramisu in a cup, dusted with cocoa, on a speckled saucer' },
  { id: 'berliner', name: 'Berliner', note: 'filled & sugar-dusted', cat: 'viennoiserie', img: 'img/card-berliner.webp', plate: 'img/card-berliner.webp', bg: '#2b0a0f', ink: '#f3e8d6', alt: 'Sugar-dusted berliners piped with vanilla cream' },
  { id: 'chocolate-orange-cake', name: 'Chocolate Orange Cake', note: 'orange, chocolate & love', cat: 'chocolate', img: 'img/card-chocolate-orange.webp', plate: 'img/card-chocolate-orange.webp', bg: '#a4542a', ink: '#f3e8d6', alt: 'Slice of layered chocolate orange cake with candied orange' },
  { id: 'happiness-tray', name: 'The Happiness Tray', note: 'our most loved, together', cat: 'boxes', img: 'img/happiness-tray.webp', plate: 'img/happiness-tray.webp', bg: '#5a0e16', ink: '#f3e8d6', alt: 'A tray of croissants, berliners, cookies and cruffins' },
];

export const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export const IG_HANDLE = 'robertjuniorpatisserie';

// All enquiries go to WhatsApp. Put the client's number here, digits only with country code, e.g. '919876543210'.
// While it's empty, links still open WhatsApp with the message ready, and the visitor picks the chat.
export const WHATSAPP_NUMBER = '';
export const waLink = (text = "Hi Robert Junior! I'd like to know more.") =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
