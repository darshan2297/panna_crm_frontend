/**
 * Refund slip copy + WhatsApp sharing for the CRM.
 *
 * Mirrors `panna_biryani/src/lib/refundSlip.ts` so the wording a customer
 * receives is identical whichever portal generated it. The two are separate npm
 * packages with no shared build, so the small overlap is deliberate rather than
 * accidental — keep the message format in step when changing either copy.
 *
 * Unlike the storefront (which shares *with* the restaurant), the CRM shares
 * the slip *to the customer*, so the wa.me target is their number.
 */

export interface RefundSlipData {
  amount: number | null | undefined;
  refundedAt: string | null | undefined;
  status: string | null | undefined;
  reference: string | null | undefined;
  receipt: string | null | undefined;
  gateway: string | null | undefined;
  reason: string | null | undefined;
}

const INR = (n: number | null | undefined): string =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const DISPLAY_DATE = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function gatewayLabel(gateway: string | null | undefined): string {
  const key = (gateway || "").toLowerCase();
  if (key.includes("razorpay")) return "Razorpay";
  if (key.includes("stripe")) return "Stripe";
  if (key.includes("paytm")) return "Paytm";
  return gateway || "Payment gateway";
}

/** True only when the gateway actually returned the money. */
export function isRefundComplete(status: string | null | undefined): boolean {
  return (status || "").toLowerCase() === "processed";
}

export function refundHeadline(status: string | null | undefined): string {
  const s = (status || "").toLowerCase();
  if (s === "processed") return "Refund processed";
  if (s === "pending") return "Refund initiated — processing";
  if (s === "failed") return "Refund could not be processed";
  return "Refund submitted";
}

/** Plain-text refund slip, ready to paste or send over WhatsApp. */
export function buildRefundSlipMessage(
  orderNumber: string,
  refund: RefundSlipData,
  brandName = "Panna Biryani"
): string {
  const lines: string[] = [
    `${brandName} — Refund Slip`,
    ``,
    `Order: ${orderNumber}`,
    `Status: ${refundHeadline(refund.status)}`,
    ``,
    `Refund amount: ${INR(refund.amount)}`,
    `Refunded via: ${gatewayLabel(refund.gateway)}`,
    `Date: ${DISPLAY_DATE(refund.refundedAt)}`,
  ];

  if (refund.reference) lines.push(`Refund ID: ${refund.reference}`);
  if (refund.receipt) lines.push(`Receipt: ${refund.receipt}`);
  if (refund.reason) lines.push(`Reason: ${refund.reason}`);

  lines.push(``);

  if (isRefundComplete(refund.status)) {
    lines.push(
      `This amount has been returned to your original payment method. ` +
        `It may take 5-7 working days to reflect in your bank statement.`
    );
  } else if ((refund.status || "").toLowerCase() === "pending") {
    lines.push(
      `Your bank is still processing the refund. It usually reflects within ` +
        `5-7 working days. Please contact us if it does not.`
    );
  } else {
    lines.push(
      `We could not process this refund automatically. Our team will resolve ` +
        `it and get back to you shortly.`
    );
  }

  lines.push(``, `Thank you for your order.`);
  return lines.join("\n");
}

/**
 * wa.me deep link addressed to the customer.
 *
 * Strips formatting characters and keeps the last 10 digits so numbers stored
 * as "+91 98765 43210" or with a leading 0 still resolve.
 */
export function buildCustomerWhatsAppUrl(phone: string, message: string): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.slice(-10)}?text=${encodeURIComponent(message)}`;
}