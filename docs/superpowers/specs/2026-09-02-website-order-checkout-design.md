# City Fashion Website Order Checkout Design

Date: 2026-09-02
Status: Approved for implementation planning

## Purpose

Let a Sri Lankan wholesale customer build and submit a complete product order on the City Fashion website with very little typing. The website records the order, gives the customer a short reference, and alerts the owner. City Fashion staff then call the customer, confirm delivery, and send payment instructions.

The design keeps WhatsApp as an optional support channel rather than using it as the order-entry system.

## Success criteria

- A customer can add products, change quantities, keep browsing, and always see the exact product total.
- Each newly added product starts at six pieces.
- The minus and plus controls change quantity by one piece, with six as the minimum.
- Checkout asks only for the customer's name and WhatsApp number.
- Placing an order creates one durable database record and returns a short reference such as `CF-1001`.
- The customer immediately sees an order-received confirmation and an optional WhatsApp button.
- The owner sees the order in a private dashboard and receives an email notification.
- The order remains saved even when email delivery fails.
- No customer account, phone OTP, delivery calculation, or online payment is required in this version.

## Scope

### Included

- Device-local order cart
- Add-to-order controls on eligible products
- Quantity editing while browsing and in the cart
- Exact product subtotal in LKR
- Minimal checkout form
- Order submission and duplicate protection
- Order-received confirmation
- Optional WhatsApp support link containing the order reference
- Supabase order storage
- One-owner admin authentication
- Private order dashboard and order detail view
- Manual delivery charge entry
- Calculated final payable amount after delivery is entered
- Status changes
- Email notification to the owner
- Generated WhatsApp payment-confirmation message for staff to send manually
- Mobile-first validation and accessibility checks

### Not included

- Customer accounts or OTP
- A separate wishlist
- Customer order-history or tracking pages
- Stock-status display
- Automatic delivery pricing
- Online card or bank payments
- Automated outbound WhatsApp messages
- Staff roles or multiple admin accounts
- Odoo order creation or live stock reservation

## Customer journey

### 1. Browse and add

An eligible product shows **Add to order**. Selecting it adds the product to the cart at six pieces. The control then shows:

`-  6  +`

The customer can increase or decrease the quantity one piece at a time. Quantity cannot go below six. A remove action is available in the cart.

The site uses one order-cart concept. Existing customer-facing shortlist and phone-login prompts are removed from this journey so customers do not have to understand both a shortlist and a cart.

Only products with a confirmed numeric unit price can be ordered. A product without a confirmed price shows **Ask price on WhatsApp** instead of **Add to order**.

Order eligibility uses an authoritative integer `unitPriceLkr` catalog field. The importer carries this field from the product overrides into generated catalog data, and the UI formats it for display. The order endpoint must not parse a price from display text such as “From Rs. 1,200.”

For version one, six pieces is the minimum for every orderable style. A product with conflicting MOQ data must not enter the order flow until its catalog data is corrected.

### 2. Keep browsing

The cart remains available in the header and mobile sticky navigation. Its item count and product total update immediately. Cart contents are saved in browser storage so navigation and refreshes do not erase the order.

The customer can open the cart, edit quantities, remove products, or choose **Continue shopping**.

### 3. Review the order

The cart shows each product's:

- Image
- Style code and short title
- Quantity
- Unit price
- Line total

The bottom of the cart shows **Product total**. Delivery is deliberately excluded and the page states: **Delivery will be confirmed by our staff.**

### 4. Minimal checkout

The customer selects **Continue to order** and enters only:

- Name
- WhatsApp number

The WhatsApp number accepts common Sri Lankan formats and is normalized to `+94` before storage. The customer reviews the product total and selects **Place order**.

### 5. Confirmation

After the database accepts the order, the checkout changes to a confirmation state without exposing customer data in a public URL:

> **Order received — CF-1001**
>
> Product total: Rs. 18,000
>
> Our staff will contact you shortly to confirm delivery and payment.

The screen includes **Message us on WhatsApp**. Its prefilled message contains only the order reference and a short request for help. The customer does not need to send this message for the order to be valid.

The cart clears only after the server confirms that the order was saved.

## Customer-facing copy

Use these short labels wherever possible:

- **Add to order**
- **View order**
- **Your order**
- **Continue shopping**
- **Continue to order**
- **Name**
- **WhatsApp number**
- **Product total**
- **Delivery will be confirmed by our staff**
- **Place order**
- **Order received**
- **We will contact you shortly**
- **Message us on WhatsApp**

Validation and recovery copy:

- **Enter your name**
- **Enter a valid WhatsApp number**
- **This style is no longer available to order**
- **We could not place your order. Your items are still saved. Try again or message us on WhatsApp.**

Avoid checkout terms such as “lead,” “intent,” “conversion,” “fulfilment,” and “authentication” in customer-facing UI.

## Admin journey

### Access

The dashboard is available at `/admin/orders`. Supabase email-and-password authentication protects it. A server-side allowlist permits exactly one configured admin email. Customer order rows are never exposed to anonymous browser queries.

### Order list

The newest orders appear first. Each row shows:

- Reference
- Date and time
- Customer name
- WhatsApp number
- Number of styles
- Product total
- Status

### Order detail

The detail view shows all item snapshots and customer information. It provides actions to:

- Call the customer
- Open WhatsApp
- Add the delivery charge
- See the calculated final payable amount
- Add a private note
- Change status

Version-one statuses are:

