"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Clock,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Flame,
  ChefHat,
  Bike,
  PackageCheck,
  Ban,
  Receipt,
  Sparkles,
} from "lucide-react";
import { OrderDetail, OrderStatus } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Portal } from "@/components/ui/Portal";
import { printInvoiceHtml, printKot } from "@/lib/invoice";

interface OrderDetailModalProps {
  order: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: number, newStatus: OrderStatus, notes?: string) => Promise<void>;
  onCancelOrder: (orderId: number, reason: string) => Promise<void>;
  onRefundOrder: (orderId: number, amount?: number, reason?: string) => Promise<void>;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
  onCancelOrder,
  onRefundOrder,
}: OrderDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelBox, setShowCancelBox] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [showRefundBox, setShowRefundBox] = useState(false);
  const [showKotView, setShowKotView] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const handleAdvanceStatus = async (nextStatus: OrderStatus) => {
    try {
      setUpdating(true);
      await onStatusUpdate(order.id, nextStatus, statusNote.trim() || undefined);
      setStatusNote("");
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    try {
      setUpdating(true);
      await onCancelOrder(order.id, cancelReason.trim());
      setShowCancelBox(false);
      setCancelReason("");
    } catch (err) {
      console.error("Failed to cancel order:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) return;
    try {
      setUpdating(true);
      await onRefundOrder(order.id, undefined, refundReason.trim());
      setShowRefundBox(false);
      setRefundReason("");
    } catch (err) {
      console.error("Failed to refund order:", err);
    } finally {
      setUpdating(false);
    }
  };

  const invoiceItems = () =>
    (order?.items ?? []).map((it) => ({
      name: it.item_name,
      portion: it.portion_size,
      quantity: it.quantity,
      unitPrice: it.unit_price,
      totalPrice: it.total_price,
      free: it.is_free,
    }));

  const handlePrint = () => {
    if (!order) return;
    printInvoiceHtml({
      invoiceNumber: `INV-${order.order_number}`,
      orderNumber: order.order_number,
      date: order.created_at,
      orderType: order.platform_display || order.platform,
      paymentStatus: String(order.payment_status),
      businessName: "Panna Biryani",
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerAddress: order.delivery_address ?? null,
      subtotal: order.subtotal,
      discount: order.discount,
      discountLabel: null,
      deliveryFee: order.delivery_fee,
      total: order.total_amount,
      gstAmount: order.tax,
      gateway: order.gateway ?? null,
      gatewayPaymentId: order.gateway_payment_id ?? null,
      gatewayOrderId: order.gateway_order_id ?? null,
      refundId: order.refund_id ?? null,
      refundAmount: order.refund_amount ?? null,
      refundedAt: order.refunded_at ?? null,
      notes: order.notes ?? null,
      items: invoiceItems(),
    });
  };

  const handlePrintKot = () => {
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
  };

  const getPlatformBadge = (platform: string) => {
    const p = platform.toUpperCase();
    if (p === "ZOMATO") {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">ZOMATO</span>;
    }
    if (p === "SWIGGY") {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">SWIGGY</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#0C3823] border border-emerald-200">PANNA DIRECT</span>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <Badge variant="warning" pulse>NEW ORDER</Badge>;
      case "CONFIRMED":
        return <Badge variant="info">CONFIRMED</Badge>;
      case "PREPARING":
        return <Badge variant="brand" pulse>IN KITCHEN</Badge>;
      case "READY":
        return <Badge variant="warning">READY FOR PICKUP</Badge>;
      case "OUT_FOR_DELIVERY":
        return <Badge variant="brand">OUT FOR DELIVERY</Badge>;
      case "DELIVERED":
        return <Badge variant="success">DELIVERED</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Reverse-calculation breakdown (tax-inclusive pricing model).
  // Menu/order prices already include GST, so GST is backed OUT of the goods
  // amount, then the transaction fee, VAS, other expenses and food cost are
  // deducted to arrive at the true margin.
  const goodsIncl = Math.max(0, (order?.subtotal ?? 0) - (order?.discount ?? 0));
  const gstIncluded = order?.tax ?? 0;
  const goodsExcl = Math.max(0, goodsIncl - gstIncluded);
  const txnFee = order?.transaction_fee ?? 0;
  const vasFee = order?.vas_fee ?? 0;
  const otherExp = order?.other_expense ?? 0;
  const foodCost = order?.food_cost ?? 0;
  const orderMargin =
    (order?.total_amount ?? 0) - gstIncluded - txnFee - vasFee - otherExp - foodCost;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0C3823] text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Receipt className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold font-serif tracking-tight text-white">
                  {order.order_number}
                </h2>
                {getPlatformBadge(order.platform)}
                {getStatusBadge(order.order_status)}
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                Placed on {new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowKotView(!showKotView)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChefHat className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{showKotView ? "Full View" : "KOT Slip"}</span>
            </button>
            <button
              onClick={showKotView ? handlePrintKot : handlePrint}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={showKotView ? "Print kitchen order ticket" : "Print tax invoice"}
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        {showKotView ? (
          /* Kitchen Order Ticket (KOT) Clean View */
          <div className="p-8 bg-[#FAF8F5] text-gray-900 font-mono">
            <div className="max-w-md mx-auto bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-center pb-4 border-b border-dashed border-gray-300">
                <h3 className="text-lg font-bold font-serif text-[#0C3823]">PANNA BIRYANI</h3>
                <p className="text-xs text-gray-500">KITCHEN ORDER TICKET (KOT)</p>
                <div className="mt-2 text-sm font-bold text-gray-800">
                  {order.order_number} • {order.platform}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {new Date(order.created_at).toLocaleTimeString("en-IN")}
                </div>
              </div>

              <div className="py-4 border-b border-dashed border-gray-300 space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div>
                      <span className="font-bold text-base mr-2">{item.quantity}x</span>
                      <span className="font-semibold text-gray-800">{item.item_name}</span>
                      {item.is_free && (
                        <span className="ml-2 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase font-sans">
                          Free
                        </span>
                      )}
                      <span className="block text-xs text-gray-500 font-sans font-medium">Portion: {item.portion_size}</span>
                    </div>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="py-3 border-b border-dashed border-gray-300 text-xs">
                  <span className="font-bold text-red-600 font-sans">INSTRUCTIONS:</span>
                  <p className="mt-0.5 text-gray-700 font-sans">{order.notes}</p>
                </div>
              )}

              <div className="pt-4 text-center">
                <button
                  onClick={handlePrintKot}
                  className="px-4 py-2 bg-[#0C3823] text-white rounded-lg text-xs font-sans font-bold hover:bg-[#072316] transition-colors"
                >
                  Print KOT
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-h-[75vh] overflow-y-auto">
            {/* Left Column: Details & Items (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Customer Info Card */}
              <div className="p-4 rounded-xl border border-gray-100 bg-[#FAF8F5]/60">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0C3823]" />
                    Customer Details
                  </h3>
                  {order.customer && order.customer.total_orders > 1 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                      Loyal Customer ({order.customer.total_orders} orders)
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-base">{order.customer_name}</span>
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0C3823] hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {order.customer_phone}
                    </a>
                  </div>

                  <div className="flex items-start gap-2 pt-1 text-xs text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span>{order.delivery_address || "Direct Counter / Pickup"}</span>
                  </div>

                  {order.customer && (
                    <div className="pt-2 mt-2 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-500">
                      <span>Customer Lifetime Spend:</span>
                      <span className="font-semibold text-gray-900">₹{order.customer.total_spent.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table Card */}
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Order Items ({order.items.length})
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">Portion / Qty</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${item.is_free ? 'bg-amber-500' : 'bg-[#0C3823]'}`} />
                          <h4 className="font-bold text-gray-900 text-sm">{item.item_name}</h4>
                          {item.is_free && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase">
                              Free
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 pl-4">
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 font-medium text-gray-700">
                            {item.portion_size}
                          </span>
                          <span>•</span>
                          <span>Qty: {item.quantity}</span>
                          <span>•</span>
                          <span>₹{item.unit_price} each</span>
                        </div>
                      </div>
                      <div className="text-right font-bold text-sm font-mono">
                        {item.is_free ? (
                          <span className="text-amber-600">FREE</span>
                        ) : (
                          <span className="text-gray-900">₹{item.total_price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reverse-calculation breakdown (CRM-only) */}
                <div className="p-4 bg-gray-50/60 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-gray-700 uppercase tracking-wide">
                    <Receipt className="w-3.5 h-3.5" />
                    Reverse calculation (price includes GST)
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal (menu prices, incl. GST)</span>
                    <span className="font-mono">₹{order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount</span>
                      <span className="font-mono">-₹{order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Goods amount (tax-inclusive)</span>
                    <span className="font-mono">₹{goodsIncl.toFixed(2)}</span>
                  </div>
                  {gstIncluded > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>GST included (backed out)</span>
                      <span className="font-mono">-₹{gstIncluded.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 font-semibold">
                    <span>GST removed (base)</span>
                    <span className="font-mono">₹{goodsExcl.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-mono">₹{order.delivery_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Final Customer Price</span>
                    <span className="font-mono text-[#0C3823]">₹{order.total_amount.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 mt-1 border-t border-gray-200 space-y-1.5 text-[11px]">
                    <p className="font-bold text-gray-700 uppercase tracking-wide">
                      Deductions → Margin
                    </p>
                    {txnFee > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>Transaction Fee</span>
                        <span className="font-mono">-₹{txnFee.toFixed(2)}</span>
                      </div>
                    )}
                    {vasFee > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>VAS (WhatsApp/SMS/Email)</span>
                        <span className="font-mono">-₹{vasFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-500">
                      <span>Other expenses (per order)</span>
                      <span className="font-mono">-₹{otherExp.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Food cost</span>
                      <span className="font-mono">-₹{foodCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                      <span>Total Margin</span>
                      <span
                        className={`font-mono ${orderMargin >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                      >
                        ₹{orderMargin.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {order.estimated_commission > 0 && (
                    <div className="pt-2 text-[11px] text-gray-400 flex justify-between">
                      <span>Platform Commission ({order.platform}):</span>
                      <span>~₹{order.estimated_commission.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Instructions */}
              {order.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-900">
                  <span className="font-bold flex items-center gap-1 mb-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Special Kitchen Instructions:
                  </span>
                  <p className="text-amber-800/90">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Right Column: Workflow Actions & History (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Order Status Action Panel */}
              <div className="p-5 rounded-xl border border-gray-100 bg-[#FAF8F5]/80 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center justify-between">
                  <span>Current Workflow State</span>
                  <span className="text-[#0C3823] font-semibold">{order.order_status}</span>
                </h3>

                {/* State Transition Actions */}
                {order.order_status === "NEW" && (
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      className="w-full justify-center py-2.5 shadow-md shadow-emerald-950/10"
                      disabled={updating}
                      onClick={() => handleAdvanceStatus("CONFIRMED")}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept & Confirm Order
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
                      disabled={updating}
                      onClick={() => setShowCancelBox(true)}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Reject / Cancel Order
                    </Button>
                  </div>
                )}

                {order.order_status === "CONFIRMED" && (
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      className="w-full justify-center py-2.5 bg-amber-600 hover:bg-amber-700"
                      disabled={updating}
                      onClick={() => handleAdvanceStatus("PREPARING")}
                    >
                      <ChefHat className="w-4 h-4 mr-2" />
                      Send to Kitchen (Start Cooking)
                    </Button>
                    <button
                      onClick={() => setShowCancelBox(true)}
                      className="w-full text-center text-xs text-red-600 hover:underline pt-1"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                {order.order_status === "PREPARING" && (
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      className="w-full justify-center py-2.5 bg-emerald-600 hover:bg-emerald-700"
                      disabled={updating}
                      onClick={() => handleAdvanceStatus("READY")}
                    >
                      <PackageCheck className="w-4 h-4 mr-2" />
                      Mark Ready for Dispatch
                    </Button>
                  </div>
                )}

                {order.order_status === "READY" && (
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      className="w-full justify-center py-2.5"
                      disabled={updating}
                      onClick={() => handleAdvanceStatus("OUT_FOR_DELIVERY")}
                    >
                      <Bike className="w-4 h-4 mr-2" />
                      Hand Over to Rider (Out for Delivery)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-center text-xs"
                      disabled={updating}
                      onClick={() => handleAdvanceStatus("DELIVERED")}
                    >
                      Direct Counter Pickup Complete
                    </Button>
                  </div>
                )}

                {order.order_status === "OUT_FOR_DELIVERY" && (
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      className="w-full justify-center py-2.5 bg-emerald-600 hover:bg-emerald-700"
                      disabled={updating}
                      onClick={() => handleAdvanceStatus("DELIVERED")}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm Order Delivered
                    </Button>
                  </div>
                )}

                {order.order_status === "DELIVERED" && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Order successfully delivered and completed.
                  </div>
                )}

                {order.order_status === "CANCELLED" && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-center text-red-800 text-xs font-semibold flex items-center justify-center gap-2">
                    <Ban className="w-4 h-4 text-red-600" />
                    This order was cancelled.
                  </div>
                )}

                {/* Refund for paid online orders */}
                {order.payment_status === "PAID" && order.gateway_payment_id && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-center text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                      disabled={updating}
                      onClick={() => setShowRefundBox(true)}
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      Refund Payment (Razorpay)
                    </Button>
                    <p className="text-[10px] text-gray-400 text-center">
                      Paid via {order.gateway || "gateway"} • Ref {order.gateway_payment_id}
                    </p>
                  </div>
                )}

                {/* Transition Note Input (if order active) */}
                {["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(order.order_status) && (
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">
                      Status Change Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="e.g., Assigned to Swiggy rider Ravi"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0C3823]/20"
                    />
                  </div>
                )}

                {/* Cancel Box Modal */}
                {showCancelBox && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2 animate-fade-in">
                    <label className="block text-xs font-bold text-red-800">
                      Reason for Cancellation:
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Enter customer or operational reason..."
                      className="w-full p-2 text-xs rounded-lg border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                      rows={2}
                    />
                    <div className="flex justify-end space-x-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCancelBox(false)}
                      >
                        Keep Order
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={!cancelReason.trim() || updating}
                        onClick={handleCancel}
                      >
                        Confirm Cancellation
                      </Button>
                    </div>
                  </div>
                )}

                {/* Refund Box Modal */}
                {showRefundBox && (
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 space-y-2 animate-fade-in">
                    <label className="block text-xs font-bold text-orange-800">
                      Reason for Refund:
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="e.g., Order cancelled, duplicate payment..."
                      className="w-full p-2 text-xs rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      rows={2}
                    />
                    <p className="text-[10px] text-orange-700">
                      Full refund of ₹{order.total_amount.toFixed(2)} will be sent to the customer&apos;s original payment method via Razorpay.
                    </p>
                    <div className="flex justify-end space-x-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowRefundBox(false)}
                      >
                        Keep Payment
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={!refundReason.trim() || updating}
                        onClick={handleRefund}
                      >
                        Confirm Refund
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status History Audit Trail */}
              <div className="p-5 rounded-xl border border-gray-100 bg-white shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Order Activity Timeline
                </h3>

                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-gray-100">
                  {order.status_history.map((h, idx) => (
                    <div key={h.id || idx} className="relative flex items-start space-x-3 pl-6">
                      <div className="absolute left-1.5 -translate-x-1/2 w-3 h-3 rounded-full bg-[#0C3823] ring-4 ring-[#0C3823]/10 mt-1" />
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-gray-900">{h.new_status}</span>
                          <span className="text-[10px] text-gray-400">by {h.changed_by_name}</span>
                        </div>
                        {h.notes && (
                          <p className="text-xs text-gray-600">{h.notes}</p>
                        )}
                        <span className="text-[10px] text-gray-400 block">
                          {new Date(h.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
    </Portal>
  );
}
