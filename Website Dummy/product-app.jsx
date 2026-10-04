/* product-app.jsx — Produktseite, Produkt über ?id= in der Adresse */
function ProductApp() {
  const id = new URLSearchParams(window.location.search).get('id');
  const product = PRODUCTS.find(p => p.id === id);

  React.useEffect(() => {
    if (product) document.title = `${product.name} | Wachsfresser Schweiz`;
  }, [product && product.id]);

  return (
    <ShopFrame
      current="shop"
      render={({ onAdd, overlayOpen }) => <ProductView product={product} onAdd={onAdd} overlayOpen={overlayOpen}/>}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ProductApp/>);
