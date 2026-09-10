import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import {
    Page,
    Layout,
    Card,
    BlockStack,
    InlineStack,
    Text,
    Button,
    Badge,
    TextField,
    Checkbox,
    Divider,
    Banner,
    Box,
    Icon,
    Collapsible,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
    RESOURCE_WEBHOOK_CONFIGS,
    ALL_MANAGED_TOPICS,
    type ResourceWebhookConfig,
} from "../constants/webhookResources";
import {
    getActiveWebhookSubscriptions,
    syncWebhookSubscriptions,
} from "../services/dynamicWebhookManager.server";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
    SearchIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    AlertCircleIcon,
} from "@shopify/polaris-icons";

// ── Loader: Fetch directly from Shopify Admin API ────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;
    const appUrl = process.env.SHOPIFY_APP_URL || "";

    // Fetch active subscriptions directly from Shopify
    const existingMap = await getActiveWebhookSubscriptions(admin);
    const activeTopics: string[] = [];

    for (const [topic] of existingMap.entries()) {
        if (ALL_MANAGED_TOPICS.has(topic)) {
            activeTopics.push(topic);
        }
    }

    return json({
        activeTopics,
        shop,
        appUrl,
    });
};

// ── Action: Sync selected webhooks via GraphQL Admin API ─────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin } = await authenticate.admin(request);
    const appUrl = process.env.SHOPIFY_APP_URL || "";

    const formData = await request.formData();
    const raw = formData.get("selectedTopics");
    const selectedTopics: string[] = raw ? JSON.parse(raw as string) : [];

    const result = await syncWebhookSubscriptions(admin, appUrl, selectedTopics);

    return json({
        success: result.errors.length === 0,
        created: result.created,
        deleted: result.deleted,
        errors: result.errors,
    });
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function NotificationSettingsPage() {
    const { activeTopics } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const submit = useSubmit();
    const navigation = useNavigation();
    const isSaving = navigation.state === "submitting";

    // Track which topics are selected (Set of topic string enums)
    const [selectedTopics, setSelectedTopics] = useState<Set<string>>(
        new Set(activeTopics)
    );

    // Track which resources are expanded in UI
    const [expandedResources, setExpandedResources] = useState<Set<string>>(
        new Set()
    );

    const [search, setSearch] = useState("");

    // Sync state if loader activeTopics update (e.g. after action reload)
    useEffect(() => {
        setSelectedTopics(new Set(activeTopics));
    }, [activeTopics]);

    // Check if there are unsaved changes compared to server state
    const isDirty = useMemo(() => {
        if (selectedTopics.size !== activeTopics.length) return true;
        for (const topic of activeTopics) {
            if (!selectedTopics.has(topic)) return true;
        }
        return false;
    }, [selectedTopics, activeTopics]);

    // Filter resources based on search input
    const filteredResources = useMemo(() => {
        if (!search.trim()) return RESOURCE_WEBHOOK_CONFIGS;
        const q = search.toLowerCase();
        return RESOURCE_WEBHOOK_CONFIGS.filter((res) => {
            if (res.resourceName.toLowerCase().includes(q)) return true;
            return res.actions.some(
                (act) =>
                    act.label.toLowerCase().includes(q) ||
                    act.topic.toLowerCase().includes(q)
            );
        });
    }, [search]);

    // Toggle expansion for a specific resource
    const toggleExpand = useCallback((resourceName: string) => {
        setExpandedResources((prev) => {
            const next = new Set(prev);
            if (next.has(resourceName)) next.delete(resourceName);
            else next.add(resourceName);
            return next;
        });
    }, []);

    // Expand / Collapse all
    const expandAll = useCallback(() => {
        setExpandedResources(
            new Set(RESOURCE_WEBHOOK_CONFIGS.map((r) => r.resourceName))
        );
    }, []);

    const collapseAll = useCallback(() => {
        setExpandedResources(new Set());
    }, []);

    // Toggle a single action topic
    const toggleTopic = useCallback((topic: string) => {
        setSelectedTopics((prev) => {
            const next = new Set(prev);
            if (next.has(topic)) next.delete(topic);
            else next.add(topic);
            return next;
        });
    }, []);

    // Toggle all actions for a specific resource
    const toggleResourceAll = useCallback((resource: ResourceWebhookConfig) => {
        setSelectedTopics((prev) => {
            const next = new Set(prev);
            const allChecked = resource.actions.every((a) => next.has(a.topic));
            if (allChecked) {
                // Uncheck all
                for (const a of resource.actions) {
                    next.delete(a.topic);
                }
            } else {
                // Check all
                for (const a of resource.actions) {
                    next.add(a.topic);
                }
            }
            return next;
        });
    }, []);

    // Bulk actions
    const selectAll = useCallback(() => {
        setSelectedTopics(new Set(ALL_MANAGED_TOPICS));
    }, []);

    const deselectAll = useCallback(() => {
        setSelectedTopics(new Set());
    }, []);

    // Save changes to Shopify
    const handleSave = useCallback(() => {
        const formData = new FormData();
        formData.append(
            "selectedTopics",
            JSON.stringify(Array.from(selectedTopics))
        );
        submit(formData, { method: "post" });
    }, [selectedTopics, submit]);

    // Group selected topics by resource for the sidebar summary
    const enabledSummary = useMemo(() => {
        const list: {
            resourceName: string;
            emoji: string;
            activeActions: string[];
        }[] = [];

        for (const res of RESOURCE_WEBHOOK_CONFIGS) {
            const active = res.actions.filter((a) => selectedTopics.has(a.topic));
            if (active.length > 0) {
                list.push({
                    resourceName: res.resourceName,
                    emoji: res.emoji,
                    activeActions: active.map((a) => a.label),
                });
            }
        }
        return list;
    }, [selectedTopics]);

    return (
        <Page>
            <TitleBar title="Notification Webhook Subscriptions" />
            <Layout>
                <Layout.Section>
                    <BlockStack gap="200">
                        {/* Info Banner */}
                        <Banner tone="info">
                            <p>
                                Choose which specific events (<strong>Create</strong>,{" "}
                                <strong>Update</strong>, or <strong>Remove</strong>) should trigger
                                notifications. Webhook subscriptions are created and deleted
                                dynamically in Shopify via the Admin API. Your app only receives
                                webhooks for the events you configure.
                            </p>
                        </Banner>

                        {/* Result / Error Banner */}
                        {actionData && (
                            <Banner
                                tone={actionData.success ? "success" : "critical"}
                                title={
                                    actionData.success
                                        ? "Webhook subscriptions updated successfully"
                                        : "Some errors occurred while updating webhooks"
                                }
                            >
                                <BlockStack gap="100">
                                    {actionData.created.length > 0 && (
                                        <Text as="p" variant="bodySm">
                                            ✅ Subscribed to {actionData.created.length} topic(s):{" "}
                                            {actionData.created.join(", ")}
                                        </Text>
                                    )}
                                    {actionData.deleted.length > 0 && (
                                        <Text as="p" variant="bodySm">
                                            🗑️ Unsubscribed from {actionData.deleted.length} topic(s):{" "}
                                            {actionData.deleted.join(", ")}
                                        </Text>
                                    )}
                                    {actionData.errors.length > 0 && (
                                        <BlockStack gap="100">
                                            {actionData.errors.map((err, i) => (
                                                <Text as="p" key={i} tone="critical" variant="bodySm">
                                                    ⚠️ {err}
                                                </Text>
                                            ))}
                                        </BlockStack>
                                    )}
                                </BlockStack>
                            </Banner>
                        )}

                        {/* Main Settings Card */}
                        <Card>
                            <BlockStack gap="200">
                                {/* Header / Summary */}
                                <InlineStack align="space-between" blockAlign="center">
                                    <BlockStack gap="100">
                                        <Text as="h2" variant="headingMd">
                                            ⚡ Event-Level Webhook Subscriptions
                                        </Text>
                                        <Text as="p" variant="bodySm" tone="subdued">
                                            Click any resource to toggle specific Create, Update, or
                                            Remove webhooks.
                                        </Text>
                                    </BlockStack>
                                    <InlineStack gap="200" blockAlign="center">
                                        <Badge
                                            tone={selectedTopics.size > 0 ? "success" : "critical"}
                                        >
                                            {`${selectedTopics.size} / ${ALL_MANAGED_TOPICS.size} webhooks active`}
                                        </Badge>
                                        {isDirty && (
                                            <Badge tone="warning">Unsaved changes</Badge>
                                        )}
                                    </InlineStack>
                                </InlineStack>

                                <Divider />

                                {/* Search & Global Expand/Collapse Buttons */}
                                <InlineStack align="space-between" blockAlign="center">
                                    <div style={{ flex: 1, maxWidth: "575px" }}>
                                        <TextField
                                            label=""
                                            labelHidden
                                            placeholder="Search resource or action (e.g. Order, Create)..."
                                            value={search}
                                            onChange={setSearch}
                                            autoComplete="off"
                                            prefix={<Icon source={SearchIcon} />}
                                            clearButton
                                            onClearButtonClick={() => setSearch("")}
                                        />
                                    </div>
                                    {/* // <InlineStack gap="200">
                                        <Button size="slim" onClick={expandAll}>
                                            Expand All
                                        </Button>
                                        <Button size="slim" onClick={collapseAll}>
                                            Collapse All
                                        </Button>
                                        <Button size="slim" onClick={selectAll}>
                                            Select All
                                        </Button>
                                        <Button size="slim" onClick={deselectAll}>
                                            Clear All
                                        </Button>
                                    </InlineStack> */}
                                </InlineStack>

                                {/* Resource Accordion List */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "10px",
                                        maxHeight: "500px",
                                        overflowY: "auto",
                                        padding: "4px 2px",
                                    }}
                                >
                                    {filteredResources.map((res) => {
                                        const isExpanded =
                                            expandedResources.has(res.resourceName) ||
                                            search.trim().length > 0;
                                        const checkedCount = res.actions.filter((a) =>
                                            selectedTopics.has(a.topic)
                                        ).length;
                                        const totalCount = res.actions.length;
                                        const allChecked = checkedCount === totalCount;
                                        const isIndeterminate =
                                            checkedCount > 0 && checkedCount < totalCount;

                                        return (
                                            <div
                                                key={res.resourceName}
                                                style={{
                                                    border: isExpanded
                                                        ? "1px solid #c7d2fe"
                                                        : "1px solid #e2e8f0",
                                                    borderRadius: "10px",
                                                    background:
                                                        checkedCount > 0
                                                            ? "#f8fafc"
                                                            : "#ffffff",
                                                    transition: "all 0.2s ease",
                                                    boxShadow: isExpanded
                                                        ? "0 2px 8px rgba(0,0,0,0.04)"
                                                        : "none",
                                                }}
                                            >
                                                {/* Resource Header Bar */}
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        padding: "12px 16px",
                                                        cursor: "pointer",
                                                        userSelect: "none",
                                                    }}
                                                    onClick={() => toggleExpand(res.resourceName)}
                                                >
                                                    <InlineStack gap="300" blockAlign="center">
                                                        <div
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ display: "flex", alignItems: "center" }}
                                                        >
                                                            <Checkbox
                                                                label=""
                                                                labelHidden
                                                                checked={
                                                                    isIndeterminate
                                                                        ? "indeterminate"
                                                                        : allChecked
                                                                }
                                                                onChange={() => toggleResourceAll(res)}
                                                                id={`res-toggle-${res.resourceName.replace(
                                                                    /\s+/g,
                                                                    "-"
                                                                )}`}
                                                            />
                                                        </div>
                                                        <span style={{ fontSize: "18px" }}>
                                                            {res.emoji}
                                                        </span>
                                                        <Text as="span" variant="bodyMd" fontWeight="semibold">
                                                            {res.resourceName}
                                                        </Text>
                                                    </InlineStack>

                                                    <InlineStack gap="300" blockAlign="center">
                                                        <Badge
                                                            tone={
                                                                allChecked
                                                                    ? "success"
                                                                    : checkedCount > 0
                                                                        ? "attention"
                                                                        : undefined
                                                            }
                                                        >
                                                            {`${checkedCount} / ${totalCount} active`}
                                                        </Badge>
                                                        <Icon
                                                            source={
                                                                isExpanded ? ChevronUpIcon : ChevronDownIcon
                                                            }
                                                            tone="subdued"
                                                        />
                                                    </InlineStack>
                                                </div>

                                                {/* Action Checkboxes (Create, Update, Remove...) */}
                                                <Collapsible
                                                    open={isExpanded}
                                                    id={`collapsible-${res.resourceName.replace(
                                                        /\s+/g,
                                                        "-"
                                                    )}`}
                                                    transition={{
                                                        duration: "150ms",
                                                        timingFunction: "ease-in-out",
                                                    }}
                                                >
                                                    <Box
                                                        padding="400"
                                                        borderBlockStartWidth="025"
                                                        borderColor="border-secondary"
                                                        background="bg-surface-secondary"
                                                    >
                                                        <BlockStack gap="300">
                                                            <div
                                                                style={{
                                                                    display: "grid",
                                                                    gridTemplateColumns:
                                                                        "repeat(auto-fill, minmax(200px, 1fr))",
                                                                    gap: "10px",
                                                                }}
                                                            >
                                                                {res.actions.map((act) => {
                                                                    const isChecked = selectedTopics.has(
                                                                        act.topic
                                                                    );
                                                                    return (
                                                                        <div
                                                                            key={act.topic}
                                                                            onClick={() =>
                                                                                toggleTopic(act.topic)
                                                                            }
                                                                            style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                padding: "8px 12px",
                                                                                borderRadius: "6px",
                                                                                background: isChecked
                                                                                    ? "#e0e7ff"
                                                                                    : "#ffffff",
                                                                                border: isChecked
                                                                                    ? "1px solid #818cf8"
                                                                                    : "1px solid #cbd5e1",
                                                                                cursor: "pointer",
                                                                                transition:
                                                                                    "background 0.15s ease",
                                                                            }}
                                                                        >
                                                                            <div
                                                                                onClick={(e) =>
                                                                                    e.stopPropagation()
                                                                                }
                                                                                style={{
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    marginRight: "8px",
                                                                                }}
                                                                            >
                                                                                <Checkbox
                                                                                    label=""
                                                                                    labelHidden
                                                                                    checked={isChecked}
                                                                                    onChange={() =>
                                                                                        toggleTopic(act.topic)
                                                                                    }
                                                                                    id={`act-check-${act.topic}`}
                                                                                />
                                                                            </div>
                                                                            <BlockStack gap="050">
                                                                                <Text
                                                                                    as="span"
                                                                                    variant="bodySm"
                                                                                    fontWeight={
                                                                                        isChecked
                                                                                            ? "semibold"
                                                                                            : "regular"
                                                                                    }
                                                                                >
                                                                                    {act.label}
                                                                                </Text>
                                                                                <Text
                                                                                    as="span"
                                                                                    variant="bodyXs"
                                                                                    tone="subdued"
                                                                                >
                                                                                    {act.topic}
                                                                                </Text>
                                                                            </BlockStack>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </BlockStack>
                                                    </Box>
                                                </Collapsible>
                                            </div>
                                        );
                                    })}

                                    {filteredResources.length === 0 && (
                                        <Box padding="600">
                                            <Text as="p" tone="subdued" alignment="center">
                                                No resources or actions match "{search}"
                                            </Text>
                                        </Box>
                                    )}
                                </div>

                                <Divider />

                                {/* Save Button */}
                                <InlineStack align="end" gap="300" blockAlign="center">
                                    {!isDirty && activeTopics.length > 0 && (
                                        <InlineStack gap="100" blockAlign="center">
                                            <Icon source={CheckCircleIcon} tone="success" />
                                            <Text as="span" tone="success" variant="bodySm">
                                                In sync with Shopify
                                            </Text>
                                        </InlineStack>
                                    )}
                                    <Button
                                        variant="primary"
                                        tone="success"
                                        loading={isSaving}
                                        disabled={!isDirty}
                                        onClick={handleSave}
                                    >
                                        Save Subscriptions
                                    </Button>
                                </InlineStack>
                            </BlockStack>
                        </Card>
                    </BlockStack>
                </Layout.Section>

                {/* Sidebar: Active Subscriptions Summary */}
                <Layout.Section variant="oneThird">
                    <Card>
                        <BlockStack gap="300">
                            <InlineStack align="space-between" blockAlign="center">
                                <Text as="h2" variant="headingMd">
                                    📡 Active Subscriptions
                                </Text>
                                <Badge tone="info">{`${selectedTopics.size} total`}</Badge>
                            </InlineStack>
                            <Divider />

                            {enabledSummary.length === 0 ? (
                                <Box padding="200">
                                    <BlockStack gap="100">
                                        <InlineStack gap="100" blockAlign="center">
                                            <Icon source={AlertCircleIcon} tone="critical" />
                                            <Text as="span" tone="critical" variant="bodySm" fontWeight="semibold">
                                                No events selected
                                            </Text>
                                        </InlineStack>
                                        <Text as="p" tone="subdued" variant="bodyXs">
                                            No webhooks will be sent to your app.
                                        </Text>
                                    </BlockStack>
                                </Box>
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "10px",
                                        maxHeight: "560px",
                                        overflowY: "auto",
                                        paddingRight: "4px",
                                    }}
                                >
                                    {enabledSummary.map((item) => (
                                        <Box
                                            key={item.resourceName}
                                            padding="200"
                                            background="bg-surface-secondary"
                                            borderRadius="200"
                                        >
                                            <BlockStack gap="100">
                                                <InlineStack gap="200" blockAlign="center">
                                                    <span>{item.emoji}</span>
                                                    <Text as="span" variant="bodySm" fontWeight="semibold">
                                                        {item.resourceName}
                                                    </Text>
                                                </InlineStack>
                                                <InlineStack gap="100" wrap>
                                                    {item.activeActions.map((act) => (
                                                        <Badge key={act} tone="success" size="small">
                                                            {act}
                                                        </Badge>
                                                    ))}
                                                </InlineStack>
                                            </BlockStack>
                                        </Box>
                                    ))}
                                </div>
                            )}
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
