# 📦 Minimal Payload Fields — Email Service

> **File:** `app/utils/extractMinimalPayload.ts`
>
> This document lists every field that is sent in the **email notification** for each Shopify resource type.
> The **database always stores the full webhook payload** — only the email gets the trimmed-down version.

---

## 🔑 Universal Fields (included for ALL resources)

These fields are **always** extracted when present in the payload.
**Every ID is a proper Shopify GID** — never a raw numeric ID.

| # | Field          | Format                                                | Description                       |
|---|----------------|-------------------------------------------------------|-----------------------------------|
| 1 | `resource_id`  | `gid://shopify/{Type}/{id}` (e.g. `gid://shopify/Product/123`) | **Always present.** Proper GID of the resource |
| 2 | `created_at`   | ISO 8601 timestamp                                    | When the resource was created     |
| 3 | `updated_at`   | ISO 8601 timestamp                                    | When the resource was last updated|

> **Note:** All foreign-key reference fields (`product_id`, `order_id`, `company_id`, etc.) are also
> converted to proper GIDs. For example, `product_id: 123` becomes `product_id: gid://shopify/Product/123`.

---

## 🛍️ Products

### Product
| # | Field          | Example                  |
|---|----------------|--------------------------|
| 1 | `title`        | `"Classic T-Shirt"`      |
| 2 | `handle`       | `"classic-t-shirt"`      |
| 3 | `status`       | `"active"` / `"draft"`   |
| 4 | `product_type` | `"Apparel"`              |
| 5 | `vendor`       | `"My Store"`             |
| 6 | `tags`         | `"sale, summer"`         |

### Product Variant
| # | Field               | Example             |
|---|---------------------|----------------------|
| 1 | `title`             | `"Small / Red"`      |
| 2 | `sku`               | `"TSHIRT-SM-RED"`    |
| 3 | `price`             | `"29.99"`            |
| 4 | `compare_at_price`  | `"39.99"`            |
| 5 | `inventory_quantity` | `100`               |
| 6 | `barcode`           | `"1234567890"`       |
| 7 | `weight`            | `0.5`                |
| 8 | `product_id`        | `123456789`          |

### Product Listing
| # | Field        | Example               |
|---|--------------|------------------------|
| 1 | `title`      | `"Classic T-Shirt"`    |
| 2 | `handle`     | `"classic-t-shirt"`    |
| 3 | `product_id` | `123456789`            |

### Product Publication
| # | Field        | Example      |
|---|--------------|--------------|
| 1 | `product_id` | `123456789`  |

### Product Feed
| # | Field    | Example    |
|---|----------|------------|
| 1 | `status` | `"active"` |

---

## 📂 Collections

### Collection
| # | Field        | Example              |
|---|--------------|----------------------|
| 1 | `title`      | `"Summer Sale"`      |
| 2 | `handle`     | `"summer-sale"`      |
| 3 | `sort_order` | `"best-selling"`     |

### Collection Listing
| # | Field           | Example            |
|---|-----------------|---------------------|
| 1 | `title`         | `"Summer Sale"`     |
| 2 | `handle`        | `"summer-sale"`     |
| 3 | `collection_id` | `987654321`         |

### Collection Publication
| # | Field           | Example     |
|---|-----------------|-------------|
| 1 | `collection_id` | `987654321` |

---

## 👤 Customers

### Customer
| # | Field            | Example                |
|---|------------------|------------------------|
| 1 | `first_name`     | `"John"`               |
| 2 | `last_name`      | `"Doe"`                |
| 3 | `email`          | `"john@example.com"`   |
| 4 | `phone`          | `"+1234567890"`        |
| 5 | `state`          | `"enabled"`            |
| 6 | `tags`           | `"vip, wholesale"`     |
| 7 | `orders_count`   | `5`                    |
| 8 | `total_spent`    | `"500.00"`             |
| 9 | `verified_email` | `true`                 |

### Customer Group
| # | Field   | Example                     |
|---|---------|-----------------------------|
| 1 | `name`  | `"VIP Customers"`           |
| 2 | `query` | `"total_spent > 500"`       |

