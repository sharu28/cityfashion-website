-- Website orders for cityfashion.shop (Cloudflare D1 / SQLite).
-- Prices are copied from the server catalog when the order is placed.

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  public_number INTEGER NOT NULL UNIQUE CHECK (public_number >= 1001),
  idempotency_key TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL CHECK (length(customer_name) BETWEEN 1 AND 100),
  whatsapp_phone TEXT NOT NULL CHECK (whatsapp_phone GLOB '+947[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
  product_total_lkr INTEGER NOT NULL CHECK (product_total_lkr > 0),
  delivery_charge_lkr INTEGER CHECK (delivery_charge_lkr IS NULL OR delivery_charge_lkr >= 0),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'paid', 'completed', 'cancelled')),
  private_note TEXT CHECK (private_note IS NULL OR length(private_note) <= 2000),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id TEXT NOT NULL CHECK (length(product_id) > 0),
  product_slug TEXT NOT NULL CHECK (length(product_slug) > 0),
  product_title TEXT NOT NULL CHECK (length(product_title) > 0),
  unit_price_lkr INTEGER NOT NULL CHECK (unit_price_lkr > 0),
  quantity INTEGER NOT NULL CHECK (quantity >= 6),
  line_total_lkr INTEGER NOT NULL CHECK (line_total_lkr = unit_price_lkr * quantity),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);

CREATE TABLE IF NOT EXISTS order_submission_attempts (
  id TEXT PRIMARY KEY,
  identity_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS order_submission_attempts_identity_idx
  ON order_submission_attempts (identity_hash, created_at);
