const fs = require('fs/promises');
const path = require('path');

require('dotenv').config();
require.extensions['.jsx'] = require.extensions['.js'];

const express = require('express');
const Stripe = require('stripe');

const { PRODUCTS } = require('./Website Dummy/products.jsx');

const app = express();
const siteDir = path.join(__dirname, 'Website Dummy');
const ordersDir = path.join(__dirname, 'orders');
const port = Number(process.env.PORT || 8080);
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripeApiVersion = '2026-05-27.dahlia';
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: stripeApiVersion })
  : null;

const PRODUCT_BY_ID = new Map(PRODUCTS.map(product => [product.id, product]));

const SHIPPING = {
  ch: {
    id: 'ch',
    name: 'Versand Schweiz',
    allowedCountries: ['CH'],
    amount: centsFromEnv('SHIPPING_CH_CENTS', 0),
    estimate: { minimum: { unit: 'business_day', value: 2 }, maximum: { unit: 'business_day', value: 5 } },
  },
  eu: {
    id: 'eu',
    name: 'Versand Europa',
    allowedCountries: ['DE', 'AT', 'FR', 'IT'],
    amount: centsFromEnv('SHIPPING_EU_CENTS', 0),
    estimate: { minimum: { unit: 'business_day', value: 4 }, maximum: { unit: 'business_day', value: 10 } },
  },
};

app.set('trust proxy', true);

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe ist noch nicht konfiguriert.' });
  }

  let event;
  try {
    event = stripeWebhookSecret
      ? stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), stripeWebhookSecret)
      : JSON.parse(req.body.toString('utf8'));
  } catch (error) {
    return res.status(400).json({ error: `Webhook konnte nicht verifiziert werden: ${error.message}` });
  }

  try {
    await recordStripeEvent(event);
    return res.json({ received: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Webhook konnte nicht gespeichert werden.' });
  }
});

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    stripeConfigured: Boolean(stripe),
    stripeApiVersion,
    shipping: publicShippingConfig(),
  });
});

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      error: 'Stripe ist noch nicht konfiguriert. Bitte STRIPE_SECRET_KEY in .env setzen und den Server neu starten.',
    });
  }

  try {
    const customer = sanitizeCustomer(req.body.customer || {});
    const cart = normalizeCart(req.body.items);
    const shipping = SHIPPING[req.body.shipping] || SHIPPING.ch;
    const paymentMethod = ['auto', 'card', 'twint'].includes(req.body.paymentMethod)
      ? req.body.paymentMethod
      : 'auto';

    if (!cart.length) {
      return res.status(400).json({ error: 'Der Warenkorb ist leer.' });
    }
    if (!customer.email) {
      return res.status(400).json({ error: 'Bitte gib eine E-Mail-Adresse an.' });
    }

    const origin = siteOrigin(req);
    const orderRef = createOrderReference();
    const sessionParams = {
      mode: 'payment',
      locale: 'de',
      customer_email: customer.email,
      client_reference_id: orderRef,
      line_items: cart.map(({ product, quantity }) => ({
        quantity,
        price_data: {
          currency: 'chf',
          unit_amount: toCents(product.price),
          product_data: {
            name: product.name,
            description: product.desc,
            images: [absoluteUrl(origin, product.img)],
            metadata: {
              product_id: product.id,
              category: product.category,
            },
          },
        },
      })),
      shipping_address_collection: {
        allowed_countries: shipping.allowedCountries,
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            display_name: shipping.name,
            fixed_amount: { amount: shipping.amount, currency: 'chf' },
            delivery_estimate: shipping.estimate,
          },
        },
      ],
      phone_number_collection: { enabled: true },
      success_url: `${origin}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout-cancel.html`,
      metadata: {
        order_ref: orderRef,
        customer_name: [customer.firstName, customer.lastName].filter(Boolean).join(' '),
        shipping_region: shipping.id,
        payment_choice: paymentMethod,
      },
      payment_intent_data: {
        metadata: {
          order_ref: orderRef,
          shipping_region: shipping.id,
        },
      },
      custom_text: {
        shipping_address: {
          message: 'Bitte gib die Lieferadresse für deinen Wachsfresser an.',
        },
        submit: {
          message: 'Nach erfolgreicher Zahlung erhältst du eine Bestätigung von Stripe.',
        },
      },
    };

    if (paymentMethod === 'card') {
      sessionParams.payment_method_types = ['card'];
    }
    if (paymentMethod === 'twint') {
      sessionParams.payment_method_types = ['twint'];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.json({
      id: session.id,
      url: session.url,
      orderRef,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Stripe Checkout konnte nicht gestartet werden.' });
  }
});

app.get('/api/checkout-session/:sessionId', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe ist noch nicht konfiguriert.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json({
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || session.customer_email || '',
      orderRef: session.metadata?.order_ref || session.client_reference_id || '',
    });
  } catch (error) {
    res.status(404).json({ error: 'Checkout Session wurde nicht gefunden.' });
  }
});

app.get('/', (req, res) => {
  res.redirect('/Wachsfresser.html');
});

app.use(express.static(siteDir));

app.listen(port, '127.0.0.1', () => {
  console.log(`Wachsfresser server läuft auf http://127.0.0.1:${port}`);
  if (!stripe) {
    console.log('Stripe ist noch nicht aktiv: STRIPE_SECRET_KEY in .env setzen.');
  }
});

function centsFromEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function toCents(value) {
  return Math.round(Number(value) * 100);
}

function createOrderReference() {
  return `WF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function normalizeCart(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map(item => {
      const product = PRODUCT_BY_ID.get(item.id);
      const quantity = Number.parseInt(item.qty, 10);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return null;
      return { product, quantity };
    })
    .filter(Boolean);
}

function sanitizeCustomer(customer) {
  return {
    email: String(customer.email || '').trim().slice(0, 320),
    firstName: String(customer.firstName || '').trim().slice(0, 80),
    lastName: String(customer.lastName || '').trim().slice(0, 80),
  };
}

function siteOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function absoluteUrl(origin, assetPath) {
  return new URL(assetPath.replace(/^\//, ''), `${origin}/`).toString();
}

function publicShippingConfig() {
  return Object.values(SHIPPING).map(({ id, name, amount, allowedCountries }) => ({
    id,
    name,
    amount,
    allowedCountries,
  }));
}

async function recordStripeEvent(event) {
  const interestingTypes = new Set([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'checkout.session.expired',
  ]);

  if (!interestingTypes.has(event.type)) return;

  const session = event.data.object;
  await fs.mkdir(ordersDir, { recursive: true });
  await fs.appendFile(
    path.join(ordersDir, 'stripe-events.ndjson'),
    `${JSON.stringify({
      receivedAt: new Date().toISOString(),
      type: event.type,
      sessionId: session.id,
      orderRef: session.metadata?.order_ref || session.client_reference_id || '',
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || session.customer_email || '',
      shipping: session.shipping_details || null,
    })}\n`,
    'utf8',
  );
}
