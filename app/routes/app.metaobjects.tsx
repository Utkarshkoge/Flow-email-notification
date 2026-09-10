import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useSubmit, useNavigation, useSearchParams } from "@remix-run/react";
import {
    Page,
    Layout,
    BlockStack,
    Card,
    Text,
    IndexTable,
    Button,
    Badge,
    Banner,
    Spinner,
    Frame,
    Toast,
    TextField,
    InlineStack,
    Checkbox,
    Box,
    Divider,
    Icon,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import {
    fetchMetaobjectDefinitions,
    getDetailedMetaobjectSubscriptions,
    subscribeToMetaobjectTopic,
    unsubscribeFromMetaobjectTopic,
    type MetaobjectTopic,
} from "app/services/metaobjectWebhookManager.server";
import { useEffect, useState, useCallback, useMemo } from "react";
import { TitleBar } from "@shopify/app-bridge-react";
import { CheckCircleIcon } from "@shopify/polaris-icons";

interface DefinitionItem {
    id: string;
    name: string;
    type: string;
}

interface MetaobjectEventsState {
    create: boolean;
    update: boolean;
    delete: boolean;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const searchQuery = (url.searchParams.get("search") || "").toLowerCase();
    const pageSize = 10;

    // Fetch all definitions
    const definitions = await fetchMetaobjectDefinitions(admin);

    // Fetch detailed existing subscriptions (Create, Update, Delete per type)
    const subscriptionsMap = await getDetailedMetaobjectSubscriptions(admin);

    // Build clean map of server state for all definitions
    const cleanSubscriptionsMap: Record<string, MetaobjectEventsState> = {};
    for (const def of definitions) {
        cleanSubscriptionsMap[def.type] = {
            create: !!subscriptionsMap[def.type]?.create,
            update: !!subscriptionsMap[def.type]?.update,
            delete: !!subscriptionsMap[def.type]?.delete,
        };
    }

    // Filter definitions by search query
    let filtered = definitions;
    if (searchQuery) {
        filtered = filtered.filter(
            (m) =>
                (m.name || "").toLowerCase().includes(searchQuery) ||
                (m.type || "").toLowerCase().includes(searchQuery)
        );
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const skip = (page - 1) * pageSize;
    const paginatedDefinitions: DefinitionItem[] = filtered.slice(skip, skip + pageSize).map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
    }));

    return json({
        metaobjects: paginatedDefinitions,
        allDefinitions: definitions.map((d) => ({ id: d.id, name: d.name, type: d.type })),
        subscriptionsMap: cleanSubscriptionsMap,
        pagination: { page, totalPages, totalItems, pageSize, searchQuery },
        appUrl: process.env.SHOPIFY_APP_URL || "https://flow-email-notification-production.up.railway.app",
    });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const appUrl = process.env.SHOPIFY_APP_URL || "https://flow-email-notification-production.up.railway.app";

    const rawChanges = formData.get("changes") as string;
    if (!rawChanges) {
        return json({ status: "error", message: "No changes provided to save." });
    }

    let changes: Array<{
        type: string;
        topic: MetaobjectTopic;
        enable: boolean;
    }> = [];

    try {
        changes = JSON.parse(rawChanges);
    } catch {
        return json({ status: "error", message: "Invalid payload." });
    }

    if (changes.length === 0) {
        return json({ status: "success", message: "No changes to save." });
    }

    const errors: string[] = [];
    let appliedCount = 0;

    for (const item of changes) {
        if (item.enable) {
            const res = await subscribeToMetaobjectTopic(
                admin,
                session.shop,
                appUrl,
                item.type,
                item.topic
            );
            if (res.success) {
                appliedCount++;
            } else if (res.error) {
                errors.push(`Failed to subscribe ${item.topic} for ${item.type}: ${res.error}`);
            }
        } else {
            const res = await unsubscribeFromMetaobjectTopic(admin, item.type, item.topic);
            if (res.success) {
                appliedCount++;
            } else if (res.error) {
                errors.push(`Failed to unsubscribe ${item.topic} for ${item.type}: ${res.error}`);
            }
        }
    }

    if (errors.length > 0) {
        return json({
            status: "error",
            message: `Applied ${appliedCount} change(s), but encountered ${errors.length} error(s): ${errors.slice(0, 2).join(", ")}`,
        });
    }

    return json({
        status: "success",
        message: `Successfully saved ${appliedCount} webhook change(s) in Shopify!`,
    });
};

