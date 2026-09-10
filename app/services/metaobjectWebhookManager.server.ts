/**
 * Metaobject Webhook Manager
 * ──────────────────────────
 * Automatically manages webhook subscriptions for metaobject types.
 *
 * Supports individual topic management:
 *  - METAOBJECTS_CREATE  (Creation)
 *  - METAOBJECTS_UPDATE  (Update)
 *  - METAOBJECTS_DELETE  (Removal)
 */

import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

// ── Types ──

export interface MetaobjectDefinition {
    id: string;
    name: string;
    type: string;
}

interface WebhookSubscriptionResult {
    webhookSubscription?: {
        id: string;
    };
    userErrors: Array<{
        field: string[];
        message: string;
    }>;
}

export type MetaobjectTopic = "METAOBJECTS_CREATE" | "METAOBJECTS_UPDATE" | "METAOBJECTS_DELETE";

export const METAOBJECT_TOPICS: MetaobjectTopic[] = [
    "METAOBJECTS_CREATE",
    "METAOBJECTS_UPDATE",
    "METAOBJECTS_DELETE",
];

export interface MetaobjectSubscriptionsMap {
    [type: string]: {
        create: boolean;
        update: boolean;
        delete: boolean;
        subscriptionIds: {
            create?: string;
            update?: string;
            delete?: string;
        };
    };
}

export interface SyncResult {
    success: boolean;
    subscriptionsCreated: number;
    subscriptionsSkipped: number;
    errors: string[];
    metaobjectTypes: string[];
}

// ── Main Functions ──

/**
 * Fetch all metaobject definitions from the store.
 */
export async function fetchMetaobjectDefinitions(
    admin: AdminApiContext
): Promise<MetaobjectDefinition[]> {
    const query = `
        query GetAllMetaobjectTypes {
            metaobjectDefinitions(first: 250, reverse: true) {
                nodes {
                    id
                    type
                    name
                    access {
                        admin
                        storefront
                    }
                }
            }
        }
    `;

    try {
        const response = await admin.graphql(query);
        const data: any = await response.json();

        if (data.errors) {
            console.error(`[MetaobjectWebhookManager] GraphQL errors:`, data.errors);
            return [];
        }

        const definitions = data.data?.metaobjectDefinitions?.nodes || [];
        return definitions;
    } catch (error) {
        console.error(`[MetaobjectWebhookManager] Failed to fetch definitions:`, error);
        return [];
    }
}

/**
 * Fetch detailed webhook subscriptions for all metaobjects.
 * Returns a map keyed by metaobject type with status for create, update, delete.
 */
export async function getDetailedMetaobjectSubscriptions(
    admin: AdminApiContext
): Promise<MetaobjectSubscriptionsMap> {
    const query = `
        query GetMetaobjectWebhooks {
            webhookSubscriptions(first: 250, topics: [METAOBJECTS_CREATE, METAOBJECTS_UPDATE, METAOBJECTS_DELETE]) {
                nodes {
                    id
                    topic
                    filter
                }
            }
        }
    `;

    const map: MetaobjectSubscriptionsMap = {};

    try {
        const response = await admin.graphql(query);
        const data: any = await response.json();

        if (data.data?.webhookSubscriptions?.nodes) {
            for (const sub of data.data.webhookSubscriptions.nodes) {
                if (sub.filter && sub.filter.startsWith("type:")) {
                    const type = sub.filter.replace("type:", "");

                    if (!map[type]) {
                        map[type] = {
                            create: false,
                            update: false,
                            delete: false,
                            subscriptionIds: {},
                        };
                    }

                    if (sub.topic === "METAOBJECTS_CREATE") {
                        map[type].create = true;
                        map[type].subscriptionIds.create = sub.id;
                    } else if (sub.topic === "METAOBJECTS_UPDATE") {
                        map[type].update = true;
                        map[type].subscriptionIds.update = sub.id;
                    } else if (sub.topic === "METAOBJECTS_DELETE") {
                        map[type].delete = true;
                        map[type].subscriptionIds.delete = sub.id;
                    }
                }
            }
        }
    } catch (error) {
        console.error("[MetaobjectWebhookManager] Failed to fetch detailed subscriptions:", error);
    }

    return map;
}

