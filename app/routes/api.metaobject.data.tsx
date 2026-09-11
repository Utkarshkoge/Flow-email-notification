import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

const METAOBJECT_TYPE = "flow_email_notification__";
const PAGE_SIZE = 50; // Shopify max per page

/**
 * GET /api/metaobject/data?cursor=<endCursor>
 *
 * Fetches up to PAGE_SIZE metaobject entries older than 30 days,
 * deletes them, and returns pagination info so the frontend can
 * keep calling until hasNextPage is false.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") || null;

  // ISO timestamp for 30 days ago
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // ── 1. Fetch a page of entries older than 30 days ──────────────────────────
  const fetchRes = await admin.graphql(
    `#graphql
    query FetchOldMetaobjects(
      $type: String!
      $query: String!
      $first: Int!
      $after: String
    ) {
      metaobjects(
        type: $type
        query: $query
        first: $first
        after: $after
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
          }
        }
      }
    }`,
    {
      variables: {
        type: METAOBJECT_TYPE,
        // Filter by the stored createdAt field (date_time type stored as ISO string)
        query: `fields.createdAt:<${thirtyDaysAgo}`,
        first: PAGE_SIZE,
        after: cursor,
      },
    }
  );

  const fetchData = await fetchRes.json();
  const metaobjects = fetchData.data?.metaobjects;

  if (!metaobjects) {
    return json({
      deleted: 0,
      hasNextPage: false,
      endCursor: null,
      errors: [fetchData.errors?.[0]?.message ?? "Failed to fetch metaobjects"],
    });
  }

  const ids: string[] = metaobjects.edges.map(
    (edge: { node: { id: string } }) => edge.node.id
  );

  if (ids.length === 0) {
    return json({ deleted: 0, hasNextPage: false, endCursor: null, errors: [] });
  }

  // ── 2. Delete each one (Shopify has no bulk delete for metaobjects) ─────────
  const deleteErrors: string[] = [];
  let deletedCount = 0;

  for (const id of ids) {
    const delRes = await admin.graphql(
      `#graphql
      mutation DeleteMetaobject($id: ID!) {
        metaobjectDelete(id: $id) {
          deletedId
          userErrors {
            field
            message
          }
        }
      }`,
      { variables: { id } }
    );

    const delData = await delRes.json();
    const userErrors = delData.data?.metaobjectDelete?.userErrors ?? [];
    if (userErrors.length > 0) {
      deleteErrors.push(
        `${id}: ${userErrors.map((e: { message: string }) => e.message).join(", ")}`
      );
    } else {
      deletedCount++;
    }
  }

  // ── 3. Return pagination info so the frontend knows whether to fetch more ───
  return json({
    deleted: deletedCount,
    hasNextPage: metaobjects.pageInfo.hasNextPage,
    endCursor: metaobjects.pageInfo.endCursor ?? null,
    errors: deleteErrors,
  });
};
