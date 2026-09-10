import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams, useNavigation, useRevalidator } from "@remix-run/react";
import { Page, Card, Text, BlockStack, InlineStack, Badge, Box, DataTable, Divider, Button, Modal, Pagination, TextField } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState, useCallback, useMemo, useEffect } from "react";
import { WebhookPayloadViewer } from "../components/WebhookPayloadViewer";

interface WebhookEventRow {
    id: string;
    changedBy: string;
    resourceType: string;
    eventAction: string;
    resourceId: string | null;
    shop: string;
    createdAt: string;
    payload: string;
}

// ── All resource type definitions with emoji + badge tones ──
const RESOURCE_DEFINITIONS: Record<string, { emoji: string; tone: "info" | "success" | "attention" | "warning" | "critical" | "new" }> = {
    "Cart": { emoji: "🛒", tone: "info" },
    "Channel": { emoji: "📡", tone: "attention" },
    "Checkout": { emoji: "💰", tone: "success" },
    "Collection": { emoji: "📁", tone: "attention" },
    "Collection Listing": { emoji: "📋", tone: "info" },
    "Collection Publication": { emoji: "🌐", tone: "info" },
    "Company": { emoji: "🏢", tone: "success" },
    "Company Contact": { emoji: "📞", tone: "info" },
    "Company Contact Role": { emoji: "🎖️", tone: "info" },
    "Company Location": { emoji: "📍", tone: "warning" },
    "Customer": { emoji: "👤", tone: "info" },
    "Customer Account Settings": { emoji: "🔧", tone: "info" },
    "Customer Group": { emoji: "👥", tone: "attention" },
    "Customer Marketing Consent": { emoji: "📧", tone: "warning" },
    "Delivery Profile": { emoji: "🚚", tone: "attention" },
    "Delivery Promise Settings": { emoji: "🕐", tone: "info" },
    "Discount": { emoji: "🏷️", tone: "success" },
    "Domain": { emoji: "🌍", tone: "info" },
    "Draft Order": { emoji: "📝", tone: "warning" },
    "Fulfillment": { emoji: "📦", tone: "success" },
    "Fulfillment Event": { emoji: "🔔", tone: "info" },
    "Fulfillment Hold": { emoji: "⏸️", tone: "warning" },
    "Fulfillment Order": { emoji: "📬", tone: "attention" },
    "Inventory Item": { emoji: "🗄️", tone: "info" },
    "Inventory Level": { emoji: "📊", tone: "attention" },
    "Locale": { emoji: "🌐", tone: "info" },
    "Location": { emoji: "🏪", tone: "success" },
    "Market": { emoji: "🛍️", tone: "info" },
    "Metafield Definition": { emoji: "🏷️", tone: "warning" },
    "Metaobject": { emoji: "🧩", tone: "attention" },
    "Order": { emoji: "🧾", tone: "success" },
    "Order Transaction": { emoji: "💸", tone: "info" },
    "Payment Terms": { emoji: "📃", tone: "info" },
    "Product": { emoji: "🛍️", tone: "success" },
    "Product Listing": { emoji: "📋", tone: "attention" },
    "Product Publication": { emoji: "🌐", tone: "info" },
    "Product Variant": { emoji: "🎨", tone: "warning" },
    "Refund": { emoji: "↩️", tone: "critical" },
    "Return": { emoji: "📤", tone: "warning" },
    "Reverse Delivery": { emoji: "🔁", tone: "info" },
    "Reverse Fulfillment Order": { emoji: "↩️", tone: "attention" },
    "Segment": { emoji: "🎯", tone: "info" },
    "Selling Plan Group": { emoji: "📆", tone: "info" },
    "Shop": { emoji: "🏪", tone: "success" },
    "Tender Transaction": { emoji: "💵", tone: "success" },
    "Theme": { emoji: "🎨", tone: "attention" },
};

