import Stripe from 'stripe';
import { PRODUCT_BY_ID, toCents } from './product-catalog.mjs';
import {
  buildAdminOrderEmail,
  buildOrderConfirmationEmail,
  buildShippingEmail,
} from './emails.mjs';

const STRIPE_API_VERSION = '2026-05-27.dahlia';
const CURRENCY = 'chf';

const SHIPPING = {
  ch: {
    id: 'ch',
    name: 'Versand Schweiz',
    allowedCountries: ['CH'],
    amountEnv: 'SHIPPING_CH_CENTS',
    estimate: { minimum: { unit: 'business_day', value: 2 }, maximum: { unit: 'business_day', value: 5 } },
  },
  eu: {
    id: 'eu',
    name: 'Versand Europa',
    allowedCountries: ['DE', 'AT', 'FR', 'IT'],
    amountEnv: 'SHIPPING_EU_CENTS',
    estimate: { minimum: { unit: 'business_day', value: 4 }, maximum: { unit: 'business_day', value: 10 } },
  },
};

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },

  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      try {
        await handleEmailJob(message.body, env, ctx);
        message.ack();
      } catch (error) {
        console.error('email_job_failed', { error: error.message, job: message.body });
        message.retry();
      }
    }
  },
};

async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    if (url.pathname === '/') {
      return Response.redirect(new URL('/Wachsfresser.html', url), 302);
    }

    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      return await serveAsset(request, env, '/admin.html');
    }

    if (url.pathname.startsWith('/api/')) {
      return await routeApi(request, env, ctx, url);
    }

    return await env.ASSETS.fetch(request);
  } catch (error) {
    console.error('worker_error', { error: error.message, path: url.pathname });
    return json(
      { error: error.status ? error.message : 'Ein unerwarteter Fehler ist aufgetreten.' },
      error.status || 500,
    );
  }
}

async function routeApi(request, env, ctx, url) {
  if (url.pathname === '/api/health' && request.method === 'GET') {
    return json({
      ok: true,
      runtime: 'cloudflare-worker',
      stripeConfigured: Boolean(env.STRIPE_SECRET_KEY),
      stripeApiVersion: STRIPE_API_VERSION,
      dbConfigured: Boolean(env.DB),
      queueConfigured: Boolean(env.EMAIL_QUEUE),
      emailConfigured: Boolean(env.EMAIL || env.RESEND_API_KEY),
      shipping: Object.values(SHIPPING).map(option => ({
        id: option.id,
        name: option.name,
        amount: shippingAmount(env, option),
        allowedCountries: option.allowedCountries,
      })),
    });
  }

  if (url.pathname === '/api/create-checkout-session' && request.method === 'POST') {
    return createCheckoutSession(request, env);
  }

  if (url.pathname === '/api/stripe/webhook' && request.method === 'POST') {
    return handleStripeWebhook(request, env, ctx);
  }

  const sessionMatch = url.pathname.match(/^\/api\/checkout-session\/([^/]+)$/);
  if (sessionMatch && request.method === 'GET') {
    return getCheckoutSession(sessionMatch[1], env);
  }

  if (url.pathname === '/api/admin/orders' && request.method === 'GET') {
    const auth = await requireAdmin(request, env);
    if (!auth.ok) return auth.response;
    return listOrders(url, env);
  }

  const adminOrderMatch = url.pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
  if (adminOrderMatch && request.method === 'GET') {
    const auth = await requireAdmin(request, env);
    if (!auth.ok) return auth.response;
    return getAdminOrder(adminOrderMatch[1], env);
  }

  const shippedMatch = url.pathname.match(/^\/api\/admin\/orders\/([^/]+)\/mark-shipped$/);
  if (shippedMatch && request.method === 'POST') {
    const auth = await requireAdmin(request, env);
    if (!auth.ok) return auth.response;
    return markOrderShipped(request, shippedMatch[1], env, ctx);
  }

  return json({ error: 'Nicht gefunden.' }, 404);
}

