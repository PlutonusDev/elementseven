import { appUrl } from "@/lib/env";
import { formatCents } from "@/lib/format";

export type EmailContent = { subject: string; html: string };

export type OrderEmailData = {
  number: string;
  shipName: string;
  shipLine1: string;
  shipLine2: string | null;
  shipSuburb: string;
  shipState: string;
  shipPostcode: string;
  shippingMethod: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  items: Array<{ name: string; variantLabel: string; quantity: number; unitPriceCents: number }>;
};

const INK = "#17191c";
const PAPER = "#f7f7f5";
const MIST = "#e5e6e2";
const SLATE = "#5f6570";
const NITRO = "#2e45ff";
const AMBER = "#ff7a1a";

const FONT = "'Space Grotesk','Segoe UI',Helvetica,Arial,sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type LayoutOptions = {
  reason: string;
  unsubscribeUrl?: string;
  preheader?: string;
};

export function emailLayout(heading: string, bodyHtml: string, options: LayoutOptions): string {
  const year = new Date().getFullYear();
  const preheader = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(options.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : "";

  const unsubscribe = options.unsubscribeUrl
    ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:14px auto 0 auto;">
        <tr><td style="border:1px solid ${MIST};background:#ffffff;">
          <a href="${options.unsubscribeUrl}" style="display:inline-block;padding:8px 20px;font-family:${FONT};font-size:12px;font-weight:600;color:${SLATE};text-decoration:none;">Unsubscribe</a>
        </td></tr>
      </table>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <title>Element Seven</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};font-family:${FONT};color:${INK};-webkit-text-size-adjust:100%;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:36px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="height:5px;line-height:5px;font-size:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td width="70%" style="background:${NITRO};height:5px;line-height:5px;font-size:0;">&nbsp;</td>
              <td width="30%" style="background:${AMBER};height:5px;line-height:5px;font-size:0;">&nbsp;</td>
            </tr></table>
          </td>
        </tr>

        <tr>
          <td style="background:${INK};padding:22px 36px;">
            <a href="${appUrl()}" style="text-decoration:none;">
              <img src="${appUrl()}/logo-white.png" alt="Element Seven" height="36" style="height:36px;width:auto;display:block;border:0;" />
            </a>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;border-left:1px solid ${MIST};border-right:1px solid ${MIST};padding:36px;">
            ${heading ? `<h1 style="margin:0 0 18px 0;font-family:${FONT};font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:${INK};">${escapeHtml(heading)}</h1>` : ""}
            ${bodyHtml}
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;border:1px solid ${MIST};border-top:2px solid ${INK};padding:22px 36px;text-align:center;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:${SLATE};">${options.reason}</p>
            ${unsubscribe}
            <p style="margin:14px 0 0 0;font-size:11px;color:${SLATE};">© ${year} Element Seven · Adults 18+ only</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const TRANSACTIONAL_REASON =
  "You're receiving this email because you made a purchase or have an account at Element Seven.";
const MARKETING_REASON =
  "You're receiving this email because you opted in to updates from Element Seven.";

function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>
    <td style="background:${AMBER};border:2px solid ${INK};">
      <a href="${url}" style="display:inline-block;padding:13px 32px;font-family:${FONT};color:${INK};text-decoration:none;font-size:14px;font-weight:700;">${escapeHtml(label)}</a>
    </td>
  </tr></table>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.7;color:${INK};">${text}</p>`;
}

function muted(text: string): string {
  return `<p style="margin:0;font-size:12px;line-height:1.6;color:${SLATE};">${text}</p>`;
}

function sectionLabel(text: string): string {
  return `<p style="margin:26px 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${SLATE};">
    <span style="display:inline-block;width:5px;height:11px;background:${AMBER};margin-right:8px;vertical-align:-1px;">&nbsp;</span>${escapeHtml(text)}
  </p>`;
}

