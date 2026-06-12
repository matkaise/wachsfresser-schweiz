/* products.jsx — gemeinsame Produktdaten */

const PRODUCTS = [
  {
    id: 'saentis-klein-creme',
    name: 'Säntis · Creme',
    category: 'Säntis',
    desc: 'Kompakter Wachsfresser aus handgegossenem Beton, bereit mit Docht und Sojawachs-Startfüllung.',
    long: 'Säntis ist der kompakte Wachsfresser für ruhige Lichtmomente. Das Betongefäss wird in Salmsach von Hand gegossen und ist bereits mit Glasfaserdocht und Sojawachs-Startfüllung vorbereitet. Danach kannst du geeignete Wachsreste nachlegen.',
    price: 14.99,
    img: 'assets/product/saentis-creme.jpg',
    crop: 'center',
    badge: 'Bereit gefüllt',
    meta: ['Glasfaserdocht', 'Sojawachs-Startfüllung', 'Wiederbefüllbar'],
    tags: ['Creme', 'Kompakt'],
    color: '#D9D0BE',
  },
  {
    id: 'saentis-klein-anthrazit',
    name: 'Säntis · Anthrazit',
    category: 'Säntis',
    desc: 'Dunkler Beton, kompakte Form, wiederbefüllbar mit Wachsresten oder Nachfüllwachs.',
    long: 'Säntis in Anthrazit verbindet ein kompaktes Betongefäss mit einem Glasfaserdocht. Jedes Stück wird von Hand gefertigt; leichte Farbabweichungen gehören zum Material.',
    price: 14.99,
    img: 'assets/product/saentis-anthrazit.jpg',
    crop: 'center',
    badge: null,
    meta: ['Glasfaserdocht', 'Sojawachs-Startfüllung', 'Wiederbefüllbar'],
    tags: ['Anthrazit', 'Kompakt'],
    color: '#2A2825',
  },
  {
    id: 'eiger-gross-creme',
    name: 'Eiger · Creme',
    category: 'Eiger',
    desc: 'Outdoor-Wachsfresser aus Beton mit Holzfaserdocht. Nur für den Aussenbereich gedacht.',
    long: 'Eiger ist die schwere Aussenvariante aus handgegossenem Beton. Er kommt mit Holzfaserdocht und Sojawachs-Startfüllung und ist für Terrasse, Balkon oder Garten gedacht. Diese Variante ist nicht für Innenräume vorgesehen.',
    price: 59.99,
    img: 'assets/product/eiger-creme.jpg',
    crop: 'center',
    badge: 'Aussenbereich',
    meta: ['Holzfaserdocht', 'Nur Aussenbereich', 'Wiederbefüllbar'],
    tags: ['Creme', 'Outdoor'],
    color: '#D9D0BE',
  },
  {
    id: 'eiger-gross-anthrazit',
    name: 'Eiger · Anthrazit',
    category: 'Eiger',
    desc: 'Massiver Outdoor-Wachsfresser in Anthrazit, handgegossen und wiederbefüllbar.',
    long: 'Eiger in Anthrazit ist für den Aussenbereich konzipiert. Das Betongefäss wird in Salmsach gegossen, mit Holzfaserdocht vorbereitet und mit einer Sojawachs-Startfüllung ausgeliefert.',
    price: 59.99,
    img: 'assets/product/eiger-anthrazit.jpg',
    crop: 'center',
    badge: 'Outdoor',
    meta: ['Holzfaserdocht', 'Nur Aussenbereich', 'Wiederbefüllbar'],
    tags: ['Anthrazit', 'Outdoor'],
    color: '#2A2825',
  },
];

const CATEGORIES = ['Alle', 'Säntis', 'Eiger'];

if (typeof window !== 'undefined') {
  window.PRODUCTS = PRODUCTS;
  window.CATEGORIES = CATEGORIES;
}

if (typeof module !== 'undefined') {
  module.exports = { PRODUCTS, CATEGORIES };
}