async function createCheckoutSession(request, env) {
  requireStripe(env);
  requireDatabase(env);

  const body = await readJson(request);
  const customer = sanitizeCustomer(body.customer || {});
  const cart = normalizeCart(body.items);
  const shipping = SHIPPING[body.shipping] || SHIPPING.ch;
  const paymentMethod = ['auto', 'card', 'twint'].includes(body.paymentMethod) ? body.paymentMethod : 'auto';

  if (!cart.length) return json({ error: 'Der Warenkorb ist leer.' }, 400);
  if (!customer.email) return json({ error: 'Bitte gib eine E-Mail-Adresse an.' }, 400);

  const origin = siteOrigin(request, env);
  const orderRef = createOrderReference();
  const subtotal = cart.reduce((sum, item) => sum + toCents(item.product.price) * item.quantity, 0);
  const shippingCents = shippingAmount(env, shipping);
  const total = subtotal + shippingCents;

  await savePendingOrder(env, {
    orderRef,
    customer,
    shipping,
    subtotal,
    shippingCents,
    total,
    paymentMethod,
  }, cart);

  const stripe = stripeClient(env);
  const sessionParams = {
    mode: 'payment',
    locale: 'de',
    customer_email: customer.email,
    client_reference_id: orderRef,
    line_items: cart.map(({ product, quantity }) => ({
      quantity,
      price_data: {
        currency: CURRENCY,
        unit_amount: toCents(product.price),
        product_data: {
          name: product.name,
          description: product.desc,
          images: [absoluteUrl(origin, product.img)],
          metadata: { product_id: product.id, category: product.category },
        },
      },
    })),
    shipping_address_collection: { allowed_countries: shipping.allowedCountries },
    shipping_options: [{
      shipping_rate_data: {
        type: 'fixed_amount',
        display_name: shipping.name,
        fixed_amount: { amount: shippingCents, currency: CURRENCY },
        delivery_estimate: shipping.estimate,
      },
    }],
    phone_number_collection: { enabled: true },
    success_url: `${origin}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout-cancel.html`,
    metadata: {
      order_ref: orderRef,
      shipping_region: shipping.id,
      payment_choice: paymentMethod,
    },
    payment_intent_data: {
      receipt_email: customer.email,
      metadata: {
        order_ref: orderRef,
        shipping_region: shipping.id,
      },
    },
    custom_text: {
      shipping_address: { message: 'Bitte gib die Lieferadresse für deinen Wachsfresser an.' },
      submit: { message: 'Nach erfolgreicher Zahlung erhältst du eine Bestätigung.' },
    },
  };

  if (paymentMethod === 'card') sessionParams.payment_method_types = ['card'];
  if (paymentMethod === 'twint') sessionParams.payment_method_types = ['twint'];

  const session = await stripe.checkout.sessions.create(sessionParams);

  await env.DB.prepare(`
    UPDATE orders
    SET stripe_checkout_session_id = ?, status = ?, updated_at = ?
    WHERE order_ref = ?
  `).bind(session.id, 'checkout_created', now(), orderRef).run();

  return json({ id: session.id, url: session.url, orderRef });
}

async function handleStripeWebhook(request, env, ctx) {
  requireStripe(env);
  requireDatabase(env);

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return json({ error: 'STRIPE_WEBHOOK_SECRET fehlt.' }, 503);
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return json({ error: 'Stripe-Signature Header fehlt.' }, 400);

  const payload = await request.text();
  const stripe = stripeClient(env);
  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (error) {
    return json({ error: `Webhook-Signatur ungültig: ${error.message}` }, 400);
  }

  const inserted = await recordStripeEvent(env, event);
  if (!inserted) return json({ received: true, duplicate: true });

  const session = event.data.object;

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    await markOrderPaid(session, env, ctx);
  } else if (event.type === 'checkout.session.async_payment_failed') {
    await updateOrderStatusBySession(env, session, 'payment_failed');
  } else if (event.type === 'checkout.session.expired') {
    await updateOrderStatusBySession(env, session, 'expired');
  }

  return json({ received: true });
}

