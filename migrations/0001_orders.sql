CREATE TABLE IF NOT EXISTS orders (
  order_ref TEXT PRIMARY KEY,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending_checkout',
  payment_status TEXT,
  payment_choice TEXT,
  customer_email TEXT,
  customer_name TEXT,
  amount_subtotal INTEGER NOT NULL DEFAULT 0,
  amount_shipping INTEGER NOT NULL DEFAULT 0,
  amount_total INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'chf',
  shipping_region TEXT NOT NULL DEFAULT 'ch',
  shipping_name TEXT,
  shipping_address_json TEXT,
  carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  paid_at TEXT,
  shipped_at TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_ref TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_amount INTEGER NOT NULL,
  amount_total INTEGER NOT NULL,
  meta_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (order_ref) REFERENCES orders(order_ref) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_events (
  event_id TEXT PRIMARY KEY,
  order_ref TEXT,
  type TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_ref TEXT NOT NULL,
  kind TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT,
  provider_message_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  UNIQUE(order_ref, kind),
  FOREIGN KEY (order_ref) REFERENCES orders(order_ref) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_session ON orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_ref ON order_items(order_ref);
CREATE INDEX IF NOT EXISTS idx_order_events_order_ref ON order_events(order_ref);
CREATE INDEX IF NOT EXISTS idx_email_log_order_ref ON email_log(order_ref);
