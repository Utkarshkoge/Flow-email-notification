/**
 * Webhook Actor Resolver
 * ─────────────────────
 * Detects WHO triggered a Shopify webhook using the Admin GraphQL Events API.
 *
 * Returns a simple string:
 *   - Staff name   (if attributeToUser)
 *   - App name     (if attributeToApp)
 *   - "Don't Know" (fallback)
 */

// ── Types ──────────────────────────────────────────────────────────────────

interface ResolveOptions {
    admin: {
        graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
    } | null | undefined;
    topic: string;
    adminGraphqlId?: string | null;
    timestamp?: string | null;
}

// ── Subject Type Map ───────────────────────────────────────────────────────

const SUBJECT_TYPE: Record<string, string> = {
    products: "PRODUCT",
    collections: "COLLECTION",
    orders: "ORDER",
    draft_orders: "DRAFT_ORDER",
    customers: "CUSTOMER",
    customer_groups: "CUSTOMER_SAVED_SEARCH",
    refunds: "REFUND",
    fulfillments: "FULFILLMENT",
    inventory_items: "INVENTORY_ITEM",
    inventory_levels: "INVENTORY_LEVEL",
    locations: "LOCATION",
    themes: "THEME",
    discounts: "PRICE_RULE",
    selling_plan_groups: "SELLING_PLAN_GROUP",
    markets: "MARKET",
    companies: "COMPANY",
    company_contacts: "COMPANY_CONTACT",
    company_locations: "COMPANY_LOCATION",
    segments: "SEGMENT",
    metafield_definitions: "METAFIELD_DEFINITION",
    metaobjects: "METAOBJECT",
    profiles: "DELIVERY_PROFILE",
    variants: "PRODUCT_VARIANT",
    checkouts: "CHECKOUT",
};

// ── Action Map ─────────────────────────────────────────────────────────────

const ACTION: Record<string, string> = {
    create: "create",
    created: "create",
    update: "update",
    updated: "update",
    delete: "destroy",
    deleted: "destroy",
    destroy: "destroy",
    publish: "published",
    published: "published",
    unpublished: "unpublished",
};

// ── GraphQL Query ──────────────────────────────────────────────────────────

const EVENTS_QUERY = /* GraphQL */ `
    query EventsAroundTime($query: String!, $first: Int!) {
        events(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
            nodes {
                createdAt
                ... on BasicEvent {
                    action
                    author
                    appTitle
                    attributeToUser
                    attributeToApp
                }
            }
        }
    }
`;

// ── Helpers ────────────────────────────────────────────────────────────────

function parseTopic(topic: string): { prefix: string; suffix: string } {
    const normalized = topic.toLowerCase().replace(/\//g, "_");
    const segments = normalized.split("_");

    // Find known action suffix from the end
    for (let i = segments.length - 1; i >= 1; i--) {
        const candidate = segments.slice(i).join("_");
        if (ACTION[candidate]) {
            return { prefix: segments.slice(0, i).join("_"), suffix: candidate };
        }
    }

    return { prefix: segments.slice(0, -1).join("_"), suffix: segments[segments.length - 1] };
}

function buildQuery(topic: string, timestamp: string | null | undefined): string {
    const { prefix, suffix } = parseTopic(topic);
    const parts: string[] = [];

    // ±60-second time window
    if (timestamp) {
        try {
            const t = new Date(timestamp);
            if (!isNaN(t.getTime())) {
                const start = new Date(t.getTime() - 60_000).toISOString();
                const end = new Date(t.getTime() + 60_000).toISOString();
                parts.push(`created_at:>='${start}' AND created_at:<='${end}'`);
            }
        } catch { /* ignore */ }
    }

    // subject_type
    const st = SUBJECT_TYPE[prefix];
    if (st) parts.push(`subject_type:'${st}'`);

    // action (NOT verb)
    const act = ACTION[suffix];
    if (act) parts.push(`action:'${act}'`);

    return parts.join(" AND ");
}

// ── Main Export ────────────────────────────────────────────────────────────

export async function resolveWebhookActor({ admin, topic, adminGraphqlId, timestamp }: ResolveOptions): Promise<string> {
    if (!admin) {
        console.warn(`[WebhookActorResolver] ⚠️ No admin client for topic=${topic}`);
        return "Don't Know";
    }

    try {
        const q = buildQuery(topic, timestamp);
        const res = await admin.graphql(EVENTS_QUERY, { variables: { query: q, first: 5 } });

        const json = (await res.json()) as {
            data?: {
                events?: {
                    nodes?: Array<{
                        createdAt: string;
                        action?: string;
                        author?: string | null;
                        appTitle?: string | null;
                        attributeToUser?: boolean;
                        attributeToApp?: boolean;
                    }>;
                };
            };
            errors?: Array<{ message: string }>;
        };

        if (json.errors?.length) {
            console.error(`[WebhookActorResolver] ❌ GraphQL errors:`, json.errors.map(e => e.message).join(", "));
            return "Don't Know";
        }

        const nodes = json.data?.events?.nodes ?? [];

        if (nodes.length === 0) {
            console.warn(`[WebhookActorResolver] ⚠️ No events found for topic=${topic}`);
            return "Don't Know";
        }

        const event = nodes[0];

        if (event.attributeToUser && event.author) {
            return event.author;
        }

        if (event.attributeToApp && event.appTitle) {
            return event.appTitle;
        }

        console.warn(`[WebhookActorResolver] ⚠️ Event found but no author/appTitle`);
        return "Don't Know";
    } catch (error) {
        console.error(`[WebhookActorResolver] ❌ Error:`, error);
        return "Don't Know";
    }
}
