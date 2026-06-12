export function buildOrderConfirmationEmail(order, items, env) {
  const subject = `Bestellung ${order.order_ref} bestätigt`;
  const lines = items.map(item => `${item.quantity} x ${item.product_name} - CHF ${(item.amount_total / 100).toFixed(2)}`);
  const shipping = shippingLine(order);

  return {
    to: order.customer_email,
    from: sender(env),
    replyTo: env.REPLY_TO_EMAIL || env.ADMIN_EMAIL || undefined,
    subject,
    text: [
      `Danke für deine Bestellung bei Wachsfresser.`,
      ``,
      `Bestellnummer: ${order.order_ref}`,
      `Status: bezahlt`,
      ``,
      `Deine Stücke:`,
      ...lines,
      ``,
      shipping,
      ``,
      `Wir bereiten deine Bestellung in Salmsach vor und melden uns erneut, sobald sie verschickt wurde.`,
      ``,
      `Wachsfresser Schweiz`,
    ].join('\n'),
    html: layout(
      subject,
      `
        <p>Danke für deine Bestellung bei Wachsfresser.</p>
        <p><strong>Bestellnummer:</strong> ${escapeHtml(order.order_ref)}</p>
        <table>${items.map(item => `
          <tr>
            <td>${item.quantity} x ${escapeHtml(item.product_name)}</td>
            <td align="right">CHF ${(item.amount_total / 100).toFixed(2)}</td>
          </tr>
        `).join('')}</table>
        <p>${escapeHtml(shipping)}</p>
        <p>Wir bereiten deine Bestellung in Salmsach vor und melden uns erneut, sobald sie verschickt wurde.</p>
      `,
    ),
  };
}

export function buildAdminOrderEmail(order, items, env) {
  const subject = `Neue Wachsfresser-Bestellung ${order.order_ref}`;
  const lines = items.map(item => `${item.quantity} x ${item.product_name} - CHF ${(item.amount_total / 100).toFixed(2)}`);

  return {
    to: env.ADMIN_EMAIL,
    from: sender(env),
    subject,
    text: [
      `Neue Bestellung`,
      ``,
      `Bestellnummer: ${order.order_ref}`,
      `Kunde: ${order.customer_name || '-'}`,
      `E-Mail: ${order.customer_email || '-'}`,
      `Total: CHF ${(order.amount_total / 100).toFixed(2)}`,
      `Versandregion: ${order.shipping_region}`,
      ``,
      ...lines,
      ``,
      `Im Adminbereich als verschickt markieren, sobald das Paket raus ist.`,
    ].join('\n'),
    html: layout(
      subject,
      `
        <p>Neue Bestellung ist bezahlt und bereit zur Bearbeitung.</p>
        <p><strong>Bestellnummer:</strong> ${escapeHtml(order.order_ref)}</p>
        <p><strong>Kunde:</strong> ${escapeHtml(order.customer_name || '-')}<br/>
        <strong>E-Mail:</strong> ${escapeHtml(order.customer_email || '-')}<br/>
        <strong>Total:</strong> CHF ${(order.amount_total / 100).toFixed(2)}</p>
        <table>${items.map(item => `
          <tr>
            <td>${item.quantity} x ${escapeHtml(item.product_name)}</td>
            <td align="right">CHF ${(item.amount_total / 100).toFixed(2)}</td>
          </tr>
        `).join('')}</table>
      `,
    ),
  };
}

export function buildShippingEmail(order, items, env) {
  const subject = `Deine Bestellung ${order.order_ref} wurde verschickt`;
  const tracking = order.tracking_url
    ? `Tracking: ${order.tracking_url}`
    : order.tracking_number
      ? `Trackingnummer: ${order.tracking_number}`
      : 'Die Sendung ist unterwegs.';

  return {
    to: order.customer_email,
    from: sender(env),
    replyTo: env.REPLY_TO_EMAIL || env.ADMIN_EMAIL || undefined,
    subject,
    text: [
      `Dein Wachsfresser ist unterwegs.`,
      ``,
      `Bestellnummer: ${order.order_ref}`,
      order.carrier ? `Versanddienst: ${order.carrier}` : '',
      tracking,
      ``,
      `Danke und viel Freude mit deinem Wachsfresser.`,
      ``,
      `Wachsfresser Schweiz`,
    ].filter(Boolean).join('\n'),
    html: layout(
      subject,
      `
        <p>Dein Wachsfresser ist unterwegs.</p>
        <p><strong>Bestellnummer:</strong> ${escapeHtml(order.order_ref)}</p>
        ${order.carrier ? `<p><strong>Versanddienst:</strong> ${escapeHtml(order.carrier)}</p>` : ''}
        ${order.tracking_url
          ? `<p><a href="${escapeAttribute(order.tracking_url)}">Sendung verfolgen</a></p>`
          : order.tracking_number
            ? `<p><strong>Trackingnummer:</strong> ${escapeHtml(order.tracking_number)}</p>`
            : '<p>Die Sendung ist unterwegs.</p>'}
        <p>Danke und viel Freude mit deinem Wachsfresser.</p>
      `,
    ),
  };
}

function sender(env) {
  return env.FROM_EMAIL || 'Wachsfresser Schweiz <hallo@wachsfresser-schweiz.ch>';
}

function shippingLine(order) {
  if (order.shipping_region === 'eu') return 'Versand: Europa';
  return 'Versand: Schweiz';
}

function layout(title, body) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;background:#f4efe7;color:#201b16;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:680px;margin:0 auto;padding:32px 24px;">
    <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a7562;">Wachsfresser Schweiz</p>
    <h1 style="font-weight:400;font-size:34px;line-height:1.1;margin:12px 0 24px;">${escapeHtml(title)}</h1>
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">
      ${body}
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}