async function getCheckoutSession(sessionId, env) {
  requireDatabase(env);

  const order = await env.DB.prepare(`
    SELECT order_ref, status, payment_status, amount_total, currency, customer_email
    FROM orders
    WHERE stripe_checkout_session_id = ?
  `).bind(sessionId).first();

  if (!order) return json({ error: 'Checkout Session wurde nicht gefunden.' }, 404);

  return json({
    id: sessionId,
    status: order.status,
    paymentStatus: order.payment_status,
    amountTotal: order.amount_total,
    currency: order.currency,
    customerEmail: order.customer_email,
    orderRef: order.order_ref,
  });
}

async function listOrders(url, env) {
  requireDatabase(env);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 100);
  const status = url.searchParams.get('status');
  const query = status
    ? env.DB.prepare(`
        SELECT order_ref, status, payment_status, customer_email, customer_name, amount_total, currency, shipping_region, carrier, tracking_number, tracking_url, created_at, paid_at, shipped_at
        FROM orders
        WHERE status = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(status, limit)
    : env.DB.prepare(`
        SELECT order_ref, status, payment_status, customer_email, customer_name, amount_total, currency, shipping_region, carrier, tracking_number, tracking_url, created_at, paid_at, shipped_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(limit);

  const result = await query.all();
  return json({ orders: result.results || [] });
}

async function getAdminOrder(orderRef, env) {
  requireDatabase(env);
  const bundle = await getOrderBundle(env, orderRef);
  if (!bundle.order) return json({ error: 'Bestellung wurde nicht gefunden.' }, 404);
  return json(bundle);
}

async function markOrderShipped(request, orderRef, env, ctx) {
  requireDatabase(env);
  const body = await readJson(request);
  const carrier = sanitizeText(body.carrier, 80);
  const trackingNumber = sanitizeText(body.trackingNumber, 120);
  const trackingUrl = sanitizeUrl(body.trackingUrl);
  const timestamp = now();

  const current = await getOrderByRef(env, orderRef);
  if (!current) return json({ error: 'Bestellung wurde nicht gefunden.' }, 404);
  if (!current.customer_email) return json({ error: 'Bestellung hat keine Kunden-E-Mail.' }, 400);

  await env.DB.prepare(`
    UPDATE orders
    SET status = ?, carrier = ?, tracking_number = ?, tracking_url = ?, shipped_at = ?, updated_at = ?
    WHERE order_ref = ?
  `).bind('shipped', carrier, trackingNumber, trackingUrl, timestamp, timestamp, orderRef).run();

  await env.DB.prepare(`
    INSERT INTO order_events (event_id, order_ref, type, payload_json, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(crypto.randomUUID(), orderRef, 'order.shipped', JSON.stringify({ carrier, trackingNumber, trackingUrl }), timestamp).run();

  await enqueueEmail(env, ctx, { kind: 'shipping', orderRef, recipient: current.customer_email });

  return json({ ok: true, orderRef });
}

async function savePendingOrder(env, order, cart) {
  const timestamp = now();
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO orders (
        order_ref, status, customer_email, customer_name, amount_subtotal, amount_shipping,
        amount_total, currency, shipping_region, payment_choice, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      order.orderRef,
      'pending_checkout',
      order.customer.email,
      [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' '),
      order.subtotal,
      order.shippingCents,
      order.total,
      CURRENCY,
      order.shipping.id,
      order.paymentMethod,
      timestamp,
      timestamp,
    ),
    ...cart.map(({ product, quantity }) => env.DB.prepare(`
      INSERT INTO order_items (
        order_ref, product_id, product_name, quantity, unit_amount, amount_total, meta_json, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      order.orderRef,
      product.id,
      product.name,
      quantity,
      toCents(product.price),
      toCents(product.price) * quantity,
      JSON.stringify(product.meta || []),
      timestamp,
    )),
  ]);
}