### Customer Marketing Consent
| # | Field   | Example              |
|---|---------|----------------------|
| 1 | `email` | `"john@example.com"` |
| 2 | `state` | `"subscribed"`       |

### Customer Segment
| # | Field  | Example          |
|---|--------|------------------|
| 1 | `name` | `"High Spenders"`|

### Customer Account Settings
| # | Field | Note                       |
|---|-------|----------------------------|
|   | —     | *Universal fields only*    |

---

## 🧾 Orders

### Order
| # | Field                | Example            |
|---|----------------------|--------------------|
| 1 | `name`               | `"#1001"`          |
| 2 | `order_number`       | `1001`             |
| 3 | `email`              | `"john@example.com"` |
| 4 | `phone`              | `"+1234567890"`    |
| 5 | `financial_status`   | `"paid"`           |
| 6 | `fulfillment_status` | `"fulfilled"`      |
| 7 | `total_price`        | `"150.00"`         |
| 8 | `subtotal_price`     | `"140.00"`         |
| 9 | `total_tax`          | `"10.00"`          |
|10 | `currency`           | `"USD"`            |
|11 | `cancel_reason`      | `"customer"`       |
|12 | `tags`               | `"rush"`           |

### Draft Order
| # | Field           | Example              |
|---|-----------------|----------------------|
| 1 | `name`          | `"#D1"`              |
| 2 | `email`         | `"john@example.com"` |
| 3 | `status`        | `"open"`             |
| 4 | `total_price`   | `"50.00"`            |
| 5 | `subtotal_price`| `"45.00"`            |
| 6 | `currency`      | `"USD"`              |
| 7 | `tags`          | `"wholesale"`        |

### Order Transaction
| # | Field      | Example           |
|---|------------|-------------------|
| 1 | `kind`     | `"capture"`       |
| 2 | `gateway`  | `"shopify_payments"` |
| 3 | `status`   | `"success"`       |
| 4 | `amount`   | `"150.00"`        |
| 5 | `currency` | `"USD"`           |
| 6 | `order_id` | `123456789`       |

### Refund
| # | Field      | Example              |
|---|------------|----------------------|
| 1 | `order_id` | `123456789`          |
| 2 | `note`     | `"Damaged item"`     |

### Return
| # | Field      | Example        |
|---|------------|----------------|
| 1 | `order_id` | `123456789`    |
| 2 | `status`   | `"requested"`  |

---

## 📦 Fulfillment

### Fulfillment
| # | Field              | Example                          |
|---|--------------------|----------------------------------|
| 1 | `status`           | `"success"`                      |
| 2 | `tracking_number`  | `"1Z999AA10123456784"`           |
| 3 | `tracking_company` | `"UPS"`                          |
| 4 | `tracking_url`     | `"https://ups.com/track/..."`    |
| 5 | `order_id`         | `123456789`                      |

### Fulfillment Order
| # | Field                  | Example       |
|---|------------------------|---------------|
| 1 | `status`               | `"open"`      |
| 2 | `order_id`             | `123456789`   |
| 3 | `assigned_location_id` | `987654321`   |

### Fulfillment Event
| # | Field            | Example       |
|---|------------------|---------------|
| 1 | `status`         | `"in_transit"`|
| 2 | `order_id`       | `123456789`   |
| 3 | `fulfillment_id` | `111222333`   |

### Fulfillment Hold
| # | Field                   | Example                  |
|---|-------------------------|--------------------------|
| 1 | `reason`                | `"inventory_out_of_stock"` |
| 2 | `fulfillment_order_id`  | `444555666`              |

---

## 📊 Inventory

### Inventory Item
| # | Field     | Example          |
|---|-----------|------------------|
| 1 | `sku`     | `"TSHIRT-SM-RED"` |
| 2 | `cost`    | `"15.00"`        |
| 3 | `tracked` | `true`           |

### Inventory Level
| # | Field               | Example     |
|---|---------------------|-------------|
| 1 | `inventory_item_id` | `123456789` |
| 2 | `location_id`       | `987654321` |
| 3 | `available`         | `50`        |

