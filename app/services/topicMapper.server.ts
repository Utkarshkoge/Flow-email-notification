/**
 * Topic Mapper
 * ────────────
 * Maps all Shopify webhook topics to structured resource types and event actions.
 * Supports both normalized (PRODUCTS_CREATE) and REST-style (products/create) formats.
 */

// ── Types ──

export type ResourceType =
    | "Bulk Operation"
    | "Cart"
    | "Channel"
    | "Checkout"
    | "Collection"
    | "Collection Listing"
    | "Collection Publication"
    | "Company"
    | "Company Contact"
    | "Company Contact Role"
    | "Company Location"
    | "Customer"
    | "Customer Account Settings"
    | "Customer Group"
    | "Customer Marketing Consent"
    | "Customer Segment"
    | "Delivery Profile"
    | "Delivery Promise Settings"
    | "Discount"
    | "Domain"
    | "Draft Order"
    | "Fulfillment"
    | "Fulfillment Event"
    | "Fulfillment Hold"
    | "Fulfillment Order"
    | "Inventory Item"
    | "Inventory Level"
    | "Locale"
    | "Location"
    | "Market"
    | "Metafield Definition"
    | "Metaobject"
    | "Order"
    | "Order Transaction"
    | "Payment Schedule"
    | "Payment Terms"
    | "Product"
    | "Product Feed"
    | "Product Listing"
    | "Product Publication"
    | "Product Variant"
    | "Refund"
    | "Return"
    | "Reverse Delivery"
    | "Reverse Fulfillment Order"
    | "Segment"
    | "Selling Plan Group"
    | "Shipping Address"
    | "Shop"
    | "Subscription Billing Attempt"
    | "Subscription Billing Cycle"
    | "Subscription Contract"
    | "Tax Service"
    | "Tender Transaction"
    | "Theme";

export type EventAction =
    | "Created"
    | "Updated"
    | "Deleted"
    | "Enabled"
    | "Disabled"
    | "Cancelled"
    | "Fulfilled"
    | "Paid"
    | "Partially Fulfilled"
    | "Edited"
    | "Approved"
    | "Declined"
    | "Closed"
    | "Reopened"
    | "Requested"
    | "Processed"
    | "Activated"
    | "Deactivated"
    | "Published"
    | "Uninstalled"
    | "Moved"
    | "Merged"
    | "Split"
    | "Rescheduled"
    | "Assigned"
    | "Revoked"
    | "Connected"
    | "Disconnected"
    | "Finished"
    | "Added"
    | "Removed"
    | "Destroyed"
    | "Challenged"
    | "Failed"
    | "Succeeded"
    | "Skipped"
    | "Unskipped"
    | "Expired"
    | "Paused"
    | "Placed On Hold"
    | "Hold Released"
    | "Scopes Updated"
    | "Link Requested"
    | "Risk Assessment Changed"
    | "Protect Eligibility Changed"
    | "Routing Complete"
    | "Ready"
    | "Joined Segment"
    | "Left Segment"
    | "Tags Added"
    | "Tags Removed"
    | "Purchasing Summary"
    | "Attach Deliverable"
    | "Disposed"
    | "In Stock"
    | "Out Of Stock"
    | "Incremental Sync"
    | "Full Sync";

export interface TopicInfo {
    resourceType: ResourceType;
    eventAction: EventAction;
    category: string;
}

// ── Topic → Info Mapping ──