async function recordStripeEvent(env, event) {
  const session = event.data.object || {};
  const orderRef = session.metadata?.order_ref || session.client_reference_id || '';
  const result = await env.DB.prepare(`
    INSERT OR IGNORE INTO order_events (event_id, order_ref, type, payload_json, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(event.id, orderRef, event.type, JSON.stringify(session), now()).run();

  return (result.meta?.changes || 0) > 0;
}

async function markOrderPaid(session, env, ctx) {
  const orderRef = session.metadata?.order_ref || session.client_reference_id;
  if (!orderRef) return;

  const timestamp = now();
  const customerName = session.customer_details?.name || null;
  const customerEmail = session.customer_details?.email || session.customer_email || null;
  const shippingDetails = session.shipping_details ? JSON.stringify(session.shipping_details) : null;
  const status = session.payment_status === 'paid' ? 'paid' : 'payment_pending';

  await env.DB.prepare(`
    UPDATE orders
    SET status = ?, payment_status = ?, stripe_payment_intent_id = ?, customer_email = COALESCE(?, customer_email),
        customer_name = COALESCE(?, customer_name), amount_subtotal = COALESCE(?, amount_subtotal),
        amount_shipping = COALESCE(?, amount_shipping), amount_total = COALESCE(?, amount_total),
        shipping_name = COALESCE(?, shipping_name), shipping_address_json = COALESCE(?, shipping_address_json),
        paid_at = COALESCE(paid_at, ?), updated_at = ?
    WHERE order_ref = ?
  `).bind(
    status,
    session.payment_status || null,
    typeof session.payment_intent === 'string' ? session.payment_intent : null,
    customerEmail,
    customerName,
    session.amount_subtotal || null,
    session.total_details?.amount_shipping || null,
    session.amount_total || null,
    session.shipping_details?.name || null,
    shippingDetails,
    timestamp,
    timestamp,
    orderRef,
  ).run();

  const order = await getOrderByRef(env, orderRef);
  if (order?.payment_status === 'paid' || status === 'paid') {
    await enqueueEmail(env, ctx, { kind: 'order_confirmation', orderRef, recipient: order.customer_email });
    if (env.ADMIN_EMAIL) {
      await enqueueEmail(env, ctx, { kind: 'admin_new_order', orderRef, recipient: env.ADMIN_EMAIL });
    }
  }
}

async function updateOrderStatusBySession(env, session, status) {
  const orderRef = session.metadata?.order_ref || session.client_reference_id;
  const query = orderRef
    ? env.DB.prepare(`UPDATE orders SET status = ?, payment_status = ?, updated_at = ? WHERE order_ref = ?`).bind(status, session.payment_status || null, now(), orderRef)
    : env.DB.prepare(`UPDATE orders SET status = ?, payment_status = ?, updated_at = ? WHERE stripe_checkout_session_id = ?`).bind(status, session.payment_status || null, now(), session.id);
  await query.run();
}

async function enqueueEmail(env, ctx, job) {
  const result = await env.DB.prepare(`
    INSERT OR IGNORE INTO email_log (order_ref, kind, recipient, status, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(job.orderRef, job.kind, job.recipient || '', 'queued', now()).run();

  if ((result.meta?.changes || 0) === 0) return;

  if (env.EMAIL_QUEUE) {
    await env.EMAIL_QUEUE.send(job);
    return;
  }

  ctx.waitUntil(handleEmailJob(job, env, ctx));
}

async function handleEmailJob(job, env) {
  requireDatabase(env);
  const bundle = await getOrderBundle(env, job.orderRef);
  if (!bundle.order) throw new Error(`Order ${job.orderRef} not found`);

  let message;
  if (job.kind === 'order_confirmation') {
    message = buildOrderConfirmationEmail(bundle.order, bundle.items, env);
  } else if (job.kind === 'admin_new_order') {
    if (!env.ADMIN_EMAIL) return;
    message = buildAdminOrderEmail(bundle.order, bundle.items, env);
  } else if (job.kind === 'shipping') {
    message = buildShippingEmail(bundle.order, bundle.items, env);
  } else {
    throw new Error(`Unknown email kind: ${job.kind}`);
  }

  const sent = await sendEmail(env, message);
  await env.DB.prepare(`
    UPDATE email_log
    SET status = ?, provider = ?, provider_message_id = ?, error = ?, sent_at = ?
    WHERE order_ref = ? AND kind = ?
  `).bind(
    sent.status,
    sent.provider,
    sent.messageId || null,
    sent.error || null,
    sent.status === 'sent' ? now() : null,
    job.orderRef,
    job.kind,
  ).run();
}

async function sendEmail(env, message) {
  if (!message.to) {
    return { status: 'skipped', provider: 'none', error: 'missing_recipient' };
  }

  if (env.EMAIL?.send) {
    const result = await env.EMAIL.send(message);
    return { status: 'sent', provider: 'cloudflare-email', messageId: result.messageId };
  }

  if (env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        reply_to: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Resend error ${response.status}`);
    }

    return { status: 'sent', provider: 'resend', messageId: data.id };
  }

  console.warn('email_skipped_no_provider', { to: message.to, subject: message.subject });
  return { status: 'skipped', provider: 'none', error: 'no_email_provider_configured' };
}

async function getOrderBundle(env, orderRef) {
  const order = await getOrderByRef(env, orderRef);
  if (!order) return { order: null, items: [], events: [] };

  const items = await env.DB.prepare(`
    SELECT product_id, product_name, quantity, unit_amount, amount_total, meta_json
    FROM order_items
    WHERE order_ref = ?
    ORDER BY id ASC
  `).bind(orderRef).all();

  const events = await env.DB.prepare(`
    SELECT event_id, type, payload_json, created_at
    FROM order_events
    WHERE order_ref = ?
    ORDER BY created_at ASC
  `).bind(orderRef).all();

  return {
    order,
    items: items.results || [],
    events: events.results || [],
  };
}

async function getOrderByRef(env, orderRef) {
  return env.DB.prepare(`
    SELECT *
    FROM orders
    WHERE order_ref = ?
  `).bind(orderRef).first();
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
    firstName: sanitizeText(customer.firstName, 80),
    lastName: sanitizeText(customer.lastName, 80),
  };
}

function sanitizeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function sanitizeUrl(value) {
  const text = sanitizeText(value, 500);
  if (!text) return '';
  try {
    const url = new URL(text);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function shippingAmount(env, option) {
  const value = Number.parseInt(env[option.amountEnv] || '', 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function stripeClient(env) {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

function requireStripe(env) {
  if (!env.STRIPE_SECRET_KEY) {
    throw Object.assign(new Error('Stripe ist noch nicht konfiguriert.'), { status: 503 });
  }
}

function requireDatabase(env) {
  if (!env.DB) {
    throw Object.assign(new Error('D1-Datenbank ist noch nicht gebunden.'), { status: 503 });
  }
}

async function requireAdmin(request, env) {
  const accessEmail = request.headers.get('Cf-Access-Authenticated-User-Email');
  const allowed = (env.ADMIN_EMAILS || env.ADMIN_EMAIL || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

  if (accessEmail && (!allowed.length || allowed.includes(accessEmail.toLowerCase()))) {
    return { ok: true, identity: accessEmail };
  }

  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : request.headers.get('x-admin-token') || '';
  if (env.ADMIN_TOKEN && await tokenMatches(token, env.ADMIN_TOKEN)) {
    return { ok: true, identity: 'admin-token' };
  }

  return { ok: false, response: json({ error: 'Nicht autorisiert.' }, 401) };
}

async function tokenMatches(received, expected) {
  if (!received || !expected) return false;
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(received)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

function createOrderReference() {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `WF-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${suffix}`;
}

function siteOrigin(request, env) {
  if (env.SITE_URL) return env.SITE_URL.replace(/\/$/, '');
  return new URL(request.url).origin;
}

function absoluteUrl(origin, assetPath) {
  return new URL(assetPath.replace(/^\//, ''), `${origin}/`).toString();
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw Object.assign(new Error('Ungültiger JSON-Body.'), { status: 400 });
  }
}

function serveAsset(request, env, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = '';
  return env.ASSETS.fetch(new Request(url, request));
}

function now() {
  return new Date().toISOString();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: data?.error && status === 200 ? 500 : status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Admin-Token,Stripe-Signature',
  };
}