---

## 🏢 Companies (B2B)

### Company
| # | Field  | Example              |
|---|--------|----------------------|
| 1 | `name` | `"Acme Corp"`        |
| 2 | `note` | `"Wholesale partner"`|

### Company Contact
| # | Field        | Example              |
|---|--------------|----------------------|
| 1 | `first_name` | `"Jane"`             |
| 2 | `last_name`  | `"Smith"`            |
| 3 | `email`      | `"jane@acme.com"`    |
| 4 | `phone`      | `"+1987654321"`      |
| 5 | `company_id` | `123456789`          |

### Company Contact Role
| # | Field                | Example      |
|---|----------------------|--------------|
| 1 | `name`               | `"Admin"`    |
| 2 | `company_contact_id` | `123456789`  |

### Company Location
| # | Field        | Example        |
|---|--------------|----------------|
| 1 | `name`       | `"HQ Office"`  |
| 2 | `company_id` | `123456789`    |

---

## 🏷️ Discounts

### Discount
| # | Field        | Example           |
|---|--------------|-------------------|
| 1 | `title`      | `"SUMMER20"`      |
| 2 | `status`     | `"active"`        |
| 3 | `value`      | `"20.0"`          |
| 4 | `value_type` | `"percentage"`    |
| 5 | `starts_at`  | `"2026-06-01T00:00:00Z"` |
| 6 | `ends_at`    | `"2026-08-31T23:59:59Z"` |
| 7 | `code`       | `"SUMMER20"`      |

---

## 🧩 Metafields & Metaobjects

### Metafield Definition
| # | Field       | Example                |
|---|-------------|------------------------|
| 1 | `name`      | `"Color"`              |
| 2 | `namespace` | `"custom"`             |
| 3 | `key`       | `"color"`              |
| 4 | `type`      | `"single_line_text_field"` |

### Metaobject
| # | Field    | Example          |
|---|----------|------------------|
| 1 | `type`   | `"testimonial"`  |
| 2 | `handle` | `"testimonial-1"`|
| 3 | `status` | `"active"`       |

---

## 📍 Locations

### Location
| # | Field      | Example          |
|---|------------|------------------|
| 1 | `name`     | `"Main Warehouse"` |
| 2 | `address1` | `"123 Main St"`  |
| 3 | `city`     | `"New York"`     |
| 4 | `province` | `"NY"`           |
| 5 | `country`  | `"US"`           |
| 6 | `phone`    | `"+1234567890"`  |
| 7 | `active`   | `true`           |

---

## 🌍 Markets

### Market
| # | Field     | Example  |
|---|-----------|----------|
| 1 | `name`    | `"US"`   |
| 2 | `enabled` | `true`   |
| 3 | `primary` | `true`   |

---

## 🌐 Domains

### Domain
| # | Field         | Example             |
|---|---------------|----------------------|
| 1 | `host`        | `"mystore.com"`     |
| 2 | `ssl_enabled` | `true`              |

---

## 🎨 Themes

### Theme
| # | Field  | Example     |
|---|--------|-------------|
| 1 | `name` | `"Dawn"`    |
| 2 | `role` | `"main"`    |

---

## 🚚 Delivery Profiles

### Delivery Profile
| # | Field  | Example             |
|---|--------|----------------------|
| 1 | `name` | `"General Profile"` |

### Delivery Promise Settings
| # | Field | Note                    |
|---|-------|--------------------------|
|   | —     | *Universal fields only* |

---

## 🌏 Locales

### Locale
| # | Field       | Example  |
|---|-------------|----------|
| 1 | `locale`    | `"fr"`   |
| 2 | `published` | `true`   |

---

## 👥 Segments

### Segment
| # | Field   | Example                  |
|---|---------|--------------------------|
| 1 | `name`  | `"Repeat Buyers"`        |
| 2 | `query` | `"orders_count > 1"`     |

---

## 📅 Selling Plan Groups

### Selling Plan Group
| # | Field           | Example                |
|---|-----------------|------------------------|
| 1 | `name`          | `"Subscribe & Save"`   |
| 2 | `merchant_code` | `"subscribe-save"`     |

---

## 💳 Payment Terms

### Payment Terms
| # | Field                | Example         |
|---|----------------------|-----------------|
| 1 | `payment_terms_name` | `"Net 30"`      |
| 2 | `payment_terms_type` | `"NET"`         |
| 3 | `due_in_days`        | `30`            |

### Payment Schedule
| # | Field      | Example                  |
|---|------------|--------------------------|
| 1 | `amount`   | `"100.00"`               |
| 2 | `currency` | `"USD"`                  |
| 3 | `due_at`   | `"2026-03-25T00:00:00Z"` |

---

## 📺 Channels

### Channel
| # | Field    | Example              |
|---|----------|----------------------|
| 1 | `name`   | `"Online Store"`     |
| 2 | `handle` | `"online-store"`     |

---

## 🛒 Carts

### Cart
| # | Field   | Example              |
|---|---------|----------------------|
| 1 | `token` | `"abc123def456"`     |
| 2 | `note`  | `"Gift wrapping"`    |

---

## ✅ Checkouts

### Checkout
| # | Field           | Example              |
|---|-----------------|----------------------|
| 1 | `token`         | `"abc123def456"`     |
| 2 | `email`         | `"john@example.com"` |
| 3 | `phone`         | `"+1234567890"`      |
| 4 | `total_price`   | `"150.00"`           |
| 5 | `subtotal_price`| `"140.00"`           |
| 6 | `currency`      | `"USD"`              |

---

## 🏪 Shop

### Shop
| # | Field       | Example              |
|---|-------------|----------------------|
| 1 | `name`      | `"My Awesome Store"` |
| 2 | `email`     | `"shop@example.com"` |
| 3 | `domain`    | `"mystore.myshopify.com"` |
| 4 | `plan_name` | `"basic"`            |
| 5 | `currency`  | `"USD"`              |
| 6 | `timezone`  | `"(GMT-05:00) Eastern Time"` |

---

## 🔄 Subscriptions

### Subscription Contract
| # | Field    | Example    |
|---|----------|------------|
| 1 | `status` | `"active"` |

### Subscription Billing Attempt
| # | Field    | Example      |
|---|----------|--------------|
| 1 | `status` | `"success"`  |

### Subscription Billing Cycle
| # | Field    | Example    |
|---|----------|------------|
| 1 | `status` | `"billed"` |

---

## 💰 Tender Transactions

### Tender Transaction
| # | Field            | Example           |
|---|------------------|-------------------|
| 1 | `amount`         | `"50.00"`         |
| 2 | `currency`       | `"USD"`           |
| 3 | `payment_method` | `"credit_card"`   |

---

## ↩️ Reverse Operations

### Reverse Delivery
| # | Field      | Example     |
|---|------------|-------------|
| 1 | `order_id` | `123456789` |

### Reverse Fulfillment Order
| # | Field      | Example     |
|---|------------|-------------|
| 1 | `order_id` | `123456789` |

---

## 📱 App Lifecycle

### App
| # | Field | Note                    |
|---|-------|--------------------------|
|   | —     | *Universal fields only* |

### App Purchase
| # | Field    | Example      |
|---|----------|--------------|
| 1 | `status` | `"accepted"` |

### App Subscription
| # | Field    | Example    |
|---|----------|------------|
| 1 | `status` | `"active"` |

---

## 📫 Shipping Address
| # | Field | Note                    |
|---|-------|--------------------------|
|   | —     | *Universal fields only* |

---

## 🏛️ Tax Service
| # | Field | Note                    |
|---|-------|--------------------------|
|   | —     | *Universal fields only* |

---

## ⚡ How It Works

```
Webhook Payload (full)
        │
        ├──► DB: stores FULL JSON.stringify(payload) ✅
        │
        └──► Email (via Flow):
                │
                extractMinimalPayload(resourceType, payload)
                │
                └──► Only the fields listed above are included ✅
```

> **To add/remove fields** for a resource, edit `RESOURCE_FIELDS` in
> `app/utils/extractMinimalPayload.ts`
