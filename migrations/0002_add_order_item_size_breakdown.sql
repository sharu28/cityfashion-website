-- Optional pieces per size for an order line, as JSON: [{"size":"M","quantity":2}, ...].
-- NULL when the shop did not pick sizes (staff confirm sizes on WhatsApp).
ALTER TABLE order_items ADD COLUMN size_breakdown TEXT CHECK (size_breakdown IS NULL OR json_valid(size_breakdown));
