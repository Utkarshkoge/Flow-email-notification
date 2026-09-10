import type { LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  InlineStack,
  InlineGrid,
  Badge,
  Icon,
} from "@shopify/polaris";
import {
  AutomationIcon,
  ListBulletedIcon,
  PackageIcon,
  EmailNewsletterIcon,
} from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  const navigate = useNavigate();

  return (
    <Page>
      <TitleBar title="Dashboard" />

      <BlockStack gap="500">
        <Layout>
          {/* Header Section */}
          <Layout.Section>
            <Card roundedAbove="sm">
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="200">
                    <Text as="h1" variant="headingLg">
                      Flow Email Notification
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Your complete solution for tracking store events and triggering automated emails. Seamlessly integrated with Shopify Flow. Webhook logs are securely retained for 30 days.
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Core Routes Section */}
          <Layout.Section>
            <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
              {/* Event Logs Card */}
              <Card roundedAbove="sm">
                <BlockStack gap="400">
                  <InlineStack align="start">
                    <Box
                      padding="200"
                      background="bg-surface-secondary"
                      borderRadius="200"
                    >
                      <Icon source={ListBulletedIcon} tone="info" />
                    </Box>
                  </InlineStack>
                  <BlockStack gap="200">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h2" variant="headingMd">Event Logs</Text>
                    </InlineStack>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Browse and filter all captured webhook events. View detailed payload information for each event.
                    </Text>
                  </BlockStack>
                  <Button
                    onClick={() => navigate("/app/logs")}
                  >
                    View Logs
                  </Button>
                </BlockStack>
              </Card>

              {/* Notification Settings Card */}
              <Card roundedAbove="sm">
                <BlockStack gap="400">
                  <InlineStack align="start">
                    <Box
                      padding="200"
                      background="bg-surface-secondary"
                      borderRadius="200"
                    >
                      <Icon source={EmailNewsletterIcon} tone="warning" />
                    </Box>
                  </InlineStack>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">Notification Settings</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Control which resource types trigger email notifications. Unselected types are skipped entirely.
                    </Text>
                  </BlockStack>
                  <Button onClick={() => navigate("/app/notification-settings")}>
                    Configure
                  </Button>
                </BlockStack>
              </Card>

              {/* Metaobjects Card */}
              <Card roundedAbove="sm">
                <BlockStack gap="400">
                  <InlineStack align="start">
                    <Box
                      padding="200"
                      background="bg-surface-secondary"
                      borderRadius="200"
                    >
                      <Icon source={PackageIcon} tone="success" />
                    </Box>
                  </InlineStack>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">Metaobjects</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Subscribe or unsubscribe specific metaobject types to control tracking and enable email notifications.                    </Text>
                  </BlockStack>
                  <Button
                    onClick={() => navigate("/app/metaobjects")}
                  >
                    Manage Metaobjects
                  </Button>
                </BlockStack>
              </Card>

              {/* Shopify Flow Setup Card */}
              <Card roundedAbove="sm">
                <BlockStack gap="400">
                  <InlineStack align="start">
                    <Box
                      padding="200"
                      background="bg-surface-secondary"
                      borderRadius="200"
                    >
                      <Icon source={AutomationIcon} tone="magic" />
                    </Box>
                  </InlineStack>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">Shopify Flow</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Connect to Shopify Flow to dispatch highly-customized email alerts based on real-time store events.
                    </Text>
                  </BlockStack>
                  <Button
                    onClick={() => navigate("/app/flow-settings")}
                  >
                    Setup Workflow
                  </Button>
                </BlockStack>
              </Card>


            </InlineGrid>
          </Layout.Section>

          {/* How It Works Section */}
          <Layout.Section>
            <Card roundedAbove="sm">
              <BlockStack gap="500">
                <Text as="h2" variant="headingLg">
                  How it works
                </Text>

                <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
                  {[
                    { step: "01", title: "Observe", desc: "Detect background webhook events from Shopify in real-time" },
                    { step: "02", title: "Record", desc: "Securely log incoming data for auditing and debugging" },
                    { step: "03", title: "Alert", desc: "Fire Shopify Flow triggers for instant email alerts" },
                  ].map((item) => (
                    <BlockStack key={item.step} gap="300">
                      <InlineStack gap="300" align="start" blockAlign="center">
                        <Box
                          background="bg-surface-success"
                          padding="100"
                          borderRadius="full"
                        >
                          <Box paddingInlineStart="200" paddingInlineEnd="200">
                            <Text as="span" variant="bodySm" tone="success" fontWeight="bold">
                              {item.step}
                            </Text>
                          </Box>
                        </Box>
                        <Text as="h3" variant="headingMd" fontWeight="semibold">
                          {item.title}
                        </Text>
                      </InlineStack>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {item.desc}
                      </Text>
                    </BlockStack>
                  ))}
                </InlineGrid>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}