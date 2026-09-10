/**
 * Metaobject Cleanup Service
 * ──────────────────────────
 * Decoupled maintenance utility to purge metaobject event logs older than 30 days.
 * This is deliberately isolated from the webhook ingestion and processing hot-paths
 * so it never blocks or slows down webhook handling.
 *
 * Can be run via a scheduled cron job or maintenance CLI.
 */

type AdminClient = {
    graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
};

export async function cleanupOldLogs(admin: AdminClient): Promise<{ deleted: number }> {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString().split(".")[0] + "Z";
        const searchQuery = `fields.createdAt:<'${cutoffDate}'`;

        console.log(`[Cleanup] ── Looking for logs older than ${cutoffDate}`);

        let hasNextPage = true;
        let cursor: string | null = null;
        let totalDeleted = 0;
        let pageNum = 0;

        const listQuery = `#graphql
            query GetOldMetaobjectLogs($cursor: String, $searchQuery: String!) {
                metaobjects(
                    type: "flow_email_notification__"
                    sortKey: "updated_at"
                    query: $searchQuery
                    first: 250
                    after: $cursor
                ) {
                    pageInfo { hasNextPage endCursor }
                    nodes {
                        id
                        createdAt: field(key: "createdAt") { value }
                        updatedAt
                    }
                }
            }`;

        const deleteMutation = `#graphql
            mutation DeleteMetaobjectLog($id: ID!) {
                metaobjectDelete(id: $id) {
                    deletedId
                    userErrors { message }
                }
            }`;

        while (hasNextPage) {
            pageNum++;
            console.log(`[Cleanup] ── Page ${pageNum} (cursor=${cursor ?? "start"})`);

            const response = await admin.graphql(listQuery, {
                variables: { cursor, searchQuery },
            });
            const body = await response.json();

            if (body.errors) {
                console.error(`[Cleanup] ❌ GraphQL errors on page ${pageNum}:`, body.errors);
                break;
            }

            const conn = body.data?.metaobjects;
            const nodes: Array<{ id: string; createdAt?: { value?: string }; updatedAt?: string }> =
                conn?.nodes ?? [];

            console.log(`[Cleanup] ℹ️  Page ${pageNum}: ${nodes.length} node(s) returned`);

            if (nodes.length === 0) break;

            for (const node of nodes) {
                const dateStr = node.createdAt?.value || node.updatedAt;
                if (!dateStr) {
                    console.log(`[Cleanup]   → SKIP id=${node.id} — no date field`);
                    continue;
                }
                const nodeDate = new Date(dateStr);
                if (isNaN(nodeDate.getTime())) {
                    console.log(`[Cleanup]   → SKIP id=${node.id} — invalid date "${dateStr}"`);
                    continue;
                }
                if (nodeDate > thirtyDaysAgo) {
                    console.log(`[Cleanup]   → SKIP id=${node.id} — within 30 days (safety guard)`);
                    continue;
                }

                console.log(`[Cleanup]   → DELETE id=${node.id} date=${dateStr}`);
                const deleteResp = await admin.graphql(deleteMutation, { variables: { id: node.id } });
                const deleteBody = await deleteResp.json();
                const deleteErrors: Array<{ message: string }> =
                    deleteBody.data?.metaobjectDelete?.userErrors ?? [];

                if (deleteErrors.length > 0) {
                    console.error(`[Cleanup]   ❌ DELETE FAILED id=${node.id}: ${deleteErrors.map((e) => e.message).join(", ")}`);
                    continue;
                }
                totalDeleted++;
            }

            hasNextPage = conn?.pageInfo?.hasNextPage ?? false;
            cursor = conn?.pageInfo?.endCursor ?? null;
        }

        console.log(`[Cleanup] ✅ Done — deleted=${totalDeleted} entries older than 30 days`);
        return { deleted: totalDeleted };

    } catch (err) {
        console.error(`[Cleanup] ❌ Threw unexpected error:`, err);
        return { deleted: 0 };
    }
}
