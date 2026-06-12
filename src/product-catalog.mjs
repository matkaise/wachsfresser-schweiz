export const PRODUCTS = [
  {
    id: 'saentis-klein-creme',
    name: 'Säntis · Creme',
    category: 'Säntis',
    desc: 'Kompakter Wachsfresser aus handgegossenem Beton, bereit mit Docht und Sojawachs-Startfüllung.',
    price: 14.99,
    img: 'assets/product/saentis-creme.jpg',
    meta: ['Glasfaserdocht', 'Sojawachs-Startfüllung', 'Wiederbefüllbar'],
  },
  {
    id: 'saentis-klein-anthrazit',
    name: 'Säntis · Anthrazit',
    category: 'Säntis',
    desc: 'Dunkler Beton, kompakte Form, wiederbefüllbar mit Wachsresten oder Nachfüllwachs.',
    price: 14.99,
    img: 'assets/product/saentis-anthrazit.jpg',
    meta: ['Glasfaserdocht', 'Sojawachs-Startfüllung', 'Wiederbefüllbar'],
  },
  {
    id: 'eiger-gross-creme',
    name: 'Eiger · Creme',
    category: 'Eiger',
    desc: 'Outdoor-Wachsfresser aus Beton mit Holzfaserdocht. Nur für den Aussenbereich gedacht.',
    price: 59.99,
    img: 'assets/product/eiger-creme.jpg',
    meta: ['Holzfaserdocht', 'Nur Aussenbereich', 'Wiederbefüllbar'],
  },
  {
    id: 'eiger-gross-anthrazit',
    name: 'Eiger · Anthrazit',
    category: 'Eiger',
    desc: 'Massiver Outdoor-Wachsfresser in Anthrazit, handgegossen und wiederbefüllbar.',
    price: 59.99,
    img: 'assets/product/eiger-anthrazit.jpg',
    meta: ['Holzfaserdocht', 'Nur Aussenbereich', 'Wiederbefüllbar'],
  },
];

export const PRODUCT_BY_ID = new Map(PRODUCTS.map(product => [product.id, product]));

export function toCents(value) {
  return Math.round(Number(value) * 100);
}