function orderTable(order: OrderEmailData): string {
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:11px 0;border-bottom:1px solid ${MIST};font-size:14px;color:${INK};">
          <span style="font-weight:600;">${escapeHtml(item.name)}</span><br/>
          <span style="color:${SLATE};font-size:12px;">${escapeHtml(item.variantLabel)} × ${item.quantity}</span>
        </td>
        <td align="right" style="padding:11px 0;border-bottom:1px solid ${MIST};font-size:14px;font-weight:600;white-space:nowrap;">${formatCents(item.unitPriceCents * item.quantity)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 0 0;">
    ${rows}
    <tr><td style="padding:12px 0 2px 0;font-size:13px;color:${SLATE};">Subtotal</td><td align="right" style="padding:12px 0 2px 0;font-size:13px;">${formatCents(order.subtotalCents)}</td></tr>
    <tr><td style="padding:2px 0;font-size:13px;color:${SLATE};">Shipping · ${escapeHtml(order.shippingMethod)}</td><td align="right" style="padding:2px 0;font-size:13px;">${order.shippingCents === 0 ? "Free" : formatCents(order.shippingCents)}</td></tr>
    <tr>
      <td style="padding:12px 0 0 0;font-size:16px;font-weight:700;border-top:2px solid ${INK};">Total</td>
      <td align="right" style="padding:12px 0 0 0;font-size:16px;font-weight:700;border-top:2px solid ${INK};">${formatCents(order.totalCents)}</td>
    </tr>
  </table>`;
}

function addressBlock(order: OrderEmailData): string {
  const line2 = order.shipLine2 ? `${escapeHtml(order.shipLine2)}<br/>` : "";
  return `<p style="margin:0;font-size:13px;line-height:1.7;color:${INK};">
    ${escapeHtml(order.shipName)}<br/>
    ${escapeHtml(order.shipLine1)}<br/>
    ${line2}
    ${escapeHtml(order.shipSuburb)} ${escapeHtml(order.shipState)} ${escapeHtml(order.shipPostcode)}
  </p>`;
}

export function magicLinkEmail(url: string): EmailContent {
  return {
    subject: "Your Element Seven sign-in link",
    html: emailLayout(
      "Sign in to Element Seven",
      `${paragraph("Use the button below to sign in to your account. This link expires in 15 minutes and can only be used once.")}
       ${button(url, "Sign in →")}
       ${muted("If you didn't request this, no action is needed - your account is secure.")}`,
      { reason: TRANSACTIONAL_REASON, preheader: "Your one-time sign-in link - expires in 15 minutes." },
    ),
  };
}

export function passwordResetEmail(url: string): EmailContent {
  return {
    subject: "Reset your Element Seven password",
    html: emailLayout(
      "Reset your password",
      `${paragraph("We received a request to reset the password on your account. This link expires in 1 hour.")}
       ${button(url, "Choose a new password →")}
       ${muted("If you didn't request this, you can safely ignore this email.")}`,
      { reason: TRANSACTIONAL_REASON, preheader: "Password reset link - expires in 1 hour." },
    ),
  };
}

export function orderConfirmationEmail(order: OrderEmailData, orderUrl: string): EmailContent {
  return {
    subject: `Order ${order.number} confirmed`,
    html: emailLayout(
      "Your order is confirmed",
      `${paragraph(`Thanks, payment for order <span style="font-weight:700;">${escapeHtml(order.number)}</span> has been received and it's now in the dispatch queue. We'll email you tracking as soon as it ships.`)}
       ${sectionLabel("Order summary")}
       ${orderTable(order)}
       ${sectionLabel("Shipping to")}
       ${addressBlock(order)}
       ${button(orderUrl, "View your order →")}`,
      { reason: TRANSACTIONAL_REASON, preheader: `Order ${order.number} confirmed, ${formatCents(order.totalCents)}.` },
    ),
  };
}

export function shippingConfirmationEmail(
  order: OrderEmailData,
  carrier: string,
  trackingNumber: string,
  trackingUrl: string | null,
): EmailContent {
  const trackHtml = trackingUrl
    ? button(trackingUrl, "Track your parcel →")
    : paragraph(`Tracking number: <span style="font-weight:700;">${escapeHtml(trackingNumber)}</span>`);
  return {
    subject: `Order ${order.number} has shipped`,
    html: emailLayout(
      "Your order is on its way",
      `${paragraph(`Order <span style="font-weight:700;">${escapeHtml(order.number)}</span> has been handed to ${escapeHtml(carrier)}.`)}
       ${paragraph(`Tracking number: <span style="font-weight:700;">${escapeHtml(trackingNumber)}</span>`)}
       ${trackHtml}
       ${sectionLabel("Shipping to")}
       ${addressBlock(order)}`,
      { reason: TRANSACTIONAL_REASON, preheader: `Order ${order.number} shipped via ${carrier}.` },
    ),
  };
}

export function orderCancelledEmail(order: OrderEmailData, reason: string): EmailContent {
  return {
    subject: `Order ${order.number} could not be fulfilled`,
    html: emailLayout(
      `About order ${order.number}`,
      `${paragraph(escapeHtml(reason))}
       ${paragraph("Your payment has been refunded in full. Refunds usually appear within 5-10 business days depending on your bank.")}
       ${sectionLabel("Refunded items")}
       ${orderTable(order)}`,
      { reason: TRANSACTIONAL_REASON, preheader: `Order ${order.number} refunded in full.` },
    ),
  };
}

export function accessApprovedEmail(firstName: string, shopUrl: string): EmailContent {
  return {
    subject: "You're approved - welcome to Element Seven",
    html: emailLayout(
      `You're in, ${escapeHtml(firstName)}`,
      `${paragraph("Your access application has been reviewed and <span style=\"font-weight:700;\">approved</span>. The full range - devices, liquids, imagery and pricing - is now unlocked on your account.")}
       ${button(shopUrl, "Start browsing →")}
       ${muted("Access is personal to your account and shouldn't be shared.")}`,
      { reason: TRANSACTIONAL_REASON, preheader: "Your access application was approved." },
    ),
  };
}

export function accessDeniedEmail(
  firstName: string,
  note: string | null,
  reapplyUrl: string,
): EmailContent {
  const noteHtml = note
    ? `${sectionLabel("Reviewer note")}${paragraph(escapeHtml(note))}`
    : "";
  return {
    subject: "About your Element Seven access application",
    html: emailLayout(
      `Hi ${escapeHtml(firstName)}`,
      `${paragraph("We've reviewed your access application and unfortunately couldn't approve it this time.")}
       ${noteHtml}
       ${paragraph("If your circumstances change, or you believe something in your application was incomplete, you're welcome to submit a new application.")}
       ${button(reapplyUrl, "Submit a new application")}`,
      { reason: TRANSACTIONAL_REASON, preheader: "An update on your access application." },
    ),
  };
}

const MERGE_TAGS = {
  firstName: /\{\{\s*first_name\s*\}\}/g,
  unsubscribeUrl: /\{\{\s*unsubscribe_url\s*\}\}/g,
};

export function renderCampaignHtml(
  htmlBody: string,
  data: { firstName: string; unsubscribeUrl: string },
): string {
  const merged = htmlBody
    .replace(MERGE_TAGS.firstName, escapeHtml(data.firstName))
    .replace(MERGE_TAGS.unsubscribeUrl, data.unsubscribeUrl);
  return emailLayout("", `<div style="font-size:14px;line-height:1.75;color:${INK};">${merged}</div>`, {
    reason: MARKETING_REASON,
    unsubscribeUrl: data.unsubscribeUrl,
  });
}
