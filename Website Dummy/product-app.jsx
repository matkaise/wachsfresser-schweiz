/* product-app.jsx — dedicated product detail page mount */
const { useState: useStatePA, useEffect: useEffectPA } = React;

function ProductPageApp() {
  const cart = useCart();
  const [cartOpen, setCartOpen] = useStatePA(false);
  const [checkoutOpen, setCheckoutOpen] = useStatePA(false);

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const product = PRODUCTS.find(p => p.id === id);

  useEffectPA(() => {
    document.body.dataset.theme = 'warm';
    document.body.dataset.type = 'editorial';
    if (product) document.title = `${product.name} | Wachsfresser Schweiz`;
  }, [product?.id]);

  const onAdd = (p) => {
    cart.add(p);
    setCartOpen(true);
  };

  const goCheckout = () => {
    setCartOpen(false);
    setTimeout(() => setCheckoutOpen(true), 200);
  };

  const navLinks = [
    { href: 'Wachsfresser.html', label: 'Start' },
    { href: 'shop.html', label: 'Shop' },
    { href: 'Wachsfresser.html#wachsfresser', label: 'Wachsfresser' },
    { href: 'Wachsfresser.html#about', label: 'Manufaktur' },
  ];

  return (
    <>
      <Nav
        cartCount={cart.count}
        onCartOpen={() => setCartOpen(true)}
        links={navLinks}
        brandHref="Wachsfresser.html"
      />
      <ProductPage product={product} onAdd={onAdd} />
      <Footer />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart.items}
        onQty={cart.setQty}
        onCheckout={goCheckout}
      />
      <Checkout
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart.items}
        onComplete={() => cart.clear()}
      />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ProductPageApp />);