/**
 * Get a set of metaobject types that have active webhook subscriptions.
 */
export async function getMetaobjectWebhookSubscriptions(
    admin: AdminApiContext
): Promise<Set<string>> {
    const map = await getDetailedMetaobjectSubscriptions(admin);
    const set = new Set<string>();
    for (const [type, state] of Object.entries(map)) {
        if (state.create || state.update || state.delete) {
            set.add(type);
        }
    }
    return set;
}

/**
 * Subscribe to a specific topic for a metaobject type (Create, Update, or Delete).
 */
export async function subscribeToMetaobjectTopic(
    admin: AdminApiContext,
    shop: string,
    appUrl: string,
    definitionType: string,
    topic: MetaobjectTopic
): Promise<{ success: boolean; error?: string }> {
    if (!appUrl) {
        return { success: false, error: "SHOPIFY_APP_URL is missing." };
    }

    const cleanAppUrl = appUrl.trim().replace(/\/+$/, "");
    const callbackUrl = `${cleanAppUrl.replace("http://", "https://")}/webhooks/shopify`;
    const filter = `type:${definitionType}`;

    const res = await createWebhookSubscription(admin, topic, callbackUrl, filter);

    if (!res.id && res.userErrors.some((e) =>
        e.message.toLowerCase().includes("address for this topic has already been taken")
    )) {
        return { success: true };
    }

    if (!res.id && res.userErrors.length > 0) {
        return {
            success: false,
            error: res.userErrors.map((e) => e.message).join(", "),
        };
    }

    return { success: true };
}

/**
 * Unsubscribe from a specific topic for a metaobject type (Create, Update, or Delete).
 */
export async function unsubscribeFromMetaobjectTopic(
    admin: AdminApiContext,
    definitionType: string,
    topic: MetaobjectTopic
): Promise<{ success: boolean; error?: string }> {
    const query = `
        query GetMetaobjectWebhooksToUnsubscribe {
             webhookSubscriptions(first: 250, topics: [METAOBJECTS_CREATE, METAOBJECTS_UPDATE, METAOBJECTS_DELETE]) {
                nodes {
                    id
                    topic
                    filter
                }
            }
        }
    `;

    try {
        const response = await admin.graphql(query);
        const data: any = await response.json();

        const nodes = data.data?.webhookSubscriptions?.nodes || [];
        const target = nodes.find(
            (n: any) => n.filter === `type:${definitionType}` && n.topic === topic
        );

        if (!target) {
            return { success: true }; // Already unsubscribed
        }

        const deleteResult = await deleteWebhookSubscription(admin, target.id);
        if (deleteResult.userErrors && deleteResult.userErrors.length > 0) {
            return {
                success: false,
                error: deleteResult.userErrors.map((e) => e.message).join(", "),
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Subscribe to all webhooks (Create, Update, Delete) for a specific metaobject type.
 */
export async function subscribeToMetaobjectType(
    admin: AdminApiContext,
    shop: string,
    appUrl: string,
    definitionType: string
): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        subscriptionsCreated: 0,
        subscriptionsSkipped: 0,
        errors: [],
        metaobjectTypes: [definitionType],
    };

    if (!appUrl) {
        return {
            ...result,
            success: false,
            errors: ["SHOPIFY_APP_URL is missing. Cannot create webhooks."],
        };
    }

    for (const topic of METAOBJECT_TOPICS) {
        const res = await subscribeToMetaobjectTopic(admin, shop, appUrl, definitionType, topic);
        if (res.success) {
            result.subscriptionsCreated++;
        } else if (res.error) {
            result.errors.push(res.error);
            result.success = false;
        }
    }

    return result;
}

/**
 * Unsubscribe all webhooks (Create, Update, Delete) for a specific metaobject type.
 */
export async function unsubscribeFromMetaobjectType(
    admin: AdminApiContext,
    definitionType: string
): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        subscriptionsCreated: 0,
        subscriptionsSkipped: 0,
        errors: [],
        metaobjectTypes: [definitionType],
    };

    try {
        const query = `
            query GetMetaobjectWebhooksToUnsubscribe {
                 webhookSubscriptions(first: 250, topics: [METAOBJECTS_CREATE, METAOBJECTS_UPDATE, METAOBJECTS_DELETE]) {
                    nodes {
                        id
                        filter
                    }
                }
            }
        `;

        const response = await admin.graphql(query);
        const data: any = await response.json();

        const idsToDelete: string[] = [];
        if (data.data?.webhookSubscriptions?.nodes) {
            for (const sub of data.data.webhookSubscriptions.nodes) {
                if (sub.filter === `type:${definitionType}`) {
                    idsToDelete.push(sub.id);
                }
            }
        }

        for (const id of idsToDelete) {
            const deleteResult = await deleteWebhookSubscription(admin, id);
            if (deleteResult.userErrors && deleteResult.userErrors.length > 0) {
                result.errors.push(
                    `Failed to delete ${id}: ${deleteResult.userErrors.map((e) => e.message).join(", ")}`
                );
                result.success = false;
            } else {
                result.subscriptionsCreated++;
            }
        }
    } catch (error) {
        result.success = false;
        result.errors.push(error instanceof Error ? error.message : String(error));
    }

    return result;
}

