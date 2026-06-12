(function () {
  const state = {
    token: sessionStorage.getItem('wf_admin_token') || '',
    selected: null,
  };

  const list = document.getElementById('orders-list');
  const detail = document.getElementById('order-detail');
  const tokenInput = document.getElementById('admin-token');
  const saveToken = document.getElementById('save-token');
  const refresh = document.getElementById('refresh-orders');

  tokenInput.value = state.token;
  saveToken.addEventListener('click', () => {
    state.token = tokenInput.value.trim();
    sessionStorage.setItem('wf_admin_token', state.token);
    loadOrders();
  });
  refresh.addEventListener('click', loadOrders);

  loadOrders();

  async function api(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;

    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
    return data;
  }

  async function loadOrders() {
    list.innerHTML = '<div class="admin-message">Lade Bestellungen...</div>';
    try {
      const data = await api('/api/admin/orders?limit=50');
      renderOrders(data.orders || []);
    } catch (error) {
      list.innerHTML = `<div class="admin-message">${escapeHtml(error.message)}</div>`;
    }
  }

  function renderOrders(orders) {
    if (!orders.length) {
      list.innerHTML = '<div class="admin-message">Noch keine Bestellungen vorhanden.</div>';
      return;
    }

    list.innerHTML = orders.map(order => `
      <button class="order-card ${state.selected === order.order_ref ? 'active' : ''}" data-order="${escapeAttribute(order.order_ref)}">
        <strong>${escapeHtml(order.order_ref)}</strong>
        <span class="status-pill">${escapeHtml(order.status)}</span>
        <span class="order-meta">
          ${escapeHtml(order.customer_name || order.customer_email || 'Unbekannter Kunde')}<br/>
          CHF ${formatAmount(order.amount_total)} · ${escapeHtml(order.shipping_region || '')}<br/>
          ${formatDate(order.created_at)}
        </span>
      </button>
    `).join('');

    list.querySelectorAll('[data-order]').forEach(button => {
      button.addEventListener('click', () => loadOrder(button.dataset.order));
    });
  }

  async function loadOrder(orderRef) {
    state.selected = orderRef;
    detail.className = 'order-detail';
    detail.innerHTML = '<div class="admin-message">Lade Details...</div>';

    try {
      const data = await api(`/api/admin/orders/${encodeURIComponent(orderRef)}`);
      renderDetail(data.order, data.items || [], data.events || []);
      loadOrders();
    } catch (error) {
      detail.innerHTML = `<div class="admin-message">${escapeHtml(error.message)}</div>`;
    }
  }

  function renderDetail(order, items, events) {
    detail.innerHTML = `
      <div>
        <div class="detail-title">${escapeHtml(order.order_ref)}</div>
        <div class="detail-meta">
          ${escapeHtml(order.customer_name || '-')} · ${escapeHtml(order.customer_email || '-')}<br/>
          Status: ${escapeHtml(order.status)} · Zahlung: ${escapeHtml(order.payment_status || '-')}<br/>
          Total: CHF ${formatAmount(order.amount_total)}
        </div>
      </div>

      <div class="detail-section">
        <h3>Positionen</h3>
        <div class="detail-items">
          ${items.map(item => `
            <div class="detail-row">
              <span>${item.quantity} x ${escapeHtml(item.product_name)}</span>
              <strong>CHF ${formatAmount(item.amount_total)}</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="detail-section">
        <h3>Versand</h3>
        <form class="ship-form" id="ship-form">
          <input name="carrier" placeholder="Versanddienst, z.B. Die Post" value="${escapeAttribute(order.carrier || '')}"/>
          <input name="trackingNumber" placeholder="Trackingnummer" value="${escapeAttribute(order.tracking_number || '')}"/>
          <input name="trackingUrl" placeholder="Trackinglink" value="${escapeAttribute(order.tracking_url || '')}"/>
          <button class="btn-primary" type="submit">Als verschickt markieren</button>
        </form>
        <div id="ship-message"></div>
      </div>

      <div class="detail-section">
        <h3>Ereignisse</h3>
        <div class="detail-items">
          ${events.map(event => `
            <div class="detail-row">
              <span>${escapeHtml(event.type)}</span>
              <span>${formatDate(event.created_at)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('ship-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const message = document.getElementById('ship-message');
      message.innerHTML = '<div class="admin-message">Speichere Versandstatus...</div>';

      try {
        await api(`/api/admin/orders/${encodeURIComponent(order.order_ref)}/mark-shipped`, {
          method: 'POST',
          body: JSON.stringify({
            carrier: form.get('carrier'),
            trackingNumber: form.get('trackingNumber'),
            trackingUrl: form.get('trackingUrl'),
          }),
        });
        message.innerHTML = '<div class="admin-message">Versandstatus gespeichert. Versandmail wurde angestossen.</div>';
        await loadOrder(order.order_ref);
      } catch (error) {
        message.innerHTML = `<div class="admin-message">${escapeHtml(error.message)}</div>`;
      }
    });
  }

  function formatAmount(value) {
    return (Number(value || 0) / 100).toFixed(2);
  }

  function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleString('de-CH', { dateStyle: 'medium', timeStyle: 'short' });
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
})();
