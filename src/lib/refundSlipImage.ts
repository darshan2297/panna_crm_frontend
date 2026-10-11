/**
 * Renders a refund slip as a PNG and shares it the way a payment app would —
 * as an image in the OS share sheet, not as a wall of text.
 *
 * Why a canvas rather than a screenshot of the DOM: it needs no extra
 * dependency, renders identically on every browser, and produces a real Blob
 * that `navigator.share({ files })` accepts for WhatsApp. `wa.me` links cannot
 * carry images at all, so the native share sheet is the only way to attach one.
 *
 * Identical in both frontends (separate npm packages, no shared build) — keep
 * the two copies in step.
 */

export interface SlipImageInput {
  brandName: string;
  tagline: string;
  orderNumber: string;
  statusHeadline: string;
  tone: "success" | "warning" | "danger";
  amount: number;
  rows: { label: string; value: string }[];
  footnote: string;
}

const BRAND = {
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
  headerBg: "#00241b",
  headerText: "#ffffff",
  headerMuted: "#e8b94a",
  successBg: "#dcfce7",
  successFg: "#166534",
  warningBg: "#fef3c7",
  warningFg: "#92400e",
  dangerBg: "#fee2e2",
  dangerFg: "#991b1b",
  white: "#ffffff",
};

const W = 720; // comfortable width for WhatsApp
const PAD = 40;

