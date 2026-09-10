export const generateEmailHtml = ({
  resourceType,
  eventType,
  createdAt,
  changedBy,
  payload,
}: {
  resourceType: string;
  eventType: string;
  createdAt: string;
  changedBy: string;
  payload: Record<string, unknown>;
}) => {
  // Build key-value rows from the minimal payload
  const detailRows = Object.entries(payload)
    .map(
      ([key, value]) =>
        `<tr>
          <td style="padding: 6px 12px; font-weight: 600; color: #333; white-space: nowrap; border-bottom: 1px solid #f0f0f0;">${formatLabel(key)}</td>
          <td style="padding: 6px 12px; color: #555; border-bottom: 1px solid #f0f0f0;">${escapeHtml(String(value ?? ""))}</td>
        </tr>`,
    )
    .join("\n");

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; background-color: #ffffff;">
  <h2 style="color: #333; margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Webhook Notification</h2>

  <div style="margin: 20px 0;">
    <p style="margin: 8px 0; color: #555;"><strong style="color: #333;">Resource Type:</strong> ${resourceType}</p>
    <p style="margin: 8px 0; color: #555;"><strong style="color: #333;">Event Type:</strong> ${eventType}</p>
    <p style="margin: 8px 0; color: #555;"><strong style="color: #333;">Changed By:</strong> ${changedBy}</p>
    <p style="margin: 8px 0; color: #555;"><strong style="color: #333;">Timestamp:</strong> ${createdAt}</p>
  </div>

  <div style="background-color: #f6f8fa; padding: 15px; border-radius: 6px; border: 1px solid #e1e4e8;">
    <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 14px; color: #586069; text-transform: uppercase; letter-spacing: 0.5px;">Key Details</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      ${detailRows || '<tr><td style="padding: 6px 12px; color: #999;">No additional details available</td></tr>'}
    </table>
  </div>
</div>
`;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert snake_case keys to Title Case labels */
function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Basic HTML escaping to prevent XSS in email body */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
