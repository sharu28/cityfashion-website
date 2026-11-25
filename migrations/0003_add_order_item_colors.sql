-- Optional colours the shop picked for an order line, as JSON: ["Black Dotted Leaf", "Green Lotus"].
-- NULL when the shop did not pick colours (staff help them choose on WhatsApp).
ALTER TABLE order_items ADD COLUMN colors TEXT CHECK (colors IS NULL OR json_valid(colors));