const INR = (n: number): string =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function dashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y: number,
  x2: number,
  colour: string
) {
  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw the slip onto a canvas and resolve with a PNG blob.
 *
 * Height is computed from the content first so the receipt never crops or
 * leaves a large blank tail when the reason/note text wraps to more lines.
 */
export async function renderRefundSlipImage(
  input: SlipImageInput
): Promise<Blob> {
  const dpr = Math.min(3, window.devicePixelRatio || 1);

  // --- pass 1: measure --------------------------------------------------- //
  const measure = document.createElement("canvas").getContext("2d")!;
  const baseFont = '400 20px "Segoe UI", system-ui, -apple-system, sans-serif';
  const footFont = '400 18px "Segoe UI", system-ui, -apple-system, sans-serif';

  const headerH = 150;
  const amountLabelY = headerH + 34;
  const amountValueY = amountLabelY + 26;
  const pillY = amountValueY + 66; // clears the 46px amount glyphs
  const pillH = 44;
  const separatorY = pillY + pillH + 34;
  const rowsTop = separatorY + 26;

  const rowGap = 40;
  measure.font = baseFont;
  const rowLines: { label: string; value: string; valueLines: string[]; height: number }[] =
    input.rows.map((r) => {
      const maxValueWidth = W - PAD * 2 - 210;
      const valueLines = wrapText(measure, r.value, maxValueWidth, baseFont);
      return {
        ...r,
        valueLines,
        height: Math.max(rowGap, 30 + valueLines.length * 26),
      };
    });
  const rowsH = rowLines.reduce((sum, r) => sum + r.height, 0);

  const footTop = rowsTop + rowsH + 34;
  measure.font = footFont;
  const footLines = wrapText(measure, input.footnote, W - PAD * 2 - 32, footFont);
  const footH = footLines.length * 26 + 44;

  const footerH = 70;
  const totalH = footTop + footH + footerH;

  // --- pass 2: draw ------------------------------------------------------ //
  const canvas = document.createElement("canvas");
  canvas.width = W * dpr;
  canvas.height = totalH * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.textBaseline = "top";

  // background
  ctx.fillStyle = BRAND.white;
  ctx.fillRect(0, 0, W, totalH);

  // header
  ctx.fillStyle = BRAND.headerBg;
  ctx.fillRect(0, 0, W, headerH);
  ctx.textAlign = "left";
  ctx.fillStyle = BRAND.headerText;
  ctx.font = '700 30px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(input.brandName, PAD, 42);
  ctx.fillStyle = BRAND.headerMuted;
  ctx.font = '500 18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(input.tagline, PAD, 84);

  // Both header-right lines stay right-aligned; resetting to "left" between
  // them used to push the order number off the right edge.
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = '700 18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText("REFUND SLIP", W - PAD, 46);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = '400 16px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`Order ${input.orderNumber}`, W - PAD, 76);
  ctx.textAlign = "left";

  // amount
  ctx.fillStyle = BRAND.muted;
  ctx.font = '500 19px "Segoe UI", system-ui, sans-serif';
  ctx.fillText("Refund amount", PAD, amountLabelY);
  ctx.fillStyle = BRAND.ink;
  ctx.font = '800 46px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(INR(input.amount), PAD, amountValueY);

  // status pill
  const pillTone = {
    success: [BRAND.successBg, BRAND.successFg],
    warning: [BRAND.warningBg, BRAND.warningFg],
    danger: [BRAND.dangerBg, BRAND.dangerFg],
  }[input.tone];
  ctx.font = '700 19px "Segoe UI", system-ui, sans-serif';
  const pillW = Math.min(W - PAD * 2, ctx.measureText(input.statusHeadline).width + 40);
  ctx.fillStyle = pillTone[0];
  roundRect(ctx, PAD, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = pillTone[1];
  ctx.fillText(input.statusHeadline, PAD + 20, pillY + 12);

  // rows
  dashedLine(ctx, PAD, separatorY, W - PAD, BRAND.line);
  let ry = rowsTop;
  for (const r of rowLines) {
    ctx.fillStyle = BRAND.muted;
    ctx.font = '400 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(r.label, PAD, ry + 2);
    ctx.fillStyle = BRAND.ink;
    ctx.font = '600 20px "Segoe UI", system-ui, sans-serif';
    // Long references wrap instead of running off the card.
    ctx.textAlign = "right";
    r.valueLines.forEach((line, i) => {
      ctx.fillText(line, W - PAD, ry + 2 + i * 26);
    });
    ctx.textAlign = "left";
    ry += r.height;
  }

  // footnote
  dashedLine(ctx, PAD, footTop, W - PAD, BRAND.line);
  ctx.fillStyle = BRAND.muted;
  ctx.font = footFont;
  footLines.forEach((line, i) => ctx.fillText(line, PAD, footTop + 22 + i * 26));

  // footer
  ctx.fillStyle = BRAND.headerBg;
  ctx.fillRect(0, totalH - footerH, W, footerH);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = '500 18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(input.brandName, PAD, totalH - footerH + 28);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = '400 16px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = "right";
  ctx.fillText("Payment refund receipt", W - PAD, totalH - footerH + 30);
  ctx.textAlign = "left";

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
      "image/png"
    );
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string
): string[] {
  ctx.font = font;
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export type ShareOutcome = "shared" | "downloaded" | "cancelled" | "unsupported";

/**
 * Share the slip as an image.
 *
 * Primary path mirrors a payment app: hand the PNG to the OS share sheet and
 * let the user pick WhatsApp. `wa.me` cannot carry files, so there is no URL
 * shortcut here.
 *
 * Falls back to downloading the image when the platform can't share files
 * (desktop browsers without file sharing), which is still usable — the user
 * attaches it manually in the chat.
 */
export async function shareRefundSlipImage(blob: Blob, filename: string): Promise<ShareOutcome> {
  const file = new File([blob], filename, { type: "image/png" });

  const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: "Refund Slip",
        text: "Refund slip from Panna Biryani",
      });
      return "shared";
    } catch (err) {
      // A user dismissing the sheet is a normal outcome, not a failure.
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // Anything else (e.g. a platform bug) falls through to download.
    }
  }

  downloadBlob(blob, filename);
  return typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    navigator.canShare?.({ files: [file] })
    ? "downloaded"
    : "unsupported";
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function refundSlipFilename(orderNumber: string): string {
  const safe = (orderNumber || "order").replace(/[^A-Za-z0-9-_]/g, "");
  return `Refund-${safe}.png`;
}