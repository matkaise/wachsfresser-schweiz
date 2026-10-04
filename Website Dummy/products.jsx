/* products.jsx — gemeinsame Produktdaten */

const PRODUCTS = [
  {
    id: 'saentis-klein-creme',
    name: 'Säntis · Creme',
    category: 'Säntis',
    desc: 'Kleiner Wachsfresser aus hellem Beton, mit Glasfaserdocht und einer Füllung aus Sojawachs.',
    long: 'Säntis ist unser kleiner Wachsfresser. Das Gefäss wird in Salmsach von Hand gegossen und kommt mit Glasfaserdocht und einer Füllung aus Sojawachs. Ist die Füllung heruntergebrannt, legst du geeignete Wachsreste nach.',
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
    desc: 'Kleiner Wachsfresser aus dunklem Beton, mit Glasfaserdocht und einer Füllung aus Sojawachs.',
    long: 'Säntis in Anthrazit: dasselbe Gefäss wie in Creme, aus dunklem Beton. Jedes Stück ist von Hand gegossen, deshalb weicht die Farbe leicht ab. Glasfaserdocht und Sojawachs-Füllung sind dabei.',
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
    desc: 'Grosser Wachsfresser aus hellem Beton für draussen, mit Holzfaserdocht und Holzdeckel.',
    long: 'Eiger ist unser grosser Wachsfresser für Terrasse, Balkon und Garten. Er kommt mit Holzfaserdocht, einer Füllung aus Sojawachs und einem Holzdeckel. Für Innenräume ist Eiger nicht gedacht.',
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
    desc: 'Grosser Wachsfresser aus dunklem Beton für draussen, mit Holzfaserdocht und Holzdeckel.',
    long: 'Eiger in Anthrazit, von Hand gegossen in Salmsach. Mit Holzfaserdocht, Sojawachs-Füllung und Holzdeckel. Nur für den Aussenbereich.',
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
