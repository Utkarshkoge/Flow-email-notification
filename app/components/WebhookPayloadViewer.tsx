import {
    BlockStack,
    Box,
    InlineStack,
    Text,
    Thumbnail,
    Badge,
    Divider,
    List,
    Card
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import React from "react";

interface WebhookPayloadViewerProps {
    payload: any;
    resourceType: string;
    topic?: string;
    changedBy?: string;
}

// ── Generic Field Renderer ──
// Recursively renders any JSON structure in a human-readable way
const RecursivePropertyViewer = ({ data, level = 0 }: { data: any, level?: number }) => {
    if (data === null || data === undefined) {
        return <Text as="span" tone="subdued">-</Text>;
    }

    if (typeof data !== 'object') {
        // Primitive values
        return <Text as="span" variant="bodyMd" fontWeight="medium">{String(data)}</Text>;
    }

    if (Array.isArray(data)) {
        if (data.length === 0) return <Text as="span" tone="subdued">Empty List</Text>;
        return (
            <BlockStack gap="200">
                {data.map((item, index) => (
                    <Box key={index} paddingInlineStart={level > 0 ? "400" : "0"} paddingBlockEnd="200" borderColor="border" borderStyle="dashed" borderBlockEndWidth="025">
                        <Box paddingBlock="100">
                            <Text as="span" tone="subdued" variant="bodySm">Item {index + 1}</Text>
                        </Box>
                        <RecursivePropertyViewer data={item} level={level + 1} />
                    </Box>
                ))}
            </BlockStack>
        );
    }

    // Object
    const keys = Object.keys(data);
    if (keys.length === 0) return <Text as="span" tone="subdued">Empty Object</Text>;

    return (
        <BlockStack gap="200">
            {keys.map((key) => {
                const value = data[key];
                const isComplex = typeof value === 'object' && value !== null;

                return (
                    <Box key={key} paddingInlineStart={level > 0 ? "400" : "0"}>
                        {isComplex ? (
                            <BlockStack gap="100">
                                <Text as="h4" variant="headingXs" tone="subdued">{key.replace(/_/g, ' ').toUpperCase()}</Text>
                                <Box borderInlineStartWidth="050" borderColor="border" paddingInlineStart="300">
                                    <RecursivePropertyViewer data={value} level={level + 1} />
                                </Box>
                            </BlockStack>
                        ) : (
                            <InlineStack gap="200" align="space-between">
                                <div className="payload-label">
                                    <Text as="span" tone="subdued">{key.replace(/_/g, ' ')}:</Text>
                                </div>
                                <Box>
                                    <RecursivePropertyViewer data={value} level={level + 1} />
                                </Box>
                            </InlineStack>
                        )}
                        <Box paddingBlockStart="100">
                            <Divider borderColor="border" />
                        </Box>
                    </Box>
                );
            })}
        </BlockStack>
    );
};


export function WebhookPayloadViewer({ payload, resourceType, topic }: WebhookPayloadViewerProps) {
    if (!payload) {
        return <Text as="p" tone="subdued">No payload data available</Text>;
    }

    // Common Header Generator
    const renderHeader = () => {
        if (resourceType === "Product") {
            const imageSrc = payload.image?.src || payload.images?.[0]?.src;
            return (
                <InlineStack gap="400" blockAlign="start">
                    {imageSrc ? (
                        <Thumbnail source={imageSrc} alt={payload.title} size="large" />
                    ) : (
                        <Thumbnail source={ImageIcon} alt="No image" size="large" />
                    )}
                    <BlockStack gap="200">
                        <Text as="h2" variant="headingLg">{payload.title}</Text>
                        <InlineStack gap="200">
                            {payload.status && (
                                <Badge tone={payload.status === 'active' ? 'success' : 'info'}>
                                    {payload.status}
                                </Badge>
                            )}
                            <Badge>{payload.product_type || "No Type"}</Badge>
                        </InlineStack>
                    </BlockStack>
                </InlineStack>
            );
        }

        if (resourceType === "Customer") {
            return (
                <InlineStack gap="400" align="start">
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--p-color-bg-surface-active)',
                            border: '1px solid var(--p-color-border)',
                        }}
                    >
                        <Text as="span" variant="headingXl">{(payload.first_name?.[0] || "C")}</Text>
                    </div>
                    <BlockStack gap="100">
                        <Text as="h2" variant="headingLg">{payload.first_name} {payload.last_name}</Text>
                        <Text as="p" tone="subdued">{payload.email}</Text>
                    </BlockStack>
                </InlineStack>
            );
        }

        if (resourceType === "Order" || topic?.includes("orders/")) {
            return (
                <InlineStack align="space-between">
                    <BlockStack gap="100">
                        <Text as="h2" variant="headingLg">Order {payload.name}</Text>
                        <Text as="p" tone="subdued">{new Date(payload.created_at).toLocaleString()}</Text>
                    </BlockStack>
                    <Badge tone={payload.financial_status === "paid" ? "success" : "attention"}>
                        {payload.financial_status}
                    </Badge>
                </InlineStack>
            );
        }

        if (resourceType === "Metaobject") {
            return (
                <BlockStack gap="100">
                    <Text as="h2" variant="headingLg">{(payload.handle)}</Text>
                    <Badge>{payload.type}</Badge>
                </BlockStack>
            );
        }

        return (
            <BlockStack gap="200">
                <Text as="h2" variant="headingLg">{resourceType} Details</Text>
                {topic && <Badge tone="info">{topic}</Badge>}
            </BlockStack>
        );
    };

    return (
        <BlockStack gap="200">
            {/* 1. Hero / Header Section */}
            <Card>
                <Box padding="400">
                    {renderHeader()}
                </Box>
            </Card>

            {/* 2. Full Data List Section */}
            <Card>
                <Box padding="400">
                    <BlockStack gap="400">
                        <Text as="h3" variant="headingMd">Full Payload Attributes</Text>
                        <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                            <RecursivePropertyViewer data={payload} />
                        </Box>
                    </BlockStack>
                </Box>
            </Card>
        </BlockStack>
    );
}
