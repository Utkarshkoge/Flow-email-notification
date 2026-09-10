import {
    Page,
    Layout,
    Card,
    BlockStack,
    Text,
    List,
    Button,
    InlineStack,
    Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import flowExport from "../assets/Flow Email Notification.flow?raw";

export default function FlowSettings() {
    const handleDownload = () => {
        const blob = new Blob([flowExport], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Flow Email Notification.flow";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Page>
            <TitleBar title="Configure Email Notifications" />
            <Layout>
                <Layout.Section>
                    <BlockStack gap="500">
                        <Card>
                            <BlockStack gap="400">
                                <Text as="h2" variant="headingMd">
                                    How to configure Shopify Flow for merchant emails
                                </Text>

                                <Text as="p">
                                    Follow these steps to import the workflow into your Shopify Flow app
                                    and set up the email notifications.
                                </Text>

                                <List type="number">
                                    <List.Item>
                                        <Text as="span">
                                            Download the pre-configured workflow file using the button below.
                                        </Text>
                                    </List.Item>
                                    <List.Item>
                                        <Text as="span">
                                            Open the <strong>Shopify Flow</strong> app in your Shopify admin panel.
                                        </Text>
                                    </List.Item>
                                    <List.Item>
                                        <Text as="span">
                                            Click on the <strong>Import</strong> button at the top right of the Flow app and select the downloaded <strong>Flow Email Notification.flow</strong> file.
                                        </Text>
                                    </List.Item>
                                    <List.Item>
                                        <Text as="span">
                                            After importing, click on the workflow to edit it.
                                        </Text>
                                    </List.Item>
                                    <List.Item>
                                        <Text as="span">
                                            Select the <strong>"Send internal email"</strong> action step in the workflow diagram.
                                        </Text>
                                    </List.Item>
                                    <List.Item>
                                        <Text as="span">
                                            In the configuration panel on the right, update the <strong>To</strong> or <strong>Address</strong> field with your desired merchant email address.
                                        </Text>
                                    </List.Item>
                                    <List.Item>
                                        <Text as="span">
                                            Click <strong>Turn on workflow</strong> to enable the email notifications.
                                        </Text>
                                    </List.Item>
                                </List>

                                <InlineStack>
                                    <Button
                                        variant="primary"
                                        onClick={handleDownload}
                                    >
                                        Download Workflow File
                                    </Button>
                                </InlineStack>
                            </BlockStack>
                        </Card>

                        <Banner title="Important Note" tone="info">
                            <p>
                                Ensure that you verify the email address configured in the action before turning the workflow on to prevent emails from going to an undesired recipient. By default, the imported workflow has a placeholder email.
                            </p>
                        </Banner>
                    </BlockStack>
                </Layout.Section>

            </Layout>
        </Page>
    );
}