/**
 * Create a webhook subscription via GraphQL API.
 */
async function createWebhookSubscription(
    admin: AdminApiContext,
    topic: MetaobjectTopic,
    callbackUrl: string,
    filter: string
): Promise<{ id: string | null; userErrors: Array<{ field: string[]; message: string }> }> {
    const mutation = `
        mutation CreateMetaobjectWebhook($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
            webhookSubscriptionCreate(
                topic: $topic
                webhookSubscription: $webhookSubscription
            ) {
                webhookSubscription {
                    id
                    endpoint {
                        ... on WebhookHttpEndpoint {
                            callbackUrl
                        }
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    try {
        const response = await admin.graphql(mutation, {
            variables: {
                topic,
                webhookSubscription: {
                    callbackUrl,
                    format: "JSON",
                    filter,
                },
            },
        });

        const data: any = await response.json();

        if (data.errors) {
            console.error(`[MetaobjectWebhookManager] GraphQL errors:`, JSON.stringify(data.errors, null, 2));
            return {
                id: null,
                userErrors: data.errors.map((e: any) => ({ field: ["graphql"], message: e.message })),
            };
        }

        const result: WebhookSubscriptionResult = data.data?.webhookSubscriptionCreate;

        return {
            id: result?.webhookSubscription?.id || null,
            userErrors: result?.userErrors || [],
        };
    } catch (error) {
        console.error(`[MetaobjectWebhookManager] Failed to create webhook:`, error);
        return {
            id: null,
            userErrors: [
                { field: ["system"], message: error instanceof Error ? error.message : String(error) },
            ],
        };
    }
}

/**
 * Delete a webhook subscription by ID via GraphQL API.
 */
async function deleteWebhookSubscription(
    admin: AdminApiContext,
    id: string
): Promise<{ deletedWebhookSubscriptionId: string | null; userErrors: Array<{ field: string[]; message: string }> }> {
    const mutation = `
        mutation webhookSubscriptionDelete($id: ID!) {
            webhookSubscriptionDelete(id: $id) {
                userErrors {
                    field
                    message
                }
                deletedWebhookSubscriptionId
            }
        }
    `;

    try {
        const response = await admin.graphql(mutation, {
            variables: { id },
        });
        const data: any = await response.json();

        return data.data?.webhookSubscriptionDelete || { deletedWebhookSubscriptionId: null, userErrors: [] };
    } catch (error) {
        console.error(`[MetaobjectWebhookManager] Failed to delete webhook ${id}:`, error);
        return { deletedWebhookSubscriptionId: null, userErrors: [{ field: [], message: String(error) }] };
    }
}