- `new`
- `confirmed`
- `paid`
- `completed`
- `cancelled`

The usual forward flow is `new` to `confirmed` to `paid` to `completed`. An order may move to `cancelled` from `new` or `confirmed`. Correcting an accidental admin change is allowed only by explicitly selecting the preceding status; every update records its timestamp.

The dashboard provides a **Message payment details** action. It opens WhatsApp with a generated message containing the order reference, product total, delivery charge, final payable amount, and server-configured payment instructions. Bank or payment details remain in private server configuration and are not committed to the repository.

## System architecture

### Customer cart

The cart is client-side state persisted under a versioned browser-storage key. Each entry contains only a product identifier and quantity. Display prices are always refreshed from the current catalog; browser-stored prices are never authoritative.

### Order submission

`POST /api/orders` accepts:

- Customer name
- WhatsApp number
- Product identifiers and quantities
- A client-generated idempotency key

The server:

1. Validates and normalizes the customer fields.
2. Loads each product from the server-side catalog.
3. Rejects missing, ineligible, or non-numeric-price products.
4. Enforces a minimum quantity of six and integer quantities.
5. Recalculates unit prices, line totals, and the product total.
6. Creates the order and item snapshots in one database transaction.
7. Assigns the next public reference.
8. Returns the reference and validated summary.
9. Attempts the owner email after the order is durable.

The idempotency key is unique. Repeated submissions return the original result instead of creating a second order.

### Public and internal identifiers

Each order has an internal UUID and a separate sequential public number. The customer-facing reference is formatted as `CF-` plus the public number, beginning at `CF-1001`. The database generates the sequence atomically so concurrent orders cannot receive the same reference.

### Admin API

Admin list, detail, and update operations run through server-only routes. Every request verifies both the Supabase session and the allowlisted admin email before reading or changing order data.

## Data model

### `orders`

- `id`: UUID primary key
- `public_number`: unique sequential integer beginning at 1001
- `reference`: generated/displayed as `CF-<public_number>`
- `idempotency_key`: unique string
- `customer_name`: text
- `whatsapp_phone`: normalized text
- `product_total_lkr`: integer
- `delivery_charge_lkr`: nullable integer
- `final_total_lkr`: nullable integer, calculated on the server
- `status`: constrained order status
- `private_note`: nullable text
- `created_at`: timestamp
- `updated_at`: timestamp

### `order_items`

- `id`: UUID primary key
- `order_id`: foreign key to `orders`
- `product_id`: catalog style code
- `product_slug`: catalog slug
- `product_title`: title snapshot
- `unit_price_lkr`: integer snapshot
- `quantity`: integer, minimum six
- `line_total_lkr`: integer snapshot
- `created_at`: timestamp

Order item names and prices are snapshots so later catalog edits do not rewrite historical orders.

## Email notification

Use Resend from the server to send a new-order email to the configured owner address. The email includes the reference, customer name, WhatsApp number, line items, product total, time, and a dashboard link.

Email is a notification channel only. A send failure is logged for diagnosis but does not roll back or hide the order. The dashboard remains the source of truth.

## Error handling

- A failed database write leaves the cart untouched and shows the recovery message.
- A successful database write followed by an email failure still shows order confirmation.
- A stale cart is revalidated during submission; the customer is told which style needs attention.
- Invalid quantities and totals are rejected server-side.
- Admin updates validate non-negative integer delivery charges and allowed status transitions.
- The payment-details action remains disabled until a delivery charge has been entered and the order is confirmed.
- Server logs contain internal order IDs but avoid full customer details where possible.

## Security and privacy

- Enable Row Level Security on both order tables.
- Grant no anonymous or ordinary authenticated direct access to order rows.
- Perform customer order creation through the validated server endpoint.
- Keep Supabase secret credentials, admin allowlist, Resend key, notification address, and payment instructions in deployment environment variables.
- Apply basic rate limiting to order submission by IP and phone number.
- Escape customer text in the dashboard and email.
- Never expose sequential references as authorization credentials.
- Do not show stock evidence or internal Odoo data to customers.

## Verification

### Automated checks

- A newly added style starts at six.
- Plus and minus change quantity by one.
- Quantity cannot drop below six.
- Cart line totals and product total update correctly.
- Cart contents survive navigation and refresh.
- Invalid or missing prices cannot enter the order flow.
- Checkout accepts only name and a valid Sri Lankan WhatsApp number.
- The server ignores client-supplied price values.
- Duplicate submissions with the same idempotency key produce one order.
- Concurrent orders receive unique sequential references.
- Database failure preserves the cart.
- Email failure does not lose the order.
- Unauthorized users cannot read or update orders.
- Delivery and final-total calculations are correct.

### Browser checks

- Complete the journey at representative mobile and desktop widths.
- Add products from product and listing pages, then keep browsing.
- Edit and remove cart items.
- Refresh with a populated cart.
- Submit an order and verify `CF-1001`-style confirmation.
- Open the optional WhatsApp support link and inspect its message.
- Verify the owner email and matching dashboard order.
- Confirm admin login, order list, order detail, status changes, delivery entry, and payment-message generation.
- Verify visible focus states, button labels, form validation, and touch-target sizes.

## Release boundary

The feature is ready to publish only when production Supabase, the single admin account, Resend sender/recipient settings, and private payment instructions are configured and the complete order path is proven on the public domain. Existing WhatsApp ordering should remain available as a fallback during rollout.
