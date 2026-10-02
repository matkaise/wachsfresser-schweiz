/* shop-app.jsx — Shop page */
const { useState: useStateShop, useEffect: useEffectShop } = React;

function ShopApp() {
  const cart = useCart();
  const [cartOpen, setCartOpen] = useStateShop(false);
  const [checkoutOpen, setCheckoutOpen] = useStateShop(false);

  useEffectShop(() => {
    document.body.dataset.theme = 'warm';
    document.body.dataset.type = 'editorial';
  }, []);

  const onAdd = useAddToCart(cart, () => setCartOpen(true));

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
      <ShopGrid onAdd={onAdd} />
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

ReactDOM.createRoot(document.getElementById('root')).render(<ShopApp />);
