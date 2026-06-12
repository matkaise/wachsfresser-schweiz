/* checkout.jsx — Stripe Checkout handoff */
const { useState: useStateC, useEffect: useEffectC } = React;

const SHIPPING = [
  {
    id: 'ch',
    name: 'Versand Schweiz',
    desc: 'Lieferadresse in der Schweiz · Preis wird serverseitig gesetzt',
    price: 0,
    priceLabel: 'Im Checkout',
  },
  {
    id: 'eu',
    name: 'Versand Europa',
    desc: 'Deutschland, Österreich, Frankreich oder Italien · Preis wird serverseitig gesetzt',
    price: 0,
    priceLabel: 'Im Checkout',
  },
];

const PAYMENT_METHODS = [
  {
    id: 'auto',
    label: 'Stripe Auswahl',
    desc: 'Stripe zeigt passende Zahlungsarten wie Karte, Wallets oder TWINT, sofern im Dashboard aktiviert.',
  },
  {
    id: 'card',
    label: 'Karte',
    desc: 'Kredit- oder Debitkarte sicher auf der Stripe-Seite bezahlen.',
  },
  {
    id: 'twint',
    label: 'TWINT',
    desc: 'TWINT ist für Schweizer CHF-Zahlungen vorgesehen und muss im Stripe-Dashboard aktiv sein.',
  },
];

function money(value) {
  return `CHF ${Number(value).toFixed(2)}`;
}

function Checkout({ open, onClose, items }) {
  const [step, setStep] = useStateC(0);
  const [form, setForm] = useStateC({ email: '', firstName: '', lastName: '' });
  const [shipping, setShipping] = useStateC('ch');
  const [pay, setPay] = useStateC('auto');
  const [loading, setLoading] = useStateC(false);
  const [error, setError] = useStateC('');

  useEffectC(() => {
    if (open) {
      setStep(0);
      setError('');
      setLoading(false);
    }
  }, [open]);

  useEffectC(() => {
    const onEsc = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    if (open) window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose, loading]);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const ship = SHIPPING.find(s => s.id === shipping);
  const total = subtotal + (ship?.price || 0);

  const canNext = () => {
    if (loading) return false;
    if (step === 0) return form.email && form.firstName && form.lastName;
    if (step === 1) return !!shipping;
    if (step === 2) return items.length > 0 && !!pay;
    return true;
  };

  const next = () => {
    setError('');
    if (step === 2) {
      startStripeCheckout();
      return;
    }
    setStep(step + 1);
  };

  const back = () => step > 0 && setStep(step - 1);
  const set = (k, v) => setForm({ ...form, [k]: v });

  async function startStripeCheckout() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({ id: item.id, qty: item.qty })),
          customer: form,
          shipping,
          paymentMethod: pay,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Stripe Checkout konnte nicht gestartet werden.');
      }
      if (!data.url) {
        throw new Error('Stripe hat keine Checkout-URL zurückgegeben.');
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(err.message || 'Stripe Checkout konnte nicht gestartet werden.');
      setLoading(false);
    }
  }

  const steps = [
    { label: 'Kontakt' },
    { label: 'Versand' },
    { label: 'Zahlung' },
  ];

  return (
    <>
      <div className={`checkout-overlay ${open ? 'open' : ''}`} onClick={loading ? undefined : onClose}></div>
      <div className={`checkout ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="checkout-nav">
          <a className="brand" href="Wachsfresser.html">
            <span className="brand-mark"></span>
            <span>Wachsfresser</span>
          </a>
          <div className="checkout-stepper">
            {steps.map((s, i) => (
              <span key={s.label} className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <span className="num">{i < step ? '✓' : i + 1}</span>
                {s.label}
              </span>
            ))}
          </div>
          <button className="close" onClick={onClose} disabled={loading}>
            Abbrechen ×
          </button>
        </div>

        <div className="checkout-body">
          <div className="checkout-form">
            {step === 0 && (
              <>
                <h2>Kontakt für deine Bestellung.</h2>
                <p className="lead">
                  Deine Zahlungs- und Lieferdaten werden anschliessend sicher im Stripe Checkout erfasst.
                </p>
                <div className="field-grid">
                  <div className="field full">
                    <label>E-Mail</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="dein@mail.ch"
                    />
                  </div>
                  <div className="field">
                    <label>Vorname</label>
                    <input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Eva"/>
                  </div>
                  <div className="field">
                    <label>Nachname</label>
                    <input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Muster"/>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2>Wohin reist dein Wachsfresser?</h2>
                <p className="lead">
                  Stripe sammelt die konkrete Lieferadresse. Hier wählst du nur die Versandregion.
                </p>
                <div className="shipping-options">
                  {SHIPPING.map(s => (
                    <label key={s.id} className={`ship-opt ${shipping === s.id ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="ship"
                        checked={shipping === s.id}
                        onChange={() => setShipping(s.id)}
                        style={{ display: 'none' }}
                      />
                      <span className="radio"></span>
                      <div>
                        <h4>{s.name}</h4>
                        <p>{s.desc}</p>
                      </div>
                      <span className="price">{s.priceLabel || money(s.price)}</span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2>Sicher bezahlen.</h2>
                <p className="lead">
                  Du wirst zu Stripe weitergeleitet. Kartendaten oder TWINT-Freigaben werden nicht auf dieser Website gespeichert.
                </p>
                <div className="payment-options">
                  {PAYMENT_METHODS.map(p => (
                    <button
                      key={p.id}
                      className={`payment-option ${pay === p.id ? 'selected' : ''}`}
                      onClick={() => setPay(p.id)}
                      type="button"
                    >
                      <span className="radio"></span>
                      <span>
                        <strong>{p.label}</strong>
                        <small>{p.desc}</small>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="stripe-note">
                  Die definitive Summe wird auf der Stripe-Seite mit Versand angezeigt.
                </div>
              </>
            )}

            {error && <div className="checkout-error">{error}</div>}

            <div className="checkout-foot">
              <button className="btn-back" onClick={back} disabled={step === 0 || loading} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
                ← Zurück
              </button>
              <button className="btn-primary" onClick={next} disabled={!canNext()} style={{ opacity: canNext() ? 1 : 0.4 }}>
                {step === 2 ? (loading ? 'Stripe wird geöffnet ...' : `Zu Stripe · ab ${money(total)}`) : 'Weiter →'}
              </button>
            </div>
          </div>

          <aside className="order-summary">
            <h3>Deine Bestellung</h3>
            {items.map(it => (
              <div className="order-line" key={it.id}>
                <img
                  src={it.img}
                  alt={it.name}
                  style={{
                    objectPosition: it.crop === 'left' ? '0% 50%' : it.crop === 'right' ? '100% 50%' : '50% 50%',
                    transform: it.crop === 'center' ? 'scale(1.02)' : 'scale(1.4)',
                  }}
                />
                <div>
                  <h4>{it.name}</h4>
                  <div className="qty">× {it.qty}</div>
                </div>
                <span className="price">{money(it.price * it.qty)}</span>
              </div>
            ))}
            <div className="totals">
              <div className="row">
                <span>Zwischensumme</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="row">
                <span>Versand</span>
                <span>{ship?.priceLabel || money(ship?.price || 0)}</span>
              </div>
              <div className="row total">
                <span>Total vor Versand</span>
                <span>{money(subtotal)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

window.Checkout = Checkout;
