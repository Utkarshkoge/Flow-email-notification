import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");

  if (intent === "check_db_meta") {
    const response = await admin.graphql(
      `#graphql
            query checkMetaobjectDefinition($type: String!) {
              metaobjectDefinitionByType(type: $type) {
                id
                name
                type
              }
            }`,
      {
        variables: {
          type: "flow_email_notification__",
        },
      }
    );
    const data = await response.json();
    const exists = !!data.data?.metaobjectDefinitionByType;
    return json({ exists });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create_db_meta") {
    const response = await admin.graphql(
      `#graphql
            mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
              metaobjectDefinitionCreate(definition: $definition) {
                metaobjectDefinition {
                  id
                  name
                  type
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
      {
        variables: {
          definition: {
            name: "Flow Email Notification",
            type: "flow_email_notification__",
            fieldDefinitions: [
              { key: "topic", name: "Topic", type: "single_line_text_field", required: true },
              {
                key: "resourceType", name: "Resource Type", type: "single_line_text_field", required: true, capabilities: {
                  adminFilterable: { enabled: true }
                }
              },
              { key: "resourceId", name: "Resource ID", type: "single_line_text_field", required: true },
              { key: "eventAction", name: "Event Action", type: "single_line_text_field", required: true },
              { key: "payload", name: "Payload", type: "json", required: true },
              { key: "webhookId", name: "Webhook ID", type: "single_line_text_field", required: true },
              { key: "createdAt", name: "Created At", type: "date_time", required: true },
              { key: "changedBy", name: "Changed By", type: "single_line_text_field", required: true },
            ]
          }
        }
      }
    );

    const data = await response.json();
    return json(data);
  }

  if (intent === "add_info_meta") {
    const payloadStr = formData.get("payload") as string;
    const topic = formData.get("topic") as string;
    const resourceType = formData.get("resourceType") as string;
    const resourceId = formData.get("resourceId") as string;
    const eventAction = formData.get("eventAction") as string;
    const webhookId = formData.get("webhookId") as string;
    const createdAt = formData.get("createdAt") as string;
    const changedBy = formData.get("changedBy") as string;

    const response = await admin.graphql(
      `#graphql
            mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
              metaobjectCreate(metaobject: $metaobject) {
                metaobject {
                  id
                  handle
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
      {
        variables: {
          metaobject: {
            type: "flow_email_notification__",
            fields: [
              { key: "topic", value: topic },
              { key: "resourceType", value: resourceType },
              { key: "resourceId", value: resourceId },
              { key: "eventAction", value: eventAction },
              { key: "payload", value: payloadStr },
              { key: "webhookId", value: webhookId },
              { key: "createdAt", value: createdAt },
              { key: "changedBy", value: changedBy },
            ]
          }
        }
      }
    );
    const data = await response.json();
    return json(data);
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};