const ACTION_TONE: Record<string, "info" | "success" | "attention" | "warning" | "critical" | "new"> = {
    Created: "success",
    Updated: "info",
    Deleted: "critical",
    Cancelled: "critical",
    Enabled: "success",
    Disabled: "warning",
    Published: "success",
    Paid: "success",
    Fulfilled: "success",
    Refunded: "warning",
    Failed: "critical",
    Approved: "success",
    Declined: "critical",
    Added: "success",
    Removed: "critical",
    Assigned: "success",
    Revoked: "warning",
    Merged: "info",
    Requested: "info",
    "Hold Released": "success",
    Ready: "success",
    Moved: "info",
    "Routing Complete": "success",
    "Placed On Hold": "warning",
    Rescheduled: "info",
    Split: "info",
    Connected: "success",
    Disconnected: "warning",
    Activated: "success",
    Deactivated: "warning",
    Edited: "info",
    "Partially Fulfilled": "attention",
    Closed: "info",
    Reopened: "attention",
    "Attach Deliverable": "success",
    Disposed: "critical",
    "In Stock": "success",
    "Out Of Stock": "critical",
    Finished: "success",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const direction = url.searchParams.get("direction") || "next";
    const resourceFilter = url.searchParams.get("resource") || "All";
    const pageSize = 10;

    // Check if metaobject definition exists
    const defRes = await admin.graphql(
        `#graphql
        query checkMetaobjectDefinition($type: String!) {
          metaobjectDefinitionByType(type: $type) {
            id
            name
            metaobjectsCount
          }
        }`,
        { variables: { type: "flow_email_notification__" } }
    );
    const defData = await defRes.json();
    const definition = defData.data?.metaobjectDefinitionByType;
    const isMetaobjectCreated = !!definition;
    const totalEvents = definition?.metaobjectsCount ?? 0;

    let paginatedEvents: any[] = [];
    let pageInfo = { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null };

    if (isMetaobjectCreated) {
        let first = null;
        let last = null;
        let after = null;
        let before = null;

        if (direction === "next") {
            first = pageSize;
            after = cursor || null;
        } else if (direction === "previous") {
            last = pageSize;
            before = cursor || null;
        }

        let queryInput = null;
        if (resourceFilter && resourceFilter !== "All") {
            // Shopify metaobject field filter syntax (requires field to be marked filterable)
            queryInput = `fields.resourceType:"${resourceFilter}"`;
        }

        const metaRes = await admin.graphql(
            `#graphql
            query getMetaobjects($type: String!, $first: Int, $last: Int, $after: String, $before: String, $query: String) {
              metaobjects(type: $type, sortKey: "updated_at", reverse: true, first: $first, last: $last, after: $after, before: $before, query: $query) {
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                  startCursor
                  endCursor
                }
                edges {
                  cursor
                  node {
                    id
                    fields {
                      key
                      value
                    }
                  }
                }
              }
            }`,
            {
                variables: {
                    type: "flow_email_notification__",
                    first,
                    last,
                    after,
                    before,
                    query: queryInput
                }
            }
        );

        const metaData = await metaRes.json();

        if (metaData.data?.metaobjects) {
            pageInfo = metaData.data.metaobjects.pageInfo;
            const edges = metaData.data.metaobjects.edges || [];

            paginatedEvents = edges.map(({ node }: any) => {
                if (!node) return null;
                const getField = (key: string) => node.fields.find((f: any) => f.key === key)?.value || "";
                return {
                    id: node.id,
                    changedBy: getField("changedBy"),
                    resourceType: getField("resourceType") || "Unknown",
                    eventAction: getField("eventAction") || "Unknown",
                    resourceId: getField("resourceId"),
                    shop: shop,
                    createdAt: getField("createdAt") || new Date().toISOString(),
                    payload: getField("payload") || "{}",
                };
            }).filter(Boolean);
        }
    }

    return json({
        recentEvents: paginatedEvents,
        pagination: {
            resourceFilter,
            ...pageInfo
        },
        totalEvents,
        shop,
        isMetaobjectCreated
    });
};

export default function WebhookLogPage() {
    const { recentEvents, pagination, totalEvents, isMetaobjectCreated } = useLoaderData<typeof loader>();
    const [, setSearchParams] = useSearchParams();
    const navigation = useNavigation();
    const revalidator = useRevalidator();
    const isLoadingData = navigation.state === "loading" || revalidator.state === "loading";
    const [filterSearch, setFilterSearch] = useState("");

    const [showCreateDbModal, setShowCreateDbModal] = useState(!isMetaobjectCreated);
    const [isCreatingDb, setIsCreatingDb] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const [countsByType, setCountsByType] = useState<Record<string, number>>({});
    const [isFetchingCounts, setIsFetchingCounts] = useState(false);

    // Fix hydration mismatch on new Date().toLocaleString()
    const [isHydrated, setIsHydrated] = useState(false);
    useEffect(() => setIsHydrated(true), []);

    useEffect(() => {
        if (!isMetaobjectCreated) return;

        let isCancelled = false;

        const fetchAllCounts = async () => {
            setIsFetchingCounts(true);
            let hasNextPage = true;
            let cursor: string | null = null;
            const accumulatedCounts: Record<string, number> = {};

            try {
                while (hasNextPage && !isCancelled) {
                    const url = new URL("/api/webhook-types", window.location.origin);
                    if (cursor) url.searchParams.set("after", cursor);

                    const res = await fetch(url.toString(), { credentials: "include" });
                    if (!res.ok) break;

                    const data = await res.json();

                    if (data.nodes) {
                        data.nodes.forEach((node: any) => {
                            const type = node.resourceTypeField?.value || "Unknown";
                            accumulatedCounts[type] = (accumulatedCounts[type] || 0) + 1;
                        });

                        setCountsByType({ ...accumulatedCounts });
                    }

                    hasNextPage = !!data.pageInfo?.hasNextPage;
                    cursor = data.pageInfo?.endCursor || null;
                }
                console.log("Count of types::", accumulatedCounts);
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                if (!isCancelled) setIsFetchingCounts(false);
            }
        };

        fetchAllCounts();

        return () => {
            isCancelled = true;
        };
    }, [isMetaobjectCreated]);

    const handleCreateDbMeta = async () => {
        setIsCreatingDb(true);
        try {
            const formData = new FormData();
            formData.append("intent", "create_db_meta");
            const res = await fetch("/api/metaobject", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.data?.metaobjectDefinitionCreate?.userErrors?.length) {
                console.error("Errors:", data.data.metaobjectDefinitionCreate.userErrors);
                shopify.toast.show("Failed to create Metaobject: " + data.data.metaobjectDefinitionCreate.userErrors[0].message, { isError: true });
            } else {
                shopify.toast.show("Metaobject definition created successfully!");
                setShowCreateDbModal(false);
                setShowConfirmDialog(false);
                setTimeout(() => revalidator.revalidate(), 500);
            }
        } catch (error) {
            console.error("Creation error:", error);
            shopify.toast.show("An error occurred during creation.", { isError: true });
        } finally {
            setIsCreatingDb(false);
        }
    };

    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [modalContent, setModalContent] = useState<{
        title: string;
        json: string;
        resourceId: string | null;
        parsedPayload: any;
        resourceType: string;
        changedBy: string;
    } | null>(null);

    const updateParams = useCallback((newParams: Record<string, string>) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            Object.entries(newParams).forEach(([key, value]) => next.set(key, value));
            return next;
        });
    }, [setSearchParams]);

    const openJsonModal = useCallback((event: WebhookEventRow) => {
        let parsedPayload: any = null;
        let jsonString = "";
        try {
            parsedPayload = JSON.parse(event.payload);
            jsonString = JSON.stringify(parsedPayload, null, 2);
        } catch {
            jsonString = event.payload || "No payload data available";
        }
        setModalContent({
            title: `${event.resourceType} — ${event.eventAction}`,
            json: jsonString,
            resourceId: event.resourceId,
            parsedPayload,
            resourceType: event.resourceType,
            changedBy: event.changedBy,
        });
        setActiveModal(event.id);
    }, []);

    const closeModal = useCallback(() => {
        setActiveModal(null);
        setModalContent(null);
    }, []);

    // All known resource types
    const allKnownTypes = useMemo(() => Object.keys(RESOURCE_DEFINITIONS), []);

    // Build filter list
    const allFilterTypes = useMemo(() => {
        const fromDb = Object.keys(countsByType);
        const combined = new Set([...allKnownTypes, ...fromDb]);
        return ["All", ...Array.from(combined).sort()];
    }, [allKnownTypes, countsByType]);

    // Filter by search box
    const filteredFilterTypes = useMemo(() => {
        if (!filterSearch.trim()) return allFilterTypes;
        const q = filterSearch.toLowerCase();
        return allFilterTypes.filter((r) => r.toLowerCase().includes(q));
    }, [allFilterTypes, filterSearch]);

    const rows = recentEvents.map((event: any) => {
        const actionTone = ACTION_TONE[event.eventAction] ?? "info";

        // Use a consistent string for SSR, format conditionally on client to prevent hydration mismatch
        const createdAtStr = isHydrated
            ? new Date(event.createdAt).toLocaleString()
            : event.createdAt; // ISO string fallback during SSR

        return [
            createdAtStr,
            <span key={`type-${event.id}`}>
                {RESOURCE_DEFINITIONS[event.resourceType]?.emoji ?? "🔔"} {event.resourceType}
            </span>,
            event.changedBy,
            <Badge key={`action-${event.id}`} tone={actionTone}>
                {event.eventAction}
            </Badge>,
            event.resourceId ? event.resourceId.split("/").pop() ?? "N/A" : "N/A",
            <Button key={`btn-${event.id}`} size="slim" onClick={() => openJsonModal(event)}>
                View
            </Button>,
        ];
    });



    return (
        <Page>
            <TitleBar title="Webhook Event Log" />

            <Modal
                open={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                title="Confirm Metaobject Creation"
                primaryAction={{
                    content: "Confirm",
                    onAction: handleCreateDbMeta,
                    loading: isCreatingDb,
                }}
                secondaryActions={[
                    {
                        content: "Cancel",
                        onAction: () => !isCreatingDb && setShowConfirmDialog(false),
                    },
                ]}
            >
                <Modal.Section>
                    <Text as="p" variant="bodyMd">
                        Are you sure you want to proceed? We are creating the metaobject [<strong>Flow Email Notification</strong>] required for storing flow email notifications.
                    </Text>
                </Modal.Section>
            </Modal>

            {showCreateDbModal && (
                <Box paddingBlockEnd="500">
                    <Card background="bg-surface-secondary">
                        <BlockStack gap="400">
                            <Text as="h2" variant="headingMd">
                                Database Required
                            </Text>
                            <Text as="p" variant="bodyMd">
                                We are creating a metaobject called [<strong>Flow Email Notification</strong>] for our event info.
                                Please confirm to create the database metaobject with the required fields to store webhook logs.
                            </Text>
                            <InlineStack gap="300">
                                <Button
                                    variant="primary"
                                    tone="success"
                                    onClick={() => setShowConfirmDialog(true)}
                                >
                                    Confirm Create
                                </Button>
                                {/* <Button onClick={() => setShowCreateDbModal(false)}>
                                    Dismiss
                                </Button> */}
                            </InlineStack>
                        </BlockStack>
                    </Card>
                </Box>
            )}

            {!showCreateDbModal && (
                <BlockStack gap="200">
                    {/* ── Event Log Table ── */}
                    <Card>
                        <BlockStack gap="200">
                            <div className="header-split" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                                <BlockStack gap="100">
                                    <Text as="h2" variant="headingMd">📜 Recent Webhook Events</Text>
                                    <Text as="p" variant="bodySm" tone="subdued">You can view webhook notifications from the last 30 days.</Text>
                                </BlockStack>
                                <Badge tone="info">{`${Object.values(countsByType).reduce((sum, value) => sum + value, 0)} total global events`}</Badge>

                            </div>

                            {/* ── Filter Panel ── */}
                            <Card background="bg-surface-secondary">
                                <BlockStack gap="100">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <Text as="h3" variant="headingSm">🔍 Filter by Resource Type</Text>
                                        {pagination.resourceFilter !== "All" && (
                                            <Button
                                                variant="plain"
                                                onClick={() => updateParams({ resource: "All", cursor: "", direction: "next" })}
                                            >
                                                Clear filter
                                            </Button>
                                        )}
                                    </InlineStack>
                                    <TextField
                                        label=""
                                        labelHidden
                                        placeholder="Search resource types..."
                                        value={filterSearch}
                                        onChange={setFilterSearch}
                                        autoComplete="off"
                                        prefix="🔍"
                                        clearButton
                                        onClearButtonClick={() => setFilterSearch("")}
                                    />
                                    <div
                                        className="filter-chip-strip"
                                        style={{
                                            opacity: isLoadingData ? 0.5 : 1,
                                            pointerEvents: isLoadingData ? "none" : "auto",
                                        }}
                                    >
                                        {filteredFilterTypes.map((resource) => {
                                            const count = resource === "All" ? Object.values(countsByType).reduce((sum, value) => sum + value, 0) : (countsByType[resource] ?? 0);
                                            const isActive = pagination.resourceFilter === resource;
                                            return (
                                                <button
                                                    key={resource}
                                                    onClick={() => updateParams({ resource, cursor: "", direction: "next" })}
                                                    className={`filter-chip${isActive ? " active" : ""}`}
                                                >
                                                    {resource === "All"
                                                        ? "All"
                                                        : `${RESOURCE_DEFINITIONS[resource]?.emoji ?? "🔔"} ${resource}`}
                                                    {count > 0 && (
                                                        <span className="filter-chip-count">
                                                            {count}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </BlockStack>
                            </Card>

                            {/* ── Data Table ── */}
                            {rows.length > 0 ? (
                                <div
                                    className="data-table-scroll"
                                    style={{
                                        opacity: isLoadingData ? 0.5 : 1,
                                        pointerEvents: isLoadingData ? "none" : "auto",
                                        transition: "opacity 0.2s ease-in-out",
                                    }}
                                >
                                    <DataTable
                                        columnContentTypes={["text", "text", "text", "text", "text", "text"]}
                                        headings={["Timestamp", "Resource", "ChangedBy", "Action", "Resource ID", "Details"]}
                                        rows={rows}
                                        truncate
                                    />
                                </div>
                            ) : (
                                <Box padding="600">
                                    <BlockStack gap="200" inlineAlign="center">
                                        <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                                            {pagination.resourceFilter !== "All"
                                                ? `No events found for "${pagination.resourceFilter}".`
                                                : "No webhook events recorded yet."}
                                        </Text>
                                        <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                                            Events will appear here as your store receives webhook notifications.
                                        </Text>
                                    </BlockStack>
                                </Box>
                            )}

                            {/* ── Pagination ── */}
                            {(pagination.hasNextPage || pagination.hasPreviousPage) && (
                                <div
                                    className="pagination-row"
                                    style={{
                                        opacity: isLoadingData ? 0.5 : 1,
                                        pointerEvents: isLoadingData ? "none" : "auto",
                                        transition: "opacity 0.2s ease-in-out",
                                    }}
                                >
                                    <Pagination
                                        hasPrevious={pagination.hasPreviousPage}
                                        hasNext={pagination.hasNextPage}
                                        onPrevious={() => updateParams({ direction: "previous", cursor: pagination.startCursor || "", resource: pagination.resourceFilter ?? "All" })}
                                        onNext={() => updateParams({ direction: "next", cursor: pagination.endCursor || "", resource: pagination.resourceFilter ?? "All" })}
                                    />
                                </div>
                            )}
                        </BlockStack>
                    </Card>

                    {/* ── Payload Modal ── */}
                    {modalContent && (
                        <Modal
                            open={!!activeModal}
                            onClose={closeModal}
                            title={modalContent.title}
                            primaryAction={{ content: "Close", onAction: closeModal }}
                            secondaryActions={[
                                {
                                    content: "Copy JSON",
                                    onAction: () => navigator.clipboard.writeText(modalContent.json),
                                },
                            ]}
                        >
                            <Modal.Section>
                                {modalContent.resourceId && (
                                    <Box paddingBlockEnd="300">
                                        <InlineStack gap="200" blockAlign="center">
                                            <Text as="span" variant="bodySm" tone="subdued">Resource ID:</Text>
                                            <Badge>{modalContent.resourceId.split("/").pop() ?? modalContent.resourceId}</Badge>
                                        </InlineStack>
                                    </Box>
                                )}
                                <WebhookPayloadViewer
                                    payload={modalContent.parsedPayload}
                                    resourceType={modalContent.resourceType}
                                    changedBy={modalContent.changedBy}
                                />
                            </Modal.Section>
                        </Modal>
                    )}
                </BlockStack>
            )
            }
        </Page >
    );
}