const TOPIC_MAP: Record<string, TopicInfo> = {
    // ── Bulk Operations ──
    BULK_OPERATIONS_FINISH: { resourceType: "Bulk Operation", eventAction: "Finished", category: "bulk_operations" },

    // ── Carts ──
    CARTS_CREATE: { resourceType: "Cart", eventAction: "Created", category: "carts" },
    CARTS_UPDATE: { resourceType: "Cart", eventAction: "Updated", category: "carts" },

    // ── Channels ──
    CHANNELS_DELETE: { resourceType: "Channel", eventAction: "Deleted", category: "channels" },

    // ── Checkouts ──
    CHECKOUTS_CREATE: { resourceType: "Checkout", eventAction: "Created", category: "checkouts" },
    CHECKOUTS_DELETE: { resourceType: "Checkout", eventAction: "Deleted", category: "checkouts" },
    CHECKOUTS_UPDATE: { resourceType: "Checkout", eventAction: "Updated", category: "checkouts" },

    // ── Collection Listings ──
    COLLECTION_LISTINGS_ADD: { resourceType: "Collection Listing", eventAction: "Added", category: "collection_listings" },
    COLLECTION_LISTINGS_REMOVE: { resourceType: "Collection Listing", eventAction: "Removed", category: "collection_listings" },
    COLLECTION_LISTINGS_UPDATE: { resourceType: "Collection Listing", eventAction: "Updated", category: "collection_listings" },

    // ── Collection Publications ──
    COLLECTION_PUBLICATIONS_CREATE: { resourceType: "Collection Publication", eventAction: "Created", category: "collection_publications" },
    COLLECTION_PUBLICATIONS_DELETE: { resourceType: "Collection Publication", eventAction: "Deleted", category: "collection_publications" },
    COLLECTION_PUBLICATIONS_UPDATE: { resourceType: "Collection Publication", eventAction: "Updated", category: "collection_publications" },

    // ── Collections ──
    COLLECTIONS_CREATE: { resourceType: "Collection", eventAction: "Created", category: "collections" },
    COLLECTIONS_DELETE: { resourceType: "Collection", eventAction: "Deleted", category: "collections" },
    COLLECTIONS_UPDATE: { resourceType: "Collection", eventAction: "Updated", category: "collections" },

    // ── Companies (B2B) ──
    COMPANIES_CREATE: { resourceType: "Company", eventAction: "Created", category: "companies" },
    COMPANIES_DELETE: { resourceType: "Company", eventAction: "Deleted", category: "companies" },
    COMPANIES_UPDATE: { resourceType: "Company", eventAction: "Updated", category: "companies" },

    // ── Company Contact Roles ──
    COMPANY_CONTACT_ROLES_ASSIGN: { resourceType: "Company Contact Role", eventAction: "Assigned", category: "company_contact_roles" },
    COMPANY_CONTACT_ROLES_REVOKE: { resourceType: "Company Contact Role", eventAction: "Revoked", category: "company_contact_roles" },

    // ── Company Contacts ──
    COMPANY_CONTACTS_CREATE: { resourceType: "Company Contact", eventAction: "Created", category: "company_contacts" },
    COMPANY_CONTACTS_DELETE: { resourceType: "Company Contact", eventAction: "Deleted", category: "company_contacts" },
    COMPANY_CONTACTS_UPDATE: { resourceType: "Company Contact", eventAction: "Updated", category: "company_contacts" },

    // ── Company Locations ──
    COMPANY_LOCATIONS_CREATE: { resourceType: "Company Location", eventAction: "Created", category: "company_locations" },
    COMPANY_LOCATIONS_DELETE: { resourceType: "Company Location", eventAction: "Deleted", category: "company_locations" },
    COMPANY_LOCATIONS_UPDATE: { resourceType: "Company Location", eventAction: "Updated", category: "company_locations" },

    // ── Customer Account Settings ──
    CUSTOMER_ACCOUNT_SETTINGS_UPDATE: { resourceType: "Customer Account Settings", eventAction: "Updated", category: "customer_account_settings" },

    // ── Customer Groups ──
    CUSTOMER_GROUPS_CREATE: { resourceType: "Customer Group", eventAction: "Created", category: "customer_groups" },
    CUSTOMER_GROUPS_DELETE: { resourceType: "Customer Group", eventAction: "Deleted", category: "customer_groups" },
    CUSTOMER_GROUPS_UPDATE: { resourceType: "Customer Group", eventAction: "Updated", category: "customer_groups" },

    // ── Customers ──
    CUSTOMERS_CREATE: { resourceType: "Customer", eventAction: "Created", category: "customers" },
    CUSTOMERS_DELETE: { resourceType: "Customer", eventAction: "Deleted", category: "customers" },
    CUSTOMERS_DISABLE: { resourceType: "Customer", eventAction: "Disabled", category: "customers" },
    CUSTOMERS_ENABLE: { resourceType: "Customer", eventAction: "Enabled", category: "customers" },
    CUSTOMERS_MERGE: { resourceType: "Customer", eventAction: "Merged", category: "customers" },
    CUSTOMERS_UPDATE: { resourceType: "Customer", eventAction: "Updated", category: "customers" },
    CUSTOMERS_PURCHASING_SUMMARY: { resourceType: "Customer", eventAction: "Purchasing Summary", category: "customers" },
    CUSTOMERS_EMAIL_MARKETING_CONSENT_UPDATE: { resourceType: "Customer Marketing Consent", eventAction: "Updated", category: "customers" },
    CUSTOMERS_MARKETING_CONSENT_UPDATE: { resourceType: "Customer Marketing Consent", eventAction: "Updated", category: "customers" },
    // dot-separated topics (customer.joined_segment etc.)
    "CUSTOMER.JOINED_SEGMENT": { resourceType: "Customer Segment", eventAction: "Joined Segment", category: "customers" },
    "CUSTOMER.LEFT_SEGMENT": { resourceType: "Customer Segment", eventAction: "Left Segment", category: "customers" },
    "CUSTOMER.TAGS_ADDED": { resourceType: "Customer", eventAction: "Tags Added", category: "customers" },
    "CUSTOMER.TAGS_REMOVED": { resourceType: "Customer", eventAction: "Tags Removed", category: "customers" },

    // ── Delivery ──
    DELIVERY_PROMISE_SETTINGS_UPDATE: { resourceType: "Delivery Promise Settings", eventAction: "Updated", category: "delivery" },

    // ── Discounts ──
    DISCOUNTS_CREATE: { resourceType: "Discount", eventAction: "Created", category: "discounts" },
    DISCOUNTS_DELETE: { resourceType: "Discount", eventAction: "Deleted", category: "discounts" },
    DISCOUNTS_REDEEMCODE_ADDED: { resourceType: "Discount", eventAction: "Added", category: "discounts" },
    DISCOUNTS_REDEEMCODE_REMOVED: { resourceType: "Discount", eventAction: "Removed", category: "discounts" },
    DISCOUNTS_UPDATE: { resourceType: "Discount", eventAction: "Updated", category: "discounts" },

    // ── Domains ──
    DOMAINS_CREATE: { resourceType: "Domain", eventAction: "Created", category: "domains" },
    DOMAINS_DESTROY: { resourceType: "Domain", eventAction: "Deleted", category: "domains" },
    DOMAINS_UPDATE: { resourceType: "Domain", eventAction: "Updated", category: "domains" },

    // ── Draft Orders ──
    DRAFT_ORDERS_CREATE: { resourceType: "Draft Order", eventAction: "Created", category: "draft_orders" },
    DRAFT_ORDERS_DELETE: { resourceType: "Draft Order", eventAction: "Deleted", category: "draft_orders" },
    DRAFT_ORDERS_UPDATE: { resourceType: "Draft Order", eventAction: "Updated", category: "draft_orders" },

    // ── Fulfillment Events ──
    FULFILLMENT_EVENTS_CREATE: { resourceType: "Fulfillment Event", eventAction: "Created", category: "fulfillment_events" },
    FULFILLMENT_EVENTS_DELETE: { resourceType: "Fulfillment Event", eventAction: "Deleted", category: "fulfillment_events" },

    // ── Fulfillment Holds ──
    FULFILLMENT_HOLDS_ADDED: { resourceType: "Fulfillment Hold", eventAction: "Added", category: "fulfillment_holds" },
    FULFILLMENT_HOLDS_RELEASED: { resourceType: "Fulfillment Hold", eventAction: "Hold Released", category: "fulfillment_holds" },

    // ── Fulfillment Orders ──
    FULFILLMENT_ORDERS_CANCELLATION_REQUEST_ACCEPTED: { resourceType: "Fulfillment Order", eventAction: "Approved", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_CANCELLATION_REQUEST_REJECTED: { resourceType: "Fulfillment Order", eventAction: "Declined", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_CANCELLATION_REQUEST_SUBMITTED: { resourceType: "Fulfillment Order", eventAction: "Requested", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_CANCELLED: { resourceType: "Fulfillment Order", eventAction: "Cancelled", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_FULFILLMENT_REQUEST_ACCEPTED: { resourceType: "Fulfillment Order", eventAction: "Approved", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_FULFILLMENT_REQUEST_REJECTED: { resourceType: "Fulfillment Order", eventAction: "Declined", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_FULFILLMENT_REQUEST_SUBMITTED: { resourceType: "Fulfillment Order", eventAction: "Requested", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_FULFILLMENT_SERVICE_FAILED_TO_COMPLETE: { resourceType: "Fulfillment Order", eventAction: "Failed", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_HOLD_RELEASED: { resourceType: "Fulfillment Order", eventAction: "Hold Released", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_LINE_ITEMS_PREPARED_FOR_LOCAL_DELIVERY: { resourceType: "Fulfillment Order", eventAction: "Ready", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_LINE_ITEMS_PREPARED_FOR_PICKUP: { resourceType: "Fulfillment Order", eventAction: "Ready", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_MERGED: { resourceType: "Fulfillment Order", eventAction: "Merged", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_MOVED: { resourceType: "Fulfillment Order", eventAction: "Moved", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_ORDER_ROUTING_COMPLETE: { resourceType: "Fulfillment Order", eventAction: "Routing Complete", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_PLACED_ON_HOLD: { resourceType: "Fulfillment Order", eventAction: "Placed On Hold", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_RESCHEDULED: { resourceType: "Fulfillment Order", eventAction: "Rescheduled", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_SCHEDULED_FULFILLMENT_ORDER_READY: { resourceType: "Fulfillment Order", eventAction: "Ready", category: "fulfillment_orders" },
    FULFILLMENT_ORDERS_SPLIT: { resourceType: "Fulfillment Order", eventAction: "Split", category: "fulfillment_orders" },

    // ── Fulfillments ──
    FULFILLMENTS_CREATE: { resourceType: "Fulfillment", eventAction: "Created", category: "fulfillments" },
    FULFILLMENTS_UPDATE: { resourceType: "Fulfillment", eventAction: "Updated", category: "fulfillments" },

    // ── Inventory Items ──
    INVENTORY_ITEMS_CREATE: { resourceType: "Inventory Item", eventAction: "Created", category: "inventory_items" },
    INVENTORY_ITEMS_DELETE: { resourceType: "Inventory Item", eventAction: "Deleted", category: "inventory_items" },
    INVENTORY_ITEMS_UPDATE: { resourceType: "Inventory Item", eventAction: "Updated", category: "inventory_items" },

    // ── Inventory Levels ──
    INVENTORY_LEVELS_CONNECT: { resourceType: "Inventory Level", eventAction: "Connected", category: "inventory_levels" },
    INVENTORY_LEVELS_DISCONNECT: { resourceType: "Inventory Level", eventAction: "Disconnected", category: "inventory_levels" },
    INVENTORY_LEVELS_UPDATE: { resourceType: "Inventory Level", eventAction: "Updated", category: "inventory_levels" },

    // ── Locales ──
    LOCALES_CREATE: { resourceType: "Locale", eventAction: "Created", category: "locales" },
    LOCALES_DESTROY: { resourceType: "Locale", eventAction: "Deleted", category: "locales" },
    LOCALES_UPDATE: { resourceType: "Locale", eventAction: "Updated", category: "locales" },

    // ── Locations ──
    LOCATIONS_ACTIVATE: { resourceType: "Location", eventAction: "Activated", category: "locations" },
    LOCATIONS_CREATE: { resourceType: "Location", eventAction: "Created", category: "locations" },
    LOCATIONS_DEACTIVATE: { resourceType: "Location", eventAction: "Deactivated", category: "locations" },
    LOCATIONS_DELETE: { resourceType: "Location", eventAction: "Deleted", category: "locations" },
    LOCATIONS_UPDATE: { resourceType: "Location", eventAction: "Updated", category: "locations" },

    // ── Markets ──
    MARKETS_CREATE: { resourceType: "Market", eventAction: "Created", category: "markets" },
    MARKETS_DELETE: { resourceType: "Market", eventAction: "Deleted", category: "markets" },
    MARKETS_UPDATE: { resourceType: "Market", eventAction: "Updated", category: "markets" },

    // ── Metafield Definitions ──
    METAFIELD_DEFINITIONS_CREATE: { resourceType: "Metafield Definition", eventAction: "Created", category: "metafield_definitions" },
    METAFIELD_DEFINITIONS_DELETE: { resourceType: "Metafield Definition", eventAction: "Deleted", category: "metafield_definitions" },
    METAFIELD_DEFINITIONS_UPDATE: { resourceType: "Metafield Definition", eventAction: "Updated", category: "metafield_definitions" },

    // ── Metaobjects ──
    METAOBJECTS_CREATE: { resourceType: "Metaobject", eventAction: "Created", category: "metaobjects" },
    METAOBJECTS_DELETE: { resourceType: "Metaobject", eventAction: "Deleted", category: "metaobjects" },
    METAOBJECTS_UPDATE: { resourceType: "Metaobject", eventAction: "Updated", category: "metaobjects" },

    // ── Orders ──
    ORDERS_CANCELLED: { resourceType: "Order", eventAction: "Cancelled", category: "orders" },
    ORDERS_CREATE: { resourceType: "Order", eventAction: "Created", category: "orders" },
    ORDERS_DELETE: { resourceType: "Order", eventAction: "Deleted", category: "orders" },
    ORDERS_EDITED: { resourceType: "Order", eventAction: "Edited", category: "orders" },
    ORDERS_FULFILLED: { resourceType: "Order", eventAction: "Fulfilled", category: "orders" },
    ORDERS_LINK_REQUESTED: { resourceType: "Order", eventAction: "Link Requested", category: "orders" },
    ORDERS_PAID: { resourceType: "Order", eventAction: "Paid", category: "orders" },
    ORDERS_PARTIALLY_FULFILLED: { resourceType: "Order", eventAction: "Partially Fulfilled", category: "orders" },
    ORDERS_RISK_ASSESSMENT_CHANGED: { resourceType: "Order", eventAction: "Risk Assessment Changed", category: "orders" },
    ORDERS_SHOPIFY_PROTECT_ELIGIBILITY_CHANGED: { resourceType: "Order", eventAction: "Protect Eligibility Changed", category: "orders" },
    ORDERS_UPDATED: { resourceType: "Order", eventAction: "Updated", category: "orders" },
    // Legacy REST-style aliases
    ORDERS_UPDATE: { resourceType: "Order", eventAction: "Updated", category: "orders" },

    // ── Order Transactions ──
    ORDER_TRANSACTIONS_CREATE: { resourceType: "Order Transaction", eventAction: "Created", category: "order_transactions" },

    // ── Payment Terms ──
    PAYMENT_SCHEDULES_DUE: { resourceType: "Payment Schedule", eventAction: "Ready", category: "payment_terms" },
    PAYMENT_TERMS_CREATE: { resourceType: "Payment Terms", eventAction: "Created", category: "payment_terms" },
    PAYMENT_TERMS_DELETE: { resourceType: "Payment Terms", eventAction: "Deleted", category: "payment_terms" },
    PAYMENT_TERMS_UPDATE: { resourceType: "Payment Terms", eventAction: "Updated", category: "payment_terms" },

    // ── Product Feeds ──
    PRODUCT_FEEDS_CREATE: { resourceType: "Product Feed", eventAction: "Created", category: "product_feeds" },
    PRODUCT_FEEDS_FULL_SYNC: { resourceType: "Product Feed", eventAction: "Full Sync", category: "product_feeds" },
    PRODUCT_FEEDS_INCREMENTAL_SYNC: { resourceType: "Product Feed", eventAction: "Incremental Sync", category: "product_feeds" },
    PRODUCT_FEEDS_UPDATE: { resourceType: "Product Feed", eventAction: "Updated", category: "product_feeds" },

    // ── Product Listings ──
    PRODUCT_LISTINGS_ADD: { resourceType: "Product Listing", eventAction: "Added", category: "product_listings" },
    PRODUCT_LISTINGS_REMOVE: { resourceType: "Product Listing", eventAction: "Removed", category: "product_listings" },
    PRODUCT_LISTINGS_UPDATE: { resourceType: "Product Listing", eventAction: "Updated", category: "product_listings" },

    // ── Product Publications ──
    PRODUCT_PUBLICATIONS_CREATE: { resourceType: "Product Publication", eventAction: "Created", category: "product_publications" },
    PRODUCT_PUBLICATIONS_DELETE: { resourceType: "Product Publication", eventAction: "Deleted", category: "product_publications" },
    PRODUCT_PUBLICATIONS_UPDATE: { resourceType: "Product Publication", eventAction: "Updated", category: "product_publications" },

    // ── Products ──
    PRODUCTS_CREATE: { resourceType: "Product", eventAction: "Created", category: "products" },
    PRODUCTS_DELETE: { resourceType: "Product", eventAction: "Deleted", category: "products" },
    PRODUCTS_UPDATE: { resourceType: "Product", eventAction: "Updated", category: "products" },

    // ── Delivery Profiles ──
    PROFILES_CREATE: { resourceType: "Delivery Profile", eventAction: "Created", category: "profiles" },
    PROFILES_DELETE: { resourceType: "Delivery Profile", eventAction: "Deleted", category: "profiles" },
    PROFILES_UPDATE: { resourceType: "Delivery Profile", eventAction: "Updated", category: "profiles" },

    // ── Refunds ──
    REFUNDS_CREATE: { resourceType: "Refund", eventAction: "Created", category: "refunds" },

    // ── Returns ──
    RETURNS_APPROVE: { resourceType: "Return", eventAction: "Approved", category: "returns" },
    RETURNS_CANCEL: { resourceType: "Return", eventAction: "Cancelled", category: "returns" },
    RETURNS_CLOSE: { resourceType: "Return", eventAction: "Closed", category: "returns" },
    RETURNS_DECLINE: { resourceType: "Return", eventAction: "Declined", category: "returns" },
    RETURNS_PROCESS: { resourceType: "Return", eventAction: "Processed", category: "returns" },
    RETURNS_REOPEN: { resourceType: "Return", eventAction: "Reopened", category: "returns" },
    RETURNS_REQUEST: { resourceType: "Return", eventAction: "Requested", category: "returns" },
    RETURNS_UPDATE: { resourceType: "Return", eventAction: "Updated", category: "returns" },

    // ── Reverse Deliveries ──
    REVERSE_DELIVERIES_ATTACH_DELIVERABLE: { resourceType: "Reverse Delivery", eventAction: "Attach Deliverable", category: "reverse_deliveries" },

    // ── Reverse Fulfillment Orders ──
    REVERSE_FULFILLMENT_ORDERS_DISPOSE: { resourceType: "Reverse Fulfillment Order", eventAction: "Disposed", category: "reverse_fulfillment_orders" },

    // ── Segments ──
    SEGMENTS_CREATE: { resourceType: "Segment", eventAction: "Created", category: "segments" },
    SEGMENTS_DELETE: { resourceType: "Segment", eventAction: "Deleted", category: "segments" },
    SEGMENTS_UPDATE: { resourceType: "Segment", eventAction: "Updated", category: "segments" },

    // ── Selling Plan Groups ──
    SELLING_PLAN_GROUPS_CREATE: { resourceType: "Selling Plan Group", eventAction: "Created", category: "selling_plan_groups" },
    SELLING_PLAN_GROUPS_DELETE: { resourceType: "Selling Plan Group", eventAction: "Deleted", category: "selling_plan_groups" },
    SELLING_PLAN_GROUPS_UPDATE: { resourceType: "Selling Plan Group", eventAction: "Updated", category: "selling_plan_groups" },

    // ── Shipping ──
    SHIPPING_ADDRESSES_CREATE: { resourceType: "Shipping Address", eventAction: "Created", category: "shipping" },
    SHIPPING_ADDRESSES_UPDATE: { resourceType: "Shipping Address", eventAction: "Updated", category: "shipping" },

    // ── Shop ──
    SHOP_UPDATE: { resourceType: "Shop", eventAction: "Updated", category: "shop" },

    // ── Subscription Billing ──
    SUBSCRIPTION_BILLING_ATTEMPTS_CHALLENGED: { resourceType: "Subscription Billing Attempt", eventAction: "Challenged", category: "subscriptions" },
    SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE: { resourceType: "Subscription Billing Attempt", eventAction: "Failed", category: "subscriptions" },
    SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS: { resourceType: "Subscription Billing Attempt", eventAction: "Succeeded", category: "subscriptions" },
    SUBSCRIPTION_BILLING_CYCLE_EDITS_CREATE: { resourceType: "Subscription Billing Cycle", eventAction: "Created", category: "subscriptions" },
    SUBSCRIPTION_BILLING_CYCLE_EDITS_DELETE: { resourceType: "Subscription Billing Cycle", eventAction: "Deleted", category: "subscriptions" },
    SUBSCRIPTION_BILLING_CYCLE_EDITS_UPDATE: { resourceType: "Subscription Billing Cycle", eventAction: "Updated", category: "subscriptions" },
    SUBSCRIPTION_BILLING_CYCLES_SKIP: { resourceType: "Subscription Billing Cycle", eventAction: "Skipped", category: "subscriptions" },
    SUBSCRIPTION_BILLING_CYCLES_UNSKIP: { resourceType: "Subscription Billing Cycle", eventAction: "Unskipped", category: "subscriptions" },

    // ── Subscription Contracts ──
    SUBSCRIPTION_CONTRACTS_ACTIVATE: { resourceType: "Subscription Contract", eventAction: "Activated", category: "subscriptions" },
    SUBSCRIPTION_CONTRACTS_CANCEL: { resourceType: "Subscription Contract", eventAction: "Cancelled", category: "subscriptions" },
    SUBSCRIPTION_CONTRACTS_CREATE: { resourceType: "Subscription Contract", eventAction: "Created", category: "subscriptions" },
    SUBSCRIPTION_CONTRACTS_EXPIRE: { resourceType: "Subscription Contract", eventAction: "Expired", category: "subscriptions" },
    SUBSCRIPTION_CONTRACTS_FAIL: { resourceType: "Subscription Contract", eventAction: "Failed", category: "subscriptions" },
    SUBSCRIPTION_CONTRACTS_PAUSE: { resourceType: "Subscription Contract", eventAction: "Paused", category: "subscriptions" },
    SUBSCRIPTION_CONTRACTS_UPDATE: { resourceType: "Subscription Contract", eventAction: "Updated", category: "subscriptions" },

    // ── Tax Services ──
    TAX_SERVICES_CREATE: { resourceType: "Tax Service", eventAction: "Created", category: "tax_services" },
    TAX_SERVICES_UPDATE: { resourceType: "Tax Service", eventAction: "Updated", category: "tax_services" },

    // ── Tender Transactions ──
    TENDER_TRANSACTIONS_CREATE: { resourceType: "Tender Transaction", eventAction: "Created", category: "tender_transactions" },

    // ── Themes ──
    THEMES_CREATE: { resourceType: "Theme", eventAction: "Created", category: "themes" },
    THEMES_DELETE: { resourceType: "Theme", eventAction: "Deleted", category: "themes" },
    THEMES_PUBLISH: { resourceType: "Theme", eventAction: "Published", category: "themes" },
    THEMES_UPDATE: { resourceType: "Theme", eventAction: "Updated", category: "themes" },

    // ── Variants ──
    VARIANTS_IN_STOCK: { resourceType: "Product Variant", eventAction: "In Stock", category: "products" },
    VARIANTS_OUT_OF_STOCK: { resourceType: "Product Variant", eventAction: "Out Of Stock", category: "products" },
};

/**
 * Normalize a topic string to match TOPIC_MAP keys.
 * Handles:
 *   "products/create"      → "PRODUCTS_CREATE"
 *   "PRODUCTS_CREATE"      → "PRODUCTS_CREATE"
 *   "customer.joined_segment" → "CUSTOMER.JOINED_SEGMENT"
 */
function normalizeTopic(topic: string): string {
    // Handle dot-notation topics like "customer.joined_segment"
    if (topic.includes(".") && !topic.includes("/")) {
        return topic.toUpperCase();
    }
    // Handle REST-style slash topics → uppercase with underscores
    if (topic.includes("/")) {
        return topic.replace(/\//g, "_").toUpperCase();
    }
    return topic.toUpperCase();
}

/**
 * Resolve topic info (resource type, action, category) from a webhook topic string.
 * Returns null if the topic is not recognized (event still gets logged to DB).
 */
export function resolveTopicInfo(topic: string): TopicInfo | null {
    const normalized = normalizeTopic(topic);
    return TOPIC_MAP[normalized] || null;
}