export default function MetaobjectWebhooksPage() {
    const { metaobjects, allDefinitions, subscriptionsMap, pagination } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const submit = useSubmit();
    const navigation = useNavigation();
    const [, setSearchParams] = useSearchParams();

    const [mounted, setMounted] = useState(false);
    const [searchInputValue, setSearchInputValue] = useState(pagination.searchQuery);
    const [toastActive, setToastActive] = useState(false);

    // Local client-side state for event selections across definitions
    const [localSubs, setLocalSubs] = useState<Record<string, MetaobjectEventsState>>(subscriptionsMap);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Synchronize local state with server when loader updates
    useEffect(() => {
        setLocalSubs(subscriptionsMap);
    }, [subscriptionsMap]);

    useEffect(() => {
        if (actionData?.status === "success") {
            setToastActive(true);
        }
    }, [actionData]);

    const isLoading = navigation.state !== "idle";
    const isSaving = navigation.state === "submitting";

    const toggleToast = () => setToastActive((active) => !active);

    const updateParams = useCallback(
        (newParams: Record<string, string>) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                Object.entries(newParams).forEach(([key, value]) => {
                    if (!value && key === "search") next.delete(key);
                    else next.set(key, value);
                });
                return next;
            });
        },
        [setSearchParams]
    );

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchInputValue !== pagination.searchQuery) {
                updateParams({ search: searchInputValue, page: "1" });
            }
        }, 350);
        return () => clearTimeout(handler);
    }, [searchInputValue, pagination.searchQuery, updateParams]);

    // Calculate diff between local state and server state
    const pendingChanges = useMemo(() => {
        const diff: Array<{ type: string; topic: MetaobjectTopic; enable: boolean }> = [];

        for (const def of allDefinitions) {
            const initial = subscriptionsMap[def.type] || { create: false, update: false, delete: false };
            const current = localSubs[def.type] || { create: false, update: false, delete: false };

            if (current.create !== initial.create) {
                diff.push({ type: def.type, topic: "METAOBJECTS_CREATE", enable: current.create });
            }
            if (current.update !== initial.update) {
                diff.push({ type: def.type, topic: "METAOBJECTS_UPDATE", enable: current.update });
            }
            if (current.delete !== initial.delete) {
                diff.push({ type: def.type, topic: "METAOBJECTS_DELETE", enable: current.delete });
            }
        }

        return diff;
    }, [allDefinitions, subscriptionsMap, localSubs]);

    const isDirty = pendingChanges.length > 0;

    // Toggle individual event in local state
    const handleToggleLocal = (type: string, field: "create" | "update" | "delete") => {
        setLocalSubs((prev) => {
            const current = prev[type] || { create: false, update: false, delete: false };
            return {
                ...prev,
                [type]: {
                    ...current,
                    [field]: !current[field],
                },
            };
        });
    };

    // Toggle all 3 events for a specific definition
    const handleRowAll = (type: string, enable: boolean) => {
        setLocalSubs((prev) => ({
            ...prev,
            [type]: {
                create: enable,
                update: enable,
                delete: enable,
            },
        }));
    };

    // Global Select All / Clear All
    const handleSelectAll = () => {
        setLocalSubs((prev) => {
            const next = { ...prev };
            for (const def of allDefinitions) {
                next[def.type] = { create: true, update: true, delete: true };
            }
            return next;
        });
    };

    const handleClearAll = () => {
        setLocalSubs((prev) => {
            const next = { ...prev };
            for (const def of allDefinitions) {
                next[def.type] = { create: false, update: false, delete: false };
            }
            return next;
        });
    };

    // Discard all unsaved changes
    const handleDiscard = () => {
        setLocalSubs(subscriptionsMap);
    };

    // Save changes by submitting to action
    const handleSave = () => {
        if (!isDirty) return;
        const formData = new FormData();
        formData.append("changes", JSON.stringify(pendingChanges));
        submit(formData, { method: "post" });
    };

    const hasNext = pagination.page < pagination.totalPages;
    const hasPrevious = pagination.page > 1;

    const resourceName = {
        singular: "Metaobject Definition",
        plural: "Metaobject Definitions",
    };

    const toastMarkup = toastActive ? (
        <Toast content={actionData?.message || "Success"} onDismiss={toggleToast} duration={2500} />
    ) : null;

    return (
        <Frame>
            <Page>
                <TitleBar title="Metaobject Webhook Settings" />

                <BlockStack gap="500">
                    <Banner tone="info">
                        <p>
                            Configure custom webhooks for each metaobject definition. Toggle{" "}
                            <strong>Create</strong>, <strong>Update</strong>, or <strong>Remove</strong>{" "}
                            events, then click <strong>Save Settings</strong> to apply your changes to Shopify.
                        </p>
                    </Banner>

                    {actionData?.status === "error" && (
                        <Banner tone="critical" title="Save Error">
                            <p>{actionData.message}</p>
                        </Banner>
                    )}

                    <Layout>
                        <Layout.Section>
                            {mounted ? (
                                <Card>
                                    <BlockStack gap="400">
                                        {/* Header Bar */}
                                        <InlineStack align="space-between" blockAlign="center">
                                            <BlockStack gap="100">
                                                <Text variant="headingMd" as="h2">
                                                    🧩 Metaobject Webhook Subscriptions
                                                </Text>
                                                <Text as="p" variant="bodySm" tone="subdued">
                                                    Configure which events trigger webhook notifications for each metaobject.
                                                </Text>
                                            </BlockStack>
                                            <InlineStack gap="200" blockAlign="center">
                                                <Badge tone="info">{`${pagination.totalItems} definitions`}</Badge>
                                                {isDirty && (
                                                    <Badge tone="warning">
                                                        {`${pendingChanges.length} unsaved change${pendingChanges.length > 1 ? "s" : ""}`}
                                                    </Badge>
                                                )}
                                            </InlineStack>
                                        </InlineStack>

                                        <Divider />

                                        {/* Search & Bulk Controls */}
                                        <InlineStack align="space-between" blockAlign="center">
                                            <div style={{ flex: 1, maxWidth: "360px" }}>
                                                <TextField
                                                    label=""
                                                    labelHidden
                                                    placeholder="Search metaobjects by name or type..."
                                                    value={searchInputValue}
                                                    onChange={setSearchInputValue}
                                                    autoComplete="off"
                                                    clearButton
                                                    onClearButtonClick={() => setSearchInputValue("")}
                                                    prefix="🔍"
                                                />
                                            </div>
                                            {/* <InlineStack gap="200">
                                                <Button size="slim" onClick={handleSelectAll}>
                                                    Select All
                                                </Button>
                                                <Button size="slim" onClick={handleClearAll}>
                                                    Clear All
                                                </Button>
                                                {isDirty && (
                                                    <Button size="slim" onClick={handleDiscard}>
                                                        Discard
                                                    </Button>
                                                )}
                                            </InlineStack> */}
                                        </InlineStack>

                                        {/* Metaobjects Table */}
                                        {metaobjects.length === 0 ? (
                                            <Box padding="800">
                                                <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                                                    No metaobjects found matching "{searchInputValue}"
                                                </Text>
                                            </Box>
                                        ) : (
                                            <div>
                                                <IndexTable
                                                    resourceName={resourceName}
                                                    itemCount={metaobjects.length}
                                                    headings={[
                                                        { title: "Metaobject" },
                                                        { title: "Event Subscriptions (Create / Update / Remove)" },
                                                        { title: "Status" },
                                                        { title: "Quick Actions" },
                                                    ]}
                                                    selectable={false}
                                                    pagination={{
                                                        hasNext,
                                                        hasPrevious,
                                                        onNext: () =>
                                                            updateParams({
                                                                page: String(pagination.page + 1),
                                                            }),
                                                        onPrevious: () =>
                                                            updateParams({
                                                                page: String(pagination.page - 1),
                                                            }),
                                                        label: `Page ${pagination.page} of ${pagination.totalPages}`,
                                                    }}
                                                >
                                                    {metaobjects.map(({ id, name, type }, index) => {
                                                        const current = localSubs[type] || {
                                                            create: false,
                                                            update: false,
                                                            delete: false,
                                                        };
                                                        const initial = subscriptionsMap[type] || {
                                                            create: false,
                                                            update: false,
                                                            delete: false,
                                                        };
                                                        const activeCount =
                                                            (current.create ? 1 : 0) +
                                                            (current.update ? 1 : 0) +
                                                            (current.delete ? 1 : 0);

                                                        const hasRowChanges =
                                                            current.create !== initial.create ||
                                                            current.update !== initial.update ||
                                                            current.delete !== initial.delete;

                                                        return (
                                                            <IndexTable.Row key={id} id={id} position={index}>
                                                                {/* Column 1: Definition Name & Type */}
                                                                <IndexTable.Cell>
                                                                    <BlockStack gap="050">
                                                                        <InlineStack gap="150" blockAlign="center">
                                                                            <Text variant="bodyMd" fontWeight="bold" as="span">
                                                                                {name}
                                                                            </Text>
                                                                            {hasRowChanges && (
                                                                                <Badge tone="warning" size="small">
                                                                                    Modified
                                                                                </Badge>
                                                                            )}
                                                                        </InlineStack>
                                                                        <Text as="span" variant="bodyXs" tone="subdued">
                                                                            type: <code>{type}</code>
                                                                        </Text>
                                                                    </BlockStack>
                                                                </IndexTable.Cell>

                                                                {/* Column 2: Create, Update, Remove Event Checkboxes */}
                                                                <IndexTable.Cell>
                                                                    <InlineStack gap="300" blockAlign="center">
                                                                        {/* Create */}
                                                                        <div
                                                                            style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                padding: "6px 10px",
                                                                                borderRadius: "6px",
                                                                                background: current.create ? "#e0e7ff" : "#f1f5f9",
                                                                                border: current.create
                                                                                    ? "1px solid #818cf8"
                                                                                    : "1px solid #cbd5e1",
                                                                                cursor: "pointer",
                                                                                userSelect: "none",
                                                                            }}
                                                                            onClick={() => handleToggleLocal(type, "create")}
                                                                        >
                                                                            <Checkbox
                                                                                label="Create"
                                                                                checked={current.create}
                                                                                onChange={() => handleToggleLocal(type, "create")}
                                                                                id={`check-create-${type}`}
                                                                            />
                                                                        </div>

                                                                        {/* Update */}
                                                                        <div
                                                                            style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                padding: "6px 10px",
                                                                                borderRadius: "6px",
                                                                                background: current.update ? "#e0e7ff" : "#f1f5f9",
                                                                                border: current.update
                                                                                    ? "1px solid #818cf8"
                                                                                    : "1px solid #cbd5e1",
                                                                                cursor: "pointer",
                                                                                userSelect: "none",
                                                                            }}
                                                                            onClick={() => handleToggleLocal(type, "update")}
                                                                        >
                                                                            <Checkbox
                                                                                label="Update"
                                                                                checked={current.update}
                                                                                onChange={() => handleToggleLocal(type, "update")}
                                                                                id={`check-update-${type}`}
                                                                            />
                                                                        </div>

                                                                        {/* Remove */}
                                                                        <div
                                                                            style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                padding: "6px 10px",
                                                                                borderRadius: "6px",
                                                                                background: current.delete ? "#e0e7ff" : "#f1f5f9",
                                                                                border: current.delete
                                                                                    ? "1px solid #818cf8"
                                                                                    : "1px solid #cbd5e1",
                                                                                cursor: "pointer",
                                                                                userSelect: "none",
                                                                            }}
                                                                            onClick={() => handleToggleLocal(type, "delete")}
                                                                        >
                                                                            <Checkbox
                                                                                label="Remove"
                                                                                checked={current.delete}
                                                                                onChange={() => handleToggleLocal(type, "delete")}
                                                                                id={`check-delete-${type}`}
                                                                            />
                                                                        </div>
                                                                    </InlineStack>
                                                                </IndexTable.Cell>

                                                                {/* Column 3: Status Badge */}
                                                                <IndexTable.Cell>
                                                                    {activeCount === 3 ? (
                                                                        <Badge tone="success">All 3 Active</Badge>
                                                                    ) : activeCount > 0 ? (
                                                                        <Badge tone="attention">{`${activeCount} / 3 Active`}</Badge>
                                                                    ) : (
                                                                        <Badge>Inactive</Badge>
                                                                    )}
                                                                </IndexTable.Cell>

                                                                {/* Column 4: Row-level Quick Actions */}
                                                                <IndexTable.Cell>
                                                                    <InlineStack gap="200" blockAlign="center">
                                                                        {activeCount < 3 && (
                                                                            <Button
                                                                                size="slim"
                                                                                variant="plain"
                                                                                onClick={() => handleRowAll(type, true)}
                                                                            >
                                                                                Enable All
                                                                            </Button>
                                                                        )}
                                                                        {activeCount > 0 && (
                                                                            <Button
                                                                                size="slim"
                                                                                variant="plain"
                                                                                tone="critical"
                                                                                onClick={() => handleRowAll(type, false)}
                                                                            >
                                                                                Clear
                                                                            </Button>
                                                                        )}
                                                                    </InlineStack>
                                                                </IndexTable.Cell>
                                                            </IndexTable.Row>
                                                        );
                                                    })}
                                                </IndexTable>
                                            </div>
                                        )}

                                        <Divider />

                                        {/* Save Changes Footer Bar */}
                                        <InlineStack align="space-between" blockAlign="center">
                                            <InlineStack gap="200" blockAlign="center">
                                                {!isDirty ? (
                                                    <InlineStack gap="100" blockAlign="center">
                                                        <Icon source={CheckCircleIcon} tone="success" />
                                                        <Text as="span" tone="success" variant="bodySm">
                                                            All settings synced with Shopify
                                                        </Text>
                                                    </InlineStack>
                                                ) : (
                                                    <Text as="span" tone="caution" variant="bodySm" fontWeight="semibold">
                                                        ⚠️ You have {pendingChanges.length} unsaved change{pendingChanges.length > 1 ? "s" : ""}
                                                    </Text>
                                                )}
                                            </InlineStack>

                                            <InlineStack gap="300" blockAlign="center">
                                                {isDirty && (
                                                    <Button onClick={handleDiscard} disabled={isSaving}>
                                                        Discard Changes
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="primary"
                                                    tone="success"
                                                    disabled={!isDirty}
                                                    loading={isSaving}
                                                    onClick={handleSave}
                                                >
                                                    Save Settings
                                                </Button>
                                            </InlineStack>
                                        </InlineStack>
                                    </BlockStack>
                                </Card>
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        padding: "3rem",
                                    }}
                                >
                                    <Spinner accessibilityLabel="Loading metaobjects" size="large" />
                                </div>
                            )}
                        </Layout.Section>
                    </Layout>
                </BlockStack>
                {toastMarkup}
            </Page>
        </Frame>
    );
}