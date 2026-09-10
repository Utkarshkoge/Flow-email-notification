export interface ActionDefinition {
    id: string;
    label: string; // e.g. "Create", "Update", "Remove"
    topic: string; // GraphQL WebhookSubscriptionTopic enum
    description?: string;
}

export interface ResourceWebhookConfig {
    resourceName: string;
    emoji: string;
    description?: string;
    actions: ActionDefinition[];
}

export const RESOURCE_WEBHOOK_CONFIGS: ResourceWebhookConfig[] = [
    {
        resourceName: "Product",
        emoji: "🛍️",
        actions: [
            { id: "create", label: "Create", topic: "PRODUCTS_CREATE" },
            { id: "update", label: "Update", topic: "PRODUCTS_UPDATE" },
            { id: "delete", label: "Remove", topic: "PRODUCTS_DELETE" },
        ],
    },
    {
        resourceName: "Order",
        emoji: "🧾",
        actions: [
            { id: "create", label: "Create", topic: "ORDERS_CREATE" },
            { id: "update", label: "Update", topic: "ORDERS_UPDATED" },
            { id: "delete", label: "Remove", topic: "ORDERS_DELETE" },
            { id: "paid", label: "Paid", topic: "ORDERS_PAID" },
            { id: "cancelled", label: "Cancelled", topic: "ORDERS_CANCELLED" },
            { id: "fulfilled", label: "Fulfilled", topic: "ORDERS_FULFILLED" },
            { id: "edited", label: "Edited", topic: "ORDERS_EDITED" },
            { id: "partially_fulfilled", label: "Partially Fulfilled", topic: "ORDERS_PARTIALLY_FULFILLED" },
        ],
    },
    {
        resourceName: "Customer",
        emoji: "👤",
        actions: [
            { id: "create", label: "Create", topic: "CUSTOMERS_CREATE" },
            { id: "update", label: "Update", topic: "CUSTOMERS_UPDATE" },
            { id: "delete", label: "Remove", topic: "CUSTOMERS_DELETE" },
            { id: "enable", label: "Enable", topic: "CUSTOMERS_ENABLE" },
            { id: "disable", label: "Disable", topic: "CUSTOMERS_DISABLE" },
            { id: "merge", label: "Merge", topic: "CUSTOMERS_MERGE" },
        ],
    },
    {
        resourceName: "Draft Order",
        emoji: "📝",
        actions: [
            { id: "create", label: "Create", topic: "DRAFT_ORDERS_CREATE" },
            { id: "update", label: "Update", topic: "DRAFT_ORDERS_UPDATE" },
            { id: "delete", label: "Remove", topic: "DRAFT_ORDERS_DELETE" },
        ],
    },
    {
        resourceName: "Collection",
        emoji: "📁",
        actions: [
            { id: "create", label: "Create", topic: "COLLECTIONS_CREATE" },
            { id: "update", label: "Update", topic: "COLLECTIONS_UPDATE" },
            { id: "delete", label: "Remove", topic: "COLLECTIONS_DELETE" },
        ],
    },
    {
        resourceName: "Collection Listing",
        emoji: "📋",
        actions: [
            { id: "create", label: "Create (Add)", topic: "COLLECTION_LISTINGS_ADD" },
            { id: "update", label: "Update", topic: "COLLECTION_LISTINGS_UPDATE" },
            { id: "delete", label: "Remove", topic: "COLLECTION_LISTINGS_REMOVE" },
        ],
    },
    {
        resourceName: "Collection Publication",
        emoji: "🌐",
        actions: [
            { id: "create", label: "Create", topic: "COLLECTION_PUBLICATIONS_CREATE" },
            { id: "update", label: "Update", topic: "COLLECTION_PUBLICATIONS_UPDATE" },
            { id: "delete", label: "Remove", topic: "COLLECTION_PUBLICATIONS_DELETE" },
        ],
    },
    {
        resourceName: "Company",
        emoji: "🏢",
        actions: [
            { id: "create", label: "Create", topic: "COMPANIES_CREATE" },
            { id: "update", label: "Update", topic: "COMPANIES_UPDATE" },
            { id: "delete", label: "Remove", topic: "COMPANIES_DELETE" },
        ],
    },
    {
        resourceName: "Company Contact",
        emoji: "📞",
        actions: [
            { id: "create", label: "Create", topic: "COMPANY_CONTACTS_CREATE" },
            { id: "update", label: "Update", topic: "COMPANY_CONTACTS_UPDATE" },
            { id: "delete", label: "Remove", topic: "COMPANY_CONTACTS_DELETE" },
        ],
    },
    {
        resourceName: "Company Contact Role",
        emoji: "🎖️",
        actions: [
            { id: "create", label: "Create (Assign)", topic: "COMPANY_CONTACT_ROLES_ASSIGN" },
            { id: "delete", label: "Remove (Revoke)", topic: "COMPANY_CONTACT_ROLES_REVOKE" },
        ],
    },
    {
        resourceName: "Company Location",
        emoji: "📍",
        actions: [
            { id: "create", label: "Create", topic: "COMPANY_LOCATIONS_CREATE" },
            { id: "update", label: "Update", topic: "COMPANY_LOCATIONS_UPDATE" },
            { id: "delete", label: "Remove", topic: "COMPANY_LOCATIONS_DELETE" },
        ],
    },
    {
        resourceName: "Customer Group",
        emoji: "👥",
        actions: [
            { id: "create", label: "Create", topic: "CUSTOMER_GROUPS_CREATE" },
            { id: "update", label: "Update", topic: "CUSTOMER_GROUPS_UPDATE" },
            { id: "delete", label: "Remove", topic: "CUSTOMER_GROUPS_DELETE" },
        ],
    },
    {
        resourceName: "Customer Account Settings",
        emoji: "🔧",
        actions: [
            { id: "update", label: "Update", topic: "CUSTOMER_ACCOUNT_SETTINGS_UPDATE" },
        ],
    },
    {
        resourceName: "Customer Marketing Consent",
        emoji: "📧",
        actions: [
            { id: "update", label: "Update", topic: "CUSTOMERS_MARKETING_CONSENT_UPDATE" },
        ],
    },
    {
        resourceName: "Discount",
        emoji: "🏷️",
        actions: [
            { id: "create", label: "Create", topic: "DISCOUNTS_CREATE" },
            { id: "update", label: "Update", topic: "DISCOUNTS_UPDATE" },
            { id: "delete", label: "Remove", topic: "DISCOUNTS_DELETE" },
            { id: "code_added", label: "Redeem Code Added", topic: "DISCOUNTS_REDEEMCODE_ADDED" },
            { id: "code_removed", label: "Redeem Code Removed", topic: "DISCOUNTS_REDEEMCODE_REMOVED" },
        ],
    },
    {
        resourceName: "Domain",
        emoji: "🌍",
        actions: [
            { id: "create", label: "Create", topic: "DOMAINS_CREATE" },
            { id: "update", label: "Update", topic: "DOMAINS_UPDATE" },
            { id: "delete", label: "Remove (Destroy)", topic: "DOMAINS_DESTROY" },
        ],
    },
    {
        resourceName: "Fulfillment",
        emoji: "📦",
        actions: [
            { id: "create", label: "Create", topic: "FULFILLMENTS_CREATE" },
            { id: "update", label: "Update", topic: "FULFILLMENTS_UPDATE" },
        ],
    },
    {
        resourceName: "Fulfillment Event",
        emoji: "🔔",
        actions: [
            { id: "create", label: "Create", topic: "FULFILLMENT_EVENTS_CREATE" },
            { id: "delete", label: "Remove", topic: "FULFILLMENT_EVENTS_DELETE" },
        ],
    },
    {
        resourceName: "Fulfillment Hold",
        emoji: "⏸️",
        actions: [
            { id: "create", label: "Added", topic: "FULFILLMENT_HOLDS_ADDED" },
            { id: "delete", label: "Released", topic: "FULFILLMENT_HOLDS_RELEASED" },
        ],
    },
    {
        resourceName: "Fulfillment Order",
        emoji: "📬",
        actions: [
            { id: "cancelled", label: "Cancelled", topic: "FULFILLMENT_ORDERS_CANCELLED" },
            { id: "placed_on_hold", label: "Placed On Hold", topic: "FULFILLMENT_ORDERS_PLACED_ON_HOLD" },
            { id: "hold_released", label: "Hold Released", topic: "FULFILLMENT_ORDERS_HOLD_RELEASED" },
            { id: "rescheduled", label: "Rescheduled", topic: "FULFILLMENT_ORDERS_RESCHEDULED" },
            { id: "moved", label: "Moved", topic: "FULFILLMENT_ORDERS_MOVED" },
            { id: "merged", label: "Merged", topic: "FULFILLMENT_ORDERS_MERGED" },
            { id: "split", label: "Split", topic: "FULFILLMENT_ORDERS_SPLIT" },
        ],
    },
    {
        resourceName: "Inventory Item",
        emoji: "🗄️",
        actions: [
            { id: "create", label: "Create", topic: "INVENTORY_ITEMS_CREATE" },
            { id: "update", label: "Update", topic: "INVENTORY_ITEMS_UPDATE" },
            { id: "delete", label: "Remove", topic: "INVENTORY_ITEMS_DELETE" },
        ],
    },
    {
        resourceName: "Inventory Level",
        emoji: "📊",
        actions: [
            { id: "create", label: "Create (Connect)", topic: "INVENTORY_LEVELS_CONNECT" },
            { id: "update", label: "Update", topic: "INVENTORY_LEVELS_UPDATE" },
            { id: "delete", label: "Remove (Disconnect)", topic: "INVENTORY_LEVELS_DISCONNECT" },
        ],
    },
    {
        resourceName: "Locale",
        emoji: "🌐",
        actions: [
            { id: "create", label: "Create", topic: "LOCALES_CREATE" },
            { id: "update", label: "Update", topic: "LOCALES_UPDATE" },
            { id: "delete", label: "Remove (Destroy)", topic: "LOCALES_DESTROY" },
        ],
    },
    {
        resourceName: "Location",
        emoji: "🏪",
        actions: [
            { id: "create", label: "Create", topic: "LOCATIONS_CREATE" },
            { id: "update", label: "Update", topic: "LOCATIONS_UPDATE" },
            { id: "delete", label: "Remove", topic: "LOCATIONS_DELETE" },
            { id: "activate", label: "Activate", topic: "LOCATIONS_ACTIVATE" },
            { id: "deactivate", label: "Deactivate", topic: "LOCATIONS_DEACTIVATE" },
        ],
    },
    {
        resourceName: "Market",
        emoji: "🛍️",
        actions: [
            { id: "create", label: "Create", topic: "MARKETS_CREATE" },
            { id: "update", label: "Update", topic: "MARKETS_UPDATE" },
            { id: "delete", label: "Remove", topic: "MARKETS_DELETE" },
        ],
    },
    {
        resourceName: "Metafield Definition",
        emoji: "🏷️",
        actions: [
            { id: "create", label: "Create", topic: "METAFIELD_DEFINITIONS_CREATE" },
            { id: "update", label: "Update", topic: "METAFIELD_DEFINITIONS_UPDATE" },
            { id: "delete", label: "Remove", topic: "METAFIELD_DEFINITIONS_DELETE" },
        ],
    },
    {
        resourceName: "Order Transaction",
        emoji: "💸",
        actions: [
            { id: "create", label: "Create", topic: "ORDER_TRANSACTIONS_CREATE" },
        ],
    },
    {
        resourceName: "Payment Terms",
        emoji: "📃",
        actions: [
            { id: "create", label: "Create", topic: "PAYMENT_TERMS_CREATE" },
            { id: "update", label: "Update", topic: "PAYMENT_TERMS_UPDATE" },
            { id: "delete", label: "Remove", topic: "PAYMENT_TERMS_DELETE" },
        ],
    },
    {
        resourceName: "Product Listing",
        emoji: "📋",
        actions: [
            { id: "create", label: "Create (Add)", topic: "PRODUCT_LISTINGS_ADD" },
            { id: "update", label: "Update", topic: "PRODUCT_LISTINGS_UPDATE" },
            { id: "delete", label: "Remove", topic: "PRODUCT_LISTINGS_REMOVE" },
        ],
    },
    {
        resourceName: "Product Publication",
        emoji: "🌐",
        actions: [
            { id: "create", label: "Create", topic: "PRODUCT_PUBLICATIONS_CREATE" },
            { id: "update", label: "Update", topic: "PRODUCT_PUBLICATIONS_UPDATE" },
            { id: "delete", label: "Remove", topic: "PRODUCT_PUBLICATIONS_DELETE" },
        ],
    },
    {
        resourceName: "Product Variant",
        emoji: "🎨",
        actions: [
            { id: "in_stock", label: "In Stock", topic: "VARIANTS_IN_STOCK" },
            { id: "out_of_stock", label: "Out Of Stock", topic: "VARIANTS_OUT_OF_STOCK" },
        ],
    },
    {
        resourceName: "Delivery Profile",
        emoji: "🚚",
        actions: [
            { id: "create", label: "Create", topic: "PROFILES_CREATE" },
            { id: "update", label: "Update", topic: "PROFILES_UPDATE" },
            { id: "delete", label: "Remove", topic: "PROFILES_DELETE" },
        ],
    },
    {
        resourceName: "Delivery Promise Settings",
        emoji: "🕐",
        actions: [
            { id: "update", label: "Update", topic: "DELIVERY_PROMISE_SETTINGS_UPDATE" },
        ],
    },
    {
        resourceName: "Refund",
        emoji: "↩️",
        actions: [
            { id: "create", label: "Create", topic: "REFUNDS_CREATE" },
        ],
    },
    {
        resourceName: "Return",
        emoji: "📤",
        actions: [
            { id: "create", label: "Create (Request)", topic: "RETURNS_REQUEST" },
            { id: "update", label: "Update", topic: "RETURNS_UPDATE" },
            { id: "delete", label: "Close", topic: "RETURNS_CLOSE" },
            { id: "approve", label: "Approve", topic: "RETURNS_APPROVE" },
            { id: "decline", label: "Decline", topic: "RETURNS_DECLINE" },
            { id: "cancel", label: "Cancel", topic: "RETURNS_CANCEL" },
            { id: "reopen", label: "Reopen", topic: "RETURNS_REOPEN" },
        ],
    },
    {
        resourceName: "Reverse Delivery",
        emoji: "🔁",
        actions: [
            { id: "create", label: "Attach Deliverable", topic: "REVERSE_DELIVERIES_ATTACH_DELIVERABLE" },
        ],
    },
    {
        resourceName: "Reverse Fulfillment Order",
        emoji: "↩️",
        actions: [
            { id: "delete", label: "Dispose", topic: "REVERSE_FULFILLMENT_ORDERS_DISPOSE" },
        ],
    },
    {
        resourceName: "Segment",
        emoji: "🎯",
        actions: [
            { id: "create", label: "Create", topic: "SEGMENTS_CREATE" },
            { id: "update", label: "Update", topic: "SEGMENTS_UPDATE" },
            { id: "delete", label: "Remove", topic: "SEGMENTS_DELETE" },
        ],
    },
    {
        resourceName: "Selling Plan Group",
        emoji: "📆",
        actions: [
            { id: "create", label: "Create", topic: "SELLING_PLAN_GROUPS_CREATE" },
            { id: "update", label: "Update", topic: "SELLING_PLAN_GROUPS_UPDATE" },
            { id: "delete", label: "Remove", topic: "SELLING_PLAN_GROUPS_DELETE" },
        ],
    },
    {
        resourceName: "Shop",
        emoji: "🏪",
        actions: [
            { id: "update", label: "Update", topic: "SHOP_UPDATE" },
        ],
    },
    {
        resourceName: "Tender Transaction",
        emoji: "💵",
        actions: [
            { id: "create", label: "Create", topic: "TENDER_TRANSACTIONS_CREATE" },
        ],
    },
    {
        resourceName: "Theme",
        emoji: "🎨",
        actions: [
            { id: "create", label: "Create", topic: "THEMES_CREATE" },
            { id: "update", label: "Update", topic: "THEMES_UPDATE" },
            { id: "delete", label: "Remove", topic: "THEMES_DELETE" },
            { id: "publish", label: "Publish", topic: "THEMES_PUBLISH" },
        ],
    },
    {
        resourceName: "Cart",
        emoji: "🛒",
        actions: [
            { id: "create", label: "Create", topic: "CARTS_CREATE" },
            { id: "update", label: "Update", topic: "CARTS_UPDATE" },
        ],
    },
    {
        resourceName: "Channel",
        emoji: "📡",
        actions: [
            { id: "delete", label: "Remove", topic: "CHANNELS_DELETE" },
        ],
    },
    {
        resourceName: "Checkout",
        emoji: "💰",
        actions: [
            { id: "create", label: "Create", topic: "CHECKOUTS_CREATE" },
            { id: "update", label: "Update", topic: "CHECKOUTS_UPDATE" },
            { id: "delete", label: "Remove", topic: "CHECKOUTS_DELETE" },
        ],
    },
];

// Set of all topic enums managed by the dynamic manager
export const ALL_MANAGED_TOPICS = new Set<string>();
for (const res of RESOURCE_WEBHOOK_CONFIGS) {
    for (const act of res.actions) {
        ALL_MANAGED_TOPICS.add(act.topic);
    }
}
