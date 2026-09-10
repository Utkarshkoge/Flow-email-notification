import { LoaderFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

const EMPTY = { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };

export const loader = async ({ request }: LoaderFunctionArgs) => {
    let admin;
    try {
        const auth = await authenticate.admin(request);
        admin = auth.admin;
    } catch {
        // Session not available (e.g. called before auth redirect completes)
        return json(EMPTY);
    }

    const url = new URL(request.url);
    const after = url.searchParams.get("after");

    try {
        const metaRes = await admin.graphql(
            `#graphql
            query getMetaobjectStats($type: String!, $after: String) {
              metaobjects(type: $type, first: 250, after: $after) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  resourceTypeField: field(key: "resourceType") {
                    value
                  }
                }
              }
            }`,
            {
                variables: {
                    type: "flow_email_notification__",
                    after: after || null
                }
            }
        );

        const metaData = await metaRes.json();
        return json(metaData.data?.metaobjects || EMPTY);
    } catch (err) {
        console.error("[api/webhook-types] GraphQL error:", err);
        return json(EMPTY);
    }
};
