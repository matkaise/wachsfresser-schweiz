/* app.jsx — Wachsfresser Homepage */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "warm",
  "type": "editorial",
  "hero": "flame"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selection, setSelection] = useState({ model: 'saentis', color: 'creme' });

  useEffect(() => {
    document.body.dataset.theme = tweaks.theme;
    document.body.dataset.type = tweaks.type;
  }, [tweaks.theme, tweaks.type]);

  const onAdd = useAddToCart(cart, () => setCartOpen(true));

  const goCheckout = () => {
    setCartOpen(false);
    setTimeout(() => setCheckoutOpen(true), 200);
  };

  const onComplete = () => cart.clear();

  return (
    <>
      <Nav cartCount={cart.count} onCartOpen={() => setCartOpen(true)} />
      {tweaks.hero === 'flame'
        ? <Hero3D selection={selection} onSelect={setSelection} onAdd={onAdd} />
        : <Hero variant={tweaks.hero} />}
      <Strip />
      <Featured onAdd={onAdd} />
      <About />
      <CtaBand />
      <Footer />

      {tweaks.hero === 'flame' && (
        <StickyBuyBar selection={selection} onAdd={onAdd} hidden={cartOpen || checkoutOpen} />
      )}

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
        onComplete={onComplete}
      />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Farbwelt">
          <TweakRadio
            value={tweaks.theme}
            onChange={v => setTweak('theme', v)}
            options={[
              { value: 'warm', label: 'Warm' },
              { value: 'cool', label: 'Kühl' },
              { value: 'dark', label: 'Dunkel' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Typografie">
          <TweakRadio
            value={tweaks.type}
            onChange={v => setTweak('type', v)}
            options={[
              { value: 'editorial', label: 'Editorial' },
              { value: 'minimal', label: 'Minimal' },
              { value: 'grotesk', label: 'Grotesk' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Hero-Variante">
          <TweakRadio
            value={tweaks.hero}
            onChange={v => setTweak('hero', v)}
            options={[
              { value: 'flame', label: '3D' },
              { value: 'editorial', label: 'Editorial' },
              { value: 'lifestyle', label: 'Lifestyle' },
              { value: 'split', label: 'Split' },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
