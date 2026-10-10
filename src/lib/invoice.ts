"use client";

/**
 * Standard GST tax invoice for a Panna Biryani order.
 *
 * Renders a conventional Indian tax invoice: seller block (business name,
 * logo, full address, GSTIN, contact), buyer block, invoice meta
 * (number, date, payment method, gateway references), itemised table,
 * and a tax breakdown. Reused by the CRM order page and the storefront.
 */

export interface InvoiceItem {
  name: string;
  portion?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  free?: boolean;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  date: string; // ISO
  orderType?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  // Seller / business
  businessName?: string | null;
  tagline?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  city?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  // Buyer
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  // Amounts (tax-inclusive pricing model)
  subtotal: number;
  discount?: number;
  discountLabel?: string | null;
  deliveryFee: number;
  total: number;
  gstPercent?: number;
  gstAmount?: number | null;
  // Transaction
  gateway?: string | null;
  gatewayPaymentId?: string | null;
  gatewayOrderId?: string | null;
  refundId?: string | null;
  refundAmount?: number | null;
  refundedAt?: string | null;
  notes?: string | null;
  items: InvoiceItem[];
  /** Set false when downloading (avoid an unwanted print dialog). */
  autoPrint?: boolean;
}

const inr = (n: number | null | undefined) =>
  `₹${(Number(n) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Reverse-calculate GST already contained in a tax-inclusive amount. */
export function extractGst(amount: number, gstPercent: number) {
  if (!gstPercent || gstPercent <= 0 || !amount) return 0;
  return Number((amount - amount / (1 + gstPercent / 100)).toFixed(2));
}

/** Renders the invoice HTML string. */
function buildInvoiceHtml(data: InvoiceData): string {
  const gstPct = data.gstPercent ?? 0;
  const gst = data.gstAmount ?? extractGst(Math.max(0, data.subtotal - (data.discount || 0)), gstPct);
  const netGoods = Math.max(0, data.subtotal - (data.discount || 0)) - gst;
  const isRefunded = Boolean(data.refundId) || data.paymentStatus === "REFUNDED";

  const sellerLines = [
    data.address,
    [data.city, data.pincode].filter(Boolean).join(" - "),
    data.phone ? `Phone: ${data.phone}` : "",
    data.email ? `Email: ${data.email}` : "",
  ].filter(Boolean);

  const itemRows = data.items
    .map((it, i) => {
      const desc = [it.name, it.portion].filter(Boolean).join(" — ");
      return `<tr>
        <td class="c">${i + 1}</td>
        <td>${esc(desc)}${it.free ? ' <span class="tag">FREE</span>' : ""}</td>
        <td class="c">${it.quantity}</td>
        <td class="r">${inr(it.unitPrice)}</td>
        <td class="r">${inr(it.totalPrice)}</td>
      </tr>`;
    })
    .join("");

  const rows: string[] = [];
  rows.push(`<tr><td>Taxable value (incl. GST)</td><td class="r">${inr(netGoods + gst)}</td></tr>`);
  if (gst > 0) {
    rows.push(`<tr><td>CGST @ ${(gstPct / 2).toFixed(2)}%</td><td class="r">${inr(gst / 2)}</td></tr>`);
    rows.push(`<tr><td>SGST @ ${(gstPct / 2).toFixed(2)}%</td><td class="r">${inr(gst / 2)}</td></tr>`);
  }
  rows.push(`<tr class="total"><td>Total amount payable</td><td class="r">${inr(data.total)}</td></tr>`);

  const txnRows = [
    data.paymentMethod ? `<tr><td>Payment method</td><td>${esc(data.paymentMethod)}</td></tr>` : "",
    `<tr><td>Payment status</td><td>${esc(data.paymentStatus || "—")}</td></tr>`,
    data.gateway ? `<tr><td>Gateway</td><td>${esc(data.gateway)}</td></tr>` : "",
    data.gatewayOrderId
      ? `<tr><td>Gateway order ID</td><td class="m">${esc(data.gatewayOrderId)}</td></tr>`
      : "",
    data.gatewayPaymentId
      ? `<tr><td>Transaction / payment ID</td><td class="m">${esc(data.gatewayPaymentId)}</td></tr>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const refundBlock = isRefunded
    ? `<div class="refund">
         <b>REFUNDED</b> — ${inr(data.refundAmount ?? data.total)} returned to the customer
         via ${esc(data.gateway || "payment gateway")} on ${fmtDate(data.refundedAt)}.
         ${data.refundId ? `<br/>Refund reference: <span class="m">${esc(data.refundId)}</span>` : ""}
       </div>`
    : "";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Tax Invoice ${esc(data.invoiceNumber)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
       color:#111827;margin:0;padding:28px;background:#fff;font-size:12px}
  .sheet{max-width:820px;margin:0 auto}
  h1{font-size:20px;margin:0}
  .doc{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;font-weight:700}
  .hdr{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;
       border-bottom:2px solid #111827;padding-bottom:14px}
  .logo{max-width:150px;max-height:56px;object-fit:contain;margin-bottom:6px}
  .tag{font-size:9px;background:#ecfdf5;color:#047857;padding:1px 5px;border-radius:3px;font-weight:700}
  .muted{color:#6b7280;font-size:11px}
  .meta{margin-top:4px;font-size:11px;line-height:1.6}
  .meta b{color:#111827}
  .gst{display:inline-block;border:1px solid #111827;padding:3px 8px;font-size:11px;
       font-weight:700;margin-top:6px}
  .parties{display:flex;gap:24px;margin:16px 0;flex-wrap:wrap}
  .party{flex:1;min-width:240px;border:1px solid #e5e7eb;padding:11px 13px}
  .party h3{margin:0 0 6px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#6b7280}
  .party p{margin:0;font-size:11px;line-height:1.6}
  table{width:100%;border-collapse:collapse;font-size:11px;margin-top:6px}
  th,td{padding:7px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top}
  thead th{background:#f9fafb;font-size:10px;text-transform:uppercase;letter-spacing:.06em;
           text-align:left;border-bottom:1px solid #d1d5db}
  .r{text-align:right;white-space:nowrap}
  .c{text-align:center;width:34px}
  .m{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;word-break:break-all}
  .totals{margin-top:12px;margin-left:auto;width:min(320px,100%)}
  .totals td{border:0;padding:4px 8px}
  .totals tr.total td{border-top:2px solid #111827;font-weight:800;font-size:14px;padding-top:8px}
  .refund{border:1px solid #fca5a5;background:#fef2f2;color:#991b1b;padding:10px 12px;
          margin-top:14px;font-size:11px;line-height:1.6}
  .foot{margin-top:22px;padding-top:12px;border-top:1px solid #e5e7eb;
        display:flex;justify-content:space-between;gap:20px;font-size:10.5px;color:#6b7280}
  .terms{margin-top:14px;font-size:10px;color:#6b7280;line-height:1.6}
  @media print{body{padding:0}.noprint{display:none}}
</style></head><body>
<div class="sheet">
  <div class="hdr">
    <div>
      ${data.logoUrl ? `<img class="logo" src="${esc(data.logoUrl)}" alt=""/>` : ""}
      <h1>${esc(data.businessName || "Panna Biryani")}</h1>
      ${data.tagline ? `<div class="muted">${esc(data.tagline)}</div>` : ""}
      <div class="meta">${sellerLines.map(esc).join("<br/>")}</div>
      ${data.gstNumber ? `<div class="gst">GSTIN: ${esc(data.gstNumber)}</div>` : ""}
    </div>
    <div style="text-align:right">
      <div class="doc">Tax Invoice</div>
      <div class="meta">
        <b>Invoice No:</b> ${esc(data.invoiceNumber)}<br/>
        <b>Order No:</b> ${esc(data.orderNumber)}<br/>
        <b>Date:</b> ${fmtDate(data.date)}<br/>
        <b>Type:</b> ${esc(data.orderType || "Delivery")}
      </div>
    </div>
  </div>

  ${refundBlock}

  <div class="parties">
    <div class="party">
      <h3>Sold By</h3>
      <p><b>${esc(data.businessName || "Panna Biryani")}</b><br/>
      ${sellerLines.map(esc).join("<br/>")}
      ${data.gstNumber ? `<br/><b>GSTIN:</b> ${esc(data.gstNumber)}` : ""}</p>
    </div>
    <div class="party">
      <h3>Billed To</h3>
      <p><b>${esc(data.customerName || "Customer")}</b><br/>
      ${data.customerPhone ? `Phone: ${esc(data.customerPhone)}<br/>` : ""}
      ${data.customerAddress ? esc(data.customerAddress) : "—"}</p>
    </div>
  </div>

  <table>
    <thead><tr>
      <th class="c">#</th><th>Description</th><th class="c">Qty</th>
      <th class="r">Unit price</th><th class="r">Amount</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <table class="totals">
    <tbody>
      <tr><td>Items subtotal (incl. GST)</td><td class="r">${inr(data.subtotal)}</td></tr>
      ${
        data.discount && data.discount > 0
          ? `<tr><td>Discount${data.discountLabel ? ` (${esc(data.discountLabel)})` : ""}</td><td class="r">- ${inr(data.discount)}</td></tr>`
          : ""
      }
      <tr><td>Delivery charges</td><td class="r">${
        data.deliveryFee === 0 ? "FREE" : inr(data.deliveryFee)
      }</td></tr>
      ${rows.join("")}
    </tbody>
  </table>

  <div class="foot">
    <div>
      <b>Terms:</b> Goods once sold will not be taken back. Prices are inclusive of GST.
      Subject to Surat jurisdiction.
    </div>
    <div>
      <b>Authorised Signatory</b><br/>${esc(data.businessName || "Panna Biryani")}
    </div>
  </div>
  ${txnRows ? `<div class="terms"><b>Transaction details</b><table style="max-width:420px">${txnRows}</table></div>` : ""}
</div>
${
  data.autoPrint === false
    ? ""
    : "<script>window.addEventListener('load',function(){window.print()});</script>"
}
</body></html>`;
  return html;
}

/** Builds the tax-invoice HTML and returns it as a Blob URL (for download). */
function buildInvoiceUrl(data: InvoiceData): string {
  const blob = new Blob([buildInvoiceHtml(data)], { type: "text/html;charset=utf-8" });
  return URL.createObjectURL(blob);
}

/**
 * Prints an HTML document without opening a new browser tab/window.
 *
 * Uses a hidden same-origin iframe: the document is written into the frame and
 * `print()` is invoked on it, so the user goes straight to the print dialog and
 * the page they were on stays untouched (no extra tab in the tab strip).
 */
function printInHiddenFrame(html: string, fallbackName = "invoice") {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  iframe.style.display = "block";
  document.body.appendChild(iframe);

  const cleanup = () => {
    try {
      iframe.parentNode?.removeChild(iframe);
    } catch {
      /* already removed */
    }
  };

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    cleanup();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Let layout/fonts settle, then print. `afterprint` covers most browsers.
  const trigger = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error("Print failed", err);
      cleanup();
    }
  };

  iframe.contentWindow?.addEventListener("afterprint", cleanup, { once: true });
  // Fallback in case afterprint never fires (some browsers block it).
  window.setTimeout(trigger, 150);
  window.setTimeout(cleanup, 60000);
  void fallbackName;
}

/** Saves the tax invoice as a downloadable HTML file. */
export function downloadInvoiceHtml(data: InvoiceData) {
  const url = buildInvoiceUrl({ ...data, autoPrint: false });
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${data.invoiceNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke late so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Prints the invoice via a hidden iframe — no new tab/window is opened.
 * Printing the app page directly would include the dashboard chrome, so the
 * invoice is rendered into an isolated document instead.
 */
export function printInvoiceHtml(data: InvoiceData) {
  printInHiddenFrame(buildInvoiceHtml({ ...data, autoPrint: false }));
}

/* ------------------------------------------------------------------ */
/*  Kitchen Order Ticket (KOT) — small token print for the kitchen   */
/* ------------------------------------------------------------------ */

export interface KotData {
  orderNumber: string;
  date: string;
  platform?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  address?: string | null;
  orderType?: string | null;
  paymentStatus?: string | null;
  notes?: string | null;
  items: InvoiceItem[];
}

/**
 * Prints an 80mm Kitchen Order Ticket: items, portions and instructions
 * only — no prices (the kitchen doesn't need them).
 */
export function printKot(data: KotData) {
  const itemBlocks = data.items
    .map(
      (it) => `<div class="it">
        <div class="qn">${it.quantity}</div>
        <div>
          <div class="nm">${esc(it.name)}${it.free ? " (FREE)" : ""}</div>
          ${it.portion ? `<div class="po">${esc(it.portion)}</div>` : ""}
        </div>
      </div>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>KOT ${esc(data.orderNumber)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:"Courier New",ui-monospace,monospace;margin:0;padding:10px;
       width:80mm;background:#fff;color:#000;font-size:12px;line-height:1.4}
  .c{text-align:center}
  h1{font-size:15px;margin:0;letter-spacing:.08em}
  .sub{font-size:10px;color:#444;margin-top:1px}
  .no{font-size:14px;font-weight:700;margin:4px 0 1px}
  .dt{font-size:10.5px;color:#333}
  .line{border-top:1px dashed #999;margin:7px 0}
  .blk{font-size:11px}
  .it{display:flex;gap:7px;padding:5px 0;border-bottom:1px dotted #ccc}
  .it:last-child{border-bottom:0}
  .qn{min-width:26px;height:26px;border:2px solid #000;border-radius:50%;
      display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0}
  .nm{font-weight:700;font-size:12.5px;line-height:1.25}
  .po{font-size:10px;color:#555}
  .note{border:2px solid #000;padding:6px;margin-top:6px;font-size:11.5px;font-weight:700}
  .foot{margin-top:9px;text-align:center;font-size:9.5px;color:#444;line-height:1.5}
  @media print{body{width:auto}}
</style></head><body>
  <div class="c">
    <h1>PANNA BIRYANI</h1>
    <div class="sub">KITCHEN ORDER TICKET</div>
  </div>

  <div class="line"></div>
  <div class="c">
    <div class="no">${esc(data.orderNumber)}</div>
    <div class="dt">${fmtDate(data.date)}</div>
    <div class="dt">${esc(data.platform || "")}</div>
  </div>

  <div class="line"></div>
  <div class="blk">
    ${data.orderType ? `<div><b>Type:</b> ${esc(data.orderType)}</div>` : ""}
    ${data.customerName ? `<div><b>Guest:</b> ${esc(data.customerName)}</div>` : ""}
    ${data.customerPhone ? `<div><b>Phone:</b> ${esc(data.customerPhone)}</div>` : ""}
    ${data.paymentStatus ? `<div><b>Payment:</b> ${esc(data.paymentStatus)}</div>` : ""}
    ${data.address ? `<div><b>Address:</b> ${esc(data.address)}</div>` : ""}
  </div>

  <div class="line"></div>
  ${itemBlocks}

  ${
    data.notes
      ? `<div class="note">INSTRUCTIONS:<br/>${esc(data.notes).replace(/\n/g, "<br/>")}</div>`
      : ""
  }

  <div class="foot">
    Printed ${fmtDate(new Date().toISOString())}<br/>
    *** KITCHEN COPY — NO PRICES ***
  </div>
<script>window.addEventListener('load',function(){window.print()});</script>
</body></html>`;

  // Strip the auto-print script: the hidden iframe invokes print() itself.
  printInHiddenFrame(html.replace(/<script>[\s\S]*?<\/script>/g, ""), `KOT-${data.orderNumber}`);
}

/* ------------------------------------------------------------------ */
/*  Thermal receipt (80mm) — kitchen counter / mini print             */
/* ------------------------------------------------------------------ */

export interface ReceiptData {
  receiptNumber: string;
  orderNumber: string;
  date: string;
  businessName?: string | null;
  address?: string | null;
  phone?: string | null;
  gstNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  orderType?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  subtotal: number;
  discount?: number;
  discountLabel?: string | null;
  deliveryFee: number;
  total: number;
  gstPercent?: number;
  gstAmount?: number | null;
  items: InvoiceItem[];
  isRefunded?: boolean;
}

/** Builds a compact 80mm thermal-style receipt and prints it. */
export function printReceipt(data: ReceiptData) {
  const gstPct = Number(data.gstPercent ?? 0) || 0;
  const discounted = Math.max(0, (data.subtotal || 0) - (data.discount || 0));
  const gst =
    data.gstAmount != null
      ? Number(data.gstAmount)
      : extractGst(discounted, gstPct);

  const itemRows = data.items
    .map(
      (it) => `<tr class="it">
        <td>${esc(it.name)}${it.portion ? ` (${esc(it.portion)})` : ""}${it.free ? " [FREE]" : ""}
            <div class="muted">${it.quantity} x ${inr(it.unitPrice)}</div></td>
        <td class="r">${inr(it.totalPrice)}</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Receipt ${esc(data.receiptNumber)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:"Courier New",ui-monospace,monospace;margin:0;padding:10px;
       width:80mm;background:#fff;color:#000;font-size:11px;line-height:1.45}
  .c{text-align:center}
  h1{font-size:14px;margin:0;letter-spacing:.06em}
  .muted{color:#555;font-size:10px}
  .line{border-top:1px dashed #999;margin:7px 0}
  table{width:100%;border-collapse:collapse;font-size:11px}
  td{padding:1px 0;vertical-align:top}
  .it td:first-child{width:66%}
  .r{text-align:right;white-space:nowrap}
  .k{display:flex;justify-content:space-between}
  .tot{font-weight:700;font-size:13px}
  .gst{font-size:10px;color:#444}
  .foot{margin-top:8px;text-align:center;font-size:9.5px;color:#555;line-height:1.5}
  @media print{body{width:auto}}
</style></head><body>
  <div class="c">
    <h1>${esc(data.businessName || "PANNA BIRYANI")}</h1>
    ${data.address ? `<div class="muted">${esc(data.address)}</div>` : ""}
    ${data.phone ? `<div class="muted">Tel: ${esc(data.phone)}</div>` : ""}
    ${data.gstNumber ? `<div class="muted">GSTIN: ${esc(data.gstNumber)}</div>` : ""}
  </div>

  <div class="line"></div>
  <div class="k"><span>Receipt</span><span>${esc(data.receiptNumber)}</span></div>
  <div class="k"><span>Order</span><span>${esc(data.orderNumber)}</span></div>
  <div class="k"><span>Date</span><span>${fmtDate(data.date)}</span></div>
  <div class="k"><span>Type</span><span>${esc(data.orderType || "Delivery")}</span></div>
  <div class="k"><span>Customer</span><span>${esc(data.customerName || "-")}</span></div>
  ${data.customerPhone ? `<div class="k"><span>Phone</span><span>${esc(data.customerPhone)}</span></div>` : ""}
  ${
    data.paymentStatus
      ? `<div class="k"><span>Payment</span><span>${esc(data.paymentStatus)}</span></div>`
      : ""
  }
  ${
    data.isRefunded
      ? `<div class="line"></div><div class="c" style="font-weight:700">*** REFUNDED ***</div>`
      : ""
  }

  <div class="line"></div>
  <table>${itemRows}</table>

  <div class="line"></div>
  <div class="k"><span>Subtotal</span><span>${inr(data.subtotal)}</span></div>
  ${
    data.discount && data.discount > 0
      ? `<div class="k"><span>Discount${
          data.discountLabel ? ` (${esc(data.discountLabel)})` : ""
        }</span><span>- ${inr(data.discount)}</span></div>`
      : ""
  }
  <div class="k"><span>Delivery</span><span>${
    data.deliveryFee === 0 ? "FREE" : inr(data.deliveryFee)
  }</span></div>
  ${
    gst > 0
      ? `<div class="k gst"><span>CGST @${(gstPct / 2).toFixed(2)}%</span><span>${inr(gst / 2)}</span></div>
         <div class="k gst"><span>SGST @${(gstPct / 2).toFixed(2)}%</span><span>${inr(gst / 2)}</span></div>`
      : ""
  }
  <div class="line"></div>
  <div class="k tot"><span>TOTAL</span><span>${inr(data.total)}</span></div>
  ${
    data.isRefunded
      ? `<div class="k tot" style="color:#b00020"><span>REFUNDED</span><span>- ${inr(
          data.total
        )}</span></div>`
      : ""
  }

  <div class="line"></div>
  <div class="foot">
    Prices inclusive of GST.<br/>
    Thank you for dining with us!<br/>
    ${esc(data.businessName || "Panna Biryani")}
  </div>
<script>window.addEventListener('load',function(){window.print()});</script>
</body></html>`;

  printInHiddenFrame(
    html.replace(/<script>[\s\S]*?<\/script>/g, ""),
    `Receipt-${data.receiptNumber}`
  );
}