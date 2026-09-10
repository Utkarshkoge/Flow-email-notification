/**
 * Extract Minimal Payload
 * ────────────────────────
 * Picks only the most important fields from a Shopify webhook payload
 * based on the resource type. This keeps emails short and readable.
 *
 * ✅  Resource ID (admin_graphql_api_id / id) is ALWAYS included.
 * ✅  created_at / updated_at are ALWAYS included when present.
 * ✅  Resource-specific fields (name, email, handle, sku …) are added per type.
 */

// ── Per-resource field lists ────────────────────────────────────────────────

const RESOURCE_FIELDS: Record<string, string[]> = {
    // Products
    Product: [
        "title", "handle", "status", "product_type", "vendor", "tags",
    ],
    "Product Variant": [
        "title", "sku", "price", "compare_at_price", "inventory_quantity",
        "barcode", "weight", "product_id",
    ],
    "Product Listing": ["title", "handle", "product_id"],
    "Product Publication": ["product_id"],
    "Product Feed": ["status"],

    // Collections
    Collection: ["title", "handle", "sort_order"],
    "Collection Listing": ["title", "handle", "collection_id"],
    "Collection Publication": ["collection_id"],

    // Customers
    Customer: [
        "first_name", "last_name", "email", "phone", "state", "tags",
        "orders_count", "total_spent", "verified_email",
    ],
    "Customer Group": ["name", "query"],
    "Customer Marketing Consent": ["email", "state"],
    "Customer Segment": ["name"],
    "Customer Account Settings": [],

    // Orders
    Order: [
        "name", "order_number", "email", "phone",
        "financial_status", "fulfillment_status",
        "total_price", "subtotal_price", "total_tax",
        "currency", "cancel_reason", "tags",
    ],
    "Draft Order": [
        "name", "email", "status", "total_price", "subtotal_price",
        "currency", "tags",
    ],
    "Order Transaction": [
        "kind", "gateway", "status", "amount", "currency", "order_id",
    ],
    Refund: ["order_id", "note"],
    Return: ["order_id", "status"],

    // Fulfillment
    Fulfillment: [
        "status", "tracking_number", "tracking_company", "tracking_url",
        "order_id",
    ],
    "Fulfillment Order": ["status", "order_id", "assigned_location_id"],
    "Fulfillment Event": ["status", "order_id", "fulfillment_id"],
    "Fulfillment Hold": ["reason", "fulfillment_order_id"],

    // Inventory
    "Inventory Item": ["sku", "cost", "tracked"],
    "Inventory Level": [
        "inventory_item_id", "location_id", "available",
    ],

    // Companies (B2B)
    Company: ["name", "note"],
    "Company Contact": ["first_name", "last_name", "email", "phone", "company_id"],
    "Company Contact Role": ["name", "company_contact_id"],
    "Company Location": ["name", "company_id"],

    // Discounts
    Discount: [
        "title", "status", "value", "value_type",
        "starts_at", "ends_at", "code",
    ],

    // Metafields / Metaobjects
    "Metafield Definition": ["name", "namespace", "key", "type"],
    Metaobject: ["type", "handle", "status"],

    // Locations
    Location: ["name", "address1", "city", "province", "country", "phone", "active"],

    // Markets
    Market: ["name", "enabled", "primary"],

    // Domains
    Domain: ["host", "ssl_enabled"],

    // Themes
    Theme: ["name", "role"],

    // Delivery Profiles
    "Delivery Profile": ["name"],
    "Delivery Promise Settings": [],

    // Locales
    Locale: ["locale", "published"],

    // Segments
    Segment: ["name", "query"],

    // Selling Plan Groups
    "Selling Plan Group": ["name", "merchant_code"],

    // Payment Terms
    "Payment Terms": ["payment_terms_name", "payment_terms_type", "due_in_days"],
    "Payment Schedule": ["amount", "currency", "due_at"],

    // Channels
    Channel: ["name", "handle"],

    // Carts
    Cart: ["token", "note"],

    // Checkouts
    Checkout: [
        "token", "email", "phone",
        "total_price", "subtotal_price", "currency",
    ],

    // Shop
    Shop: ["name", "email", "domain", "plan_name", "currency", "timezone"],

    // Subscriptions
    "Subscription Contract": ["status"],
    "Subscription Billing Attempt": ["status"],
    "Subscription Billing Cycle": ["status"],

    // Tender Transactions
    "Tender Transaction": ["amount", "currency", "payment_method"],

    // Reverse
    "Reverse Delivery": ["order_id"],
    "Reverse Fulfillment Order": ["order_id"],

    // App lifecycle
    App: [],
    "App Purchase": ["status"],
    "App Subscription": ["status"],

    // Shipping
    "Shipping Address": [],

    // Tax Services
    "Tax Service": [],
};

// ── Fields that are ALWAYS extracted (when present) ─────────────────────────

const UNIVERSAL_FIELDS = [
    "created_at",
    "updated_at",
];

// ── Public API ──────────────────────────────────────────────────────────────

// ── Map foreign-key _id fields to their Shopify GID type ────────────────────

const REFERENCE_ID_TO_GID_TYPE: Record<string, string> = {
    product_id: "Product",
    collection_id: "Collection",
    order_id: "Order",
    fulfillment_id: "Fulfillment",
    fulfillment_order_id: "FulfillmentOrder",
    inventory_item_id: "InventoryItem",
    location_id: "Location",
    assigned_location_id: "Location",
    company_id: "Company",
    company_contact_id: "CompanyContact",
};

export function extractMinimalPayload(
    resourceType: string,
    payload: Record<string, unknown>,
): Record<string, unknown> {
    const specificFields = RESOURCE_FIELDS[resourceType] ?? [];
    const allFields = [...UNIVERSAL_FIELDS, ...specificFields];

    const minimal: Record<string, unknown> = {};

    // ── Always include a proper GID as the first field ──────────────────
    const gidType = resourceType.replace(/\s+/g, "");
    if (payload.admin_graphql_api_id) {
        minimal.resource_id = payload.admin_graphql_api_id;
    } else if (payload.id) {
        minimal.resource_id = `gid://shopify/${gidType}/${payload.id}`;
    } else {
        minimal.resource_id = "N/A";
    }

    // ── Extract the remaining fields ────────────────────────────────────
    for (const field of allFields) {
        if (payload[field] !== undefined && payload[field] !== null) {
            const refGidType = REFERENCE_ID_TO_GID_TYPE[field];
            if (refGidType && typeof payload[field] === "number") {
                // Convert numeric reference IDs to proper GIDs
                minimal[field] = `gid://shopify/${refGidType}/${payload[field]}`;
            } else {
                minimal[field] = payload[field];
            }
        }
    }

    return minimal;
}
