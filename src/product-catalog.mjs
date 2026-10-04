export const PRODUCTS = [
  {
    id: 'saentis-klein-creme',
    name: 'Säntis · Creme',
    category: 'Säntis',
    desc: 'Kleiner Wachsfresser aus hellem Beton, mit Glasfaserdocht und einer Füllung aus Sojawachs.',
    price: 14.99,
    img: 'assets/product/saentis-creme.jpg',
    meta: ['Glasfaserdocht', 'Sojawachs-Startfüllung', 'Wiederbefüllbar'],
  },
  {
    id: 'saentis-klein-anthrazit',
    name: 'Säntis · Anthrazit',
    category: 'Säntis',
    desc: 'Kleiner Wachsfresser aus dunklem Beton, mit Glasfaserdocht und einer Füllung aus Sojawachs.',
    price: 14.99,
    img: 'assets/product/saentis-anthrazit.jpg',
    meta: ['Glasfaserdocht', 'Sojawachs-Startfüllung', 'Wiederbefüllbar'],
  },
  {
    id: 'eiger-gross-creme',
    name: 'Eiger · Creme',
    category: 'Eiger',
    desc: 'Grosser Wachsfresser aus hellem Beton für draussen, mit Holzfaserdocht und Holzdeckel.',
    price: 59.99,
    img: 'assets/product/eiger-creme.jpg',
    meta: ['Holzfaserdocht', 'Nur Aussenbereich', 'Wiederbefüllbar'],
  },
  {
    id: 'eiger-gross-anthrazit',
    name: 'Eiger · Anthrazit',
    category: 'Eiger',
    desc: 'Grosser Wachsfresser aus dunklem Beton für draussen, mit Holzfaserdocht und Holzdeckel.',
    price: 59.99,
    img: 'assets/product/eiger-anthrazit.jpg',
    meta: ['Holzfaserdocht', 'Nur Aussenbereich', 'Wiederbefüllbar'],
  },
];

export const PRODUCT_BY_ID = new Map(PRODUCTS.map(product => [product.id, product]));

export function toCents(value) {
  return Math.round(Number(value) * 100);
}
