"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Download,
  Receipt,
  CreditCard,
  RotateCcw,
  ChefHat,
  User,
  Package,
  Store,
  History,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OrderDetail } from "@/types";
import { downloadInvoiceHtml, printInvoiceHtml, printReceipt, printKot } from "@/lib/invoice";

const inr = (n: number | null | undefined) =>
  `₹${(Number(n) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-slate-500 text-xs shrink-0">{label}</span>
      <span className={`text-xs text-right break-all ${mono ? "font-mono" : "font-semibold text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
  tone = "plain",
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  tone?: "plain" | "danger" | "warn";
}) {
  const toneCls =
    tone === "danger"
      ? "border-rose-200 bg-rose-50/50"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50/50"
        : "border-slate-200 bg-white";
  const headCls =
    tone === "danger"
      ? "text-rose-700"
      : tone === "warn"
        ? "text-amber-700"
        : "text-slate-700";
  return (
    <section className={`rounded-xl border ${toneCls} p-4 shadow-xs`}>
      <h3 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide mb-3 ${headCls}`}>
        <Icon className="w-4 h-4" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setError("Invalid order reference");
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await api.getOrderDetails(numericId);
      if (res.data) setOrder(res.data);
      else setError(res.message || "Order not found");
    } catch (e: any) {
      setError(e?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Reverse-calculation figures (tax-inclusive pricing model)
  const goodsIncl = Math.max(0, (order?.subtotal ?? 0) - (order?.discount ?? 0));
  const gstIncluded = order?.tax ?? 0;
  const goodsExcl = Math.max(0, goodsIncl - gstIncluded);
  const txnFee = order?.transaction_fee ?? 0;
  const vasFee = order?.vas_fee ?? 0;
  const otherExp = order?.other_expense ?? 0;
  const foodCost = order?.food_cost ?? 0;
  const margin =
    (order?.total_amount ?? 0) - gstIncluded - txnFee - vasFee - otherExp - foodCost;

  const isRefunded = order?.payment_status === "REFUNDED" || Boolean(order?.refund_id);

  // Business identity for the invoice header (logo, GSTIN, address, contacts).
  const [biz, setBiz] = useState<Record<string, any>>({});
  useEffect(() => {
    api
      .getStorefrontConfig()
      .then((res) => {
        if (res.data) setBiz(res.data as Record<string, any>);
      })
      .catch(() => {});
  }, []);

  const invoiceItems = () =>
    (order?.items ?? []).map((it) => ({
      name: it.item_name,
      portion: it.portion_size,
      quantity: it.quantity,
      unitPrice: it.unit_price,
      totalPrice: it.total_price,
      free: it.is_free,
    }));

  const invoiceData = () => ({
    invoiceNumber: `INV-${order!.order_number}`,
    orderNumber: order!.order_number,
    date: order!.created_at,
    orderType: order!.platform_display || order!.platform,
    paymentMethod: String(order!.payment_status),
    paymentStatus: String(order!.payment_status),
    businessName: biz.brand_name ?? "Panna Biryani",
    tagline: biz.brand_tagline ?? null,
    logoUrl: biz.logo_url ?? null,
    address: biz.address_line ?? null,
    city: biz.city ?? biz.area ?? null,
    pincode: biz.pincode ?? null,
    phone: biz.phone ?? null,
    email: biz.email ?? null,
    gstNumber: biz.gst_number ?? null,
    customerName: order!.customer_name,
    customerPhone: order!.customer_phone,
    customerAddress: order!.delivery_address ?? null,
    subtotal: order!.subtotal,
    discount: order!.discount,
    discountLabel: null,
    deliveryFee: order!.delivery_fee,
    total: order!.total_amount,
    gstPercent: Number(biz.gst_percent) || 0,
    gstAmount: order!.tax,
    gateway: order!.gateway ?? null,
    gatewayPaymentId: order!.gateway_payment_id ?? null,
    gatewayOrderId: order!.gateway_order_id ?? null,
    refundId: order!.refund_id ?? null,
    refundAmount: order!.refund_amount ?? null,
    refundedAt: order!.refunded_at ?? null,
    notes: order!.notes ?? null,
    items: invoiceItems(),
  });

  function handleDownloadInvoice() {
    if (!order) return;
    downloadInvoiceHtml(invoiceData());
  }

  /** Opens the invoice in a clean window (no dashboard chrome) and prints it. */
  function handlePrintInvoice() {
    if (!order) return;
    printInvoiceHtml(invoiceData());
  }

  /** Compact 80mm thermal receipt (with prices) for the counter. */
  function handlePrintReceipt() {
    if (!order) return;
    printReceipt({
      receiptNumber: order.order_number,
      orderNumber: order.order_number,
      date: order.created_at,
      businessName: biz.brand_name ?? "Panna Biryani",
      address: [biz.address_line, [biz.city, biz.pincode].filter(Boolean).join(" - ")]
        .filter(Boolean)
        .join(", "),
      phone: biz.phone ?? null,
      gstNumber: biz.gst_number ?? null,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      orderType: order.platform_display || order.platform,
      paymentMethod: String(order.payment_status),
      paymentStatus: String(order.payment_status),
      subtotal: order.subtotal,
      discount: order.discount,
      discountLabel: null,
      deliveryFee: order.delivery_fee,
      total: order.total_amount,
      gstPercent: Number(biz.gst_percent) || 0,
      gstAmount: order.tax,
      items: invoiceItems(),
      isRefunded: isRefunded,
    });
  }

  /** Small 80mm kitchen token — items & instructions only, no prices. */
  function handlePrintKot() {
    if (!order) return;
    printKot({
      orderNumber: order.order_number,
      date: order.created_at,
      platform: order.platform_display || order.platform,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      address: order.delivery_address ?? null,
      orderType: order.delivery_address ? "Delivery" : "Pickup",
      paymentStatus: String(order.payment_status),
      notes: order.notes ?? null,
      items: invoiceItems(),
    });
  }

  if (error || !order) {
    return (
      <div className="p-10 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-rose-500 mb-2" />
        <p className="text-sm text-rose-700">{error || "Order not found"}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/orders")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold font-serif text-panna-green-950">
                {order.order_number}
              </h1>
              <Badge variant={String(order.order_status) === "CANCELLED" ? "danger" : "info"}>
                {String(order.order_status)}
              </Badge>
              {isRefunded && (
                <Badge variant="danger">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  REFUNDED
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed {fmtDate(order.created_at)} · {order.platform_display || order.platform}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintInvoice} title="Print the full A4 tax invoice">
            <Printer className="w-4 h-4 mr-1.5" />
            Invoice Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintKot}
            title="Print the small kitchen order ticket (no prices)"
          >
            <ChefHat className="w-4 h-4 mr-1.5" />
            KOT Slip
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintReceipt}
            title="Print an 80mm thermal receipt for the counter"
          >
            <Receipt className="w-4 h-4 mr-1.5" />
            Receipt
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadInvoice}
            title="Download a copy of the tax invoice"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download
          </Button>
        </div>
      </div>

      {isRefunded && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
          <RotateCcw className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold text-rose-800">
              Refunded {inr(order.refund_amount)} to the customer
            </p>
            <p className="text-rose-700 text-xs mt-1">
              Processed via {order.gateway || "payment gateway"} on{" "}
              {fmtDate(order.refunded_at)}
              {order.refund_id && (
                <>
                  {" "}
                  · Ref: <span className="font-mono">{order.refund_id}</span>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          <Section icon={User} title="Customer">
            <Row label="Name" value={order.customer_name} />
            <Row label="Phone" value={order.customer_phone} />
            {order.delivery_address && (
              <div className="flex items-start justify-between gap-3 py-1">
                <span className="text-slate-500 text-xs shrink-0">Address</span>
                <span className="text-xs text-right text-slate-800">{order.delivery_address}</span>
              </div>
            )}
            {order.customer && (
              <Row
                label="Lifetime spend"
                value={inr(order.customer.total_spent)}
              />
            )}
          </Section>

          <Section icon={Package} title={`Order items (${order.items.length})`}>
            <div className="space-y-2">
              {order.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {it.quantity} × {it.item_name}
                      {it.is_free && (
                        <span className="ml-2 text-[10px] text-emerald-700 font-bold">FREE</span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {it.portion_size} · {inr(it.unit_price)} each
                      {it.cost_price !== undefined && it.cost_price > 0 && ` · cost ${inr(it.cost_price)}`}
                    </p>
                    {it.is_free && (
                      <p className="text-[11px] text-emerald-700">Complimentary promo gift</p>
                    )}
                  </div>
                  <span className="font-mono text-sm text-slate-800 shrink-0">
                    {inr(it.total_price)}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {order.notes && (
            <Section icon={AlertCircle} title="Special instructions">
              <p className="text-xs text-slate-700">{order.notes}</p>
            </Section>
          )}

          <Section icon={History} title="Activity timeline">
            <div className="space-y-3">
              {order.status_history.map((h) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-panna-green-700 mt-1" />
                    <div className="w-px flex-1 bg-slate-200 mt-1" />
                  </div>
                  <div className="pb-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">
                      {h.new_status?.replace(/_/g, " ")}
                      <span className="font-normal text-slate-400"> · {h.changed_by_name}</span>
                    </p>
                    {h.notes && <p className="text-[11px] text-slate-600 mt-0.5">{h.notes}</p>}
                    <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(h.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Section icon={Receipt} title="Reverse calculation (incl. GST)">
            <Row label="Subtotal (menu prices)" value={inr(order.subtotal)} mono />
            {order.discount > 0 && <Row label="Discount" value={`- ${inr(order.discount)}`} mono />}
            <Row label="Goods amount (tax-inclusive)" value={inr(goodsIncl)} mono />
            {gstIncluded > 0 && (
              <Row label="GST included (backed out)" value={`- ${inr(gstIncluded)}`} mono />
            )}
            <Row label="GST removed (base)" value={inr(goodsExcl)} mono />
            <Row label="Delivery fee" value={inr(order.delivery_fee)} mono />
            <div className="flex items-center justify-between gap-3 py-2 mt-1 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-900">Final customer price</span>
              <span className="font-mono text-base font-bold text-panna-green-900">
                {inr(order.total_amount)}
              </span>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200 space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Deductions → margin
              </p>
              {txnFee > 0 && <Row label="Transaction fee" value={`- ${inr(txnFee)}`} mono />}
              {vasFee > 0 && <Row label="VAS" value={`- ${inr(vasFee)}`} mono />}
              <Row label="Other expenses" value={`- ${inr(otherExp)}`} mono />
              <Row label="Food cost" value={`- ${inr(foodCost)}`} mono />
              <div className="flex items-center justify-between gap-3 py-1.5 mt-1 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-900">Total margin</span>
                <span
                  className={`font-mono text-sm font-bold ${
                    margin >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {inr(margin)}
                </span>
              </div>
            </div>
          </Section>

          <Section
            icon={CreditCard}
            title="Payment & transaction"
            tone={isRefunded ? "danger" : "plain"}
          >
            <Row
              label="Payment status"
              value={
                <Badge variant={isRefunded ? "danger" : "success"}>
                  {String(order.payment_status)}
                </Badge>
              }
            />
            <Row label="Gateway" value={order.gateway || "—"} />
            <div className="py-1">
              <span className="text-slate-500 text-xs block">Transaction / payment ID</span>
              {order.gateway_payment_id ? (
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(order.gateway_payment_id!);
                  }}
                  className="text-xs font-mono text-slate-800 hover:text-panna-green-800 break-all text-left"
                  title="Click to copy"
                >
                  {order.gateway_payment_id}
                </button>
              ) : (
                <span className="text-xs text-slate-400">No transaction recorded</span>
              )}
            </div>

            {order.gateway_payment_id && (
              <div className="py-1">
                <span className="text-slate-500 text-xs block">Razorpay order ID</span>
                <span className="text-xs font-mono text-slate-800 break-all">
                  {order.gateway_order_id || "—"}
                </span>
              </div>
            )}

            {isRefunded && (
              <div className="mt-2 pt-2 border-t border-rose-200 space-y-0.5">
                <Row label="Refund ID" value={order.refund_id || "—"} mono />
                <Row label="Refunded amount" value={inr(order.refund_amount)} mono />
                <Row label="Refunded at" value={fmtDate(order.refunded_at)} />
              </div>
            )}
          </Section>

          {order.estimated_commission > 0 && (
            <Section icon={Store} title="Platform">
              <Row label="Commission (est.)" value={inr(order.estimated_commission)} mono />
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}