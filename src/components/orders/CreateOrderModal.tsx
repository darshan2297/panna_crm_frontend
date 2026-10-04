"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  UtensilsCrossed,
} from "lucide-react";
import { CreateOrderInput, CreateOrderItemInput, OrderPlatform, PaymentStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Portal } from "@/components/ui/Portal";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateOrderInput) => Promise<void>;
}

// Preset popular items for cloud kitchen quick-entry
const POPULAR_MENU_ITEMS = [
  { name: "Panna Paneer Dum Biryani", portion: "500g", price: 320.0 },
  { name: "Panna Veg Dum Biryani", portion: "500g", price: 260.0 },
  { name: "Panna Royal Dum Biryani", portion: "750g", price: 420.0 },
  { name: "Panna Hyderabadi Dum Biryani", portion: "1kg", price: 550.0 },
  { name: "Panna Special Raita", portion: "250g", price: 60.0 },
  { name: "Shahi Gulab Jamun (2 pcs)", portion: "Standard", price: 90.0 },
];

export function CreateOrderModal({ isOpen, onClose, onSubmit }: CreateOrderModalProps) {
  const [platform, setPlatform] = useState<OrderPlatform>("WEBSITE");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(40);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PAID");

  const [items, setItems] = useState<CreateOrderItemInput[]>([
    { item_name: "Panna Paneer Dum Biryani", portion_size: "500g", quantity: 1, unit_price: 320.0 },
  ]);

  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customPortion, setCustomPortion] = useState("500g");
  const [customPrice, setCustomPrice] = useState(320.0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!isOpen) return null;

  const handleAddItemFromPreset = () => {
    const preset = POPULAR_MENU_ITEMS[selectedPreset];
    setItems([
      ...items,
      {
        item_name: preset.name,
        portion_size: customPortion || preset.portion,
        quantity: 1,
        unit_price: Number(customPrice) || preset.price,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setItems(
      items.map((item, i) => {
        if (i === index) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Calculations
  const subtotal = items.reduce((acc, curr) => acc + curr.unit_price * curr.quantity, 0);
  const taxable = Math.max(0, subtotal - (Number(discount) || 0));
  const tax = Number((taxable * 0.05).toFixed(2));
  const grandTotal = Number((taxable + (Number(deliveryFee) || 0) + tax).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError("Please enter the customer's name");
      return;
    }
    if (!customerPhone.trim()) {
      setError("Please enter customer's contact phone");
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one item to the order");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        platform,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        delivery_address: deliveryAddress.trim() || undefined,
        items,
        discount: Number(discount) || 0,
        delivery_fee: Number(deliveryFee) || 0,
        payment_status: paymentStatus,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0C3823] text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif tracking-tight">Create Manual Order</h2>
              <p className="text-xs text-white/70">Phone orders, direct website bookings, or counter pickup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Platform & Payment Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Channel / Platform
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["WEBSITE", "ZOMATO", "SWIGGY"] as OrderPlatform[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      platform === p
                        ? "bg-[#0C3823] text-white border-[#0C3823] shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p === "WEBSITE" ? "Direct / Web" : p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0C3823]/20 font-medium"
              >
                <option value="PAID">PAID (Online / UPI / Cash Received)</option>
                <option value="PENDING">PENDING (Cash on Delivery)</option>
              </select>
            </div>
          </div>

          {/* Customer Details */}
          <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0C3823]" />
              Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Gupta"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0C3823]/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0C3823]/20 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Delivery Address / Table / Counter
              </label>
              <input
                type="text"
                placeholder="House No, Street, Area, Landmark"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0C3823]/20"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#0C3823]" />
                Select Biryani & Dishes
              </h3>
              <span className="text-xs text-gray-500">{items.length} items added</span>
            </div>

            {/* Quick Add Bar */}
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-gray-200/80 flex flex-wrap sm:flex-nowrap items-center gap-2">
              <select
                value={selectedPreset}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setSelectedPreset(idx);
                  setCustomPortion(POPULAR_MENU_ITEMS[idx].portion);
                  setCustomPrice(POPULAR_MENU_ITEMS[idx].price);
                }}
                className="grow px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white"
              >
                {POPULAR_MENU_ITEMS.map((item, idx) => (
                  <option key={idx} value={idx}>
                    {item.name} (₹{item.price})
                  </option>
                ))}
              </select>

              <select
                value={customPortion}
                onChange={(e) => setCustomPortion(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white"
              >
                <option value="250g">250g</option>
                <option value="500g">500g</option>
                <option value="750g">750g</option>
                <option value="1kg">1kg</option>
                <option value="Standard">Standard</option>
              </select>

              <div className="relative w-24">
                <span className="absolute left-2 top-1.5 text-xs text-gray-400">₹</span>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                  className="w-full pl-5 pr-2 py-1.5 text-xs rounded-lg border border-gray-200 font-mono"
                />
              </div>

              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={handleAddItemFromPreset}
                className="shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </div>

            {/* Added Items List */}
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between bg-white text-xs">
                  <div>
                    <span className="font-bold text-gray-900">{item.item_name}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                      {item.portion_size}
                    </span>
                    <span className="ml-2 text-gray-400">@ ₹{item.unit_price}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, -1)}
                        className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold"
                      >
                        -
                      </button>
                      <span className="px-2 font-mono font-bold text-gray-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, 1)}
                        className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-mono font-bold text-gray-900 w-16 text-right">
                      ₹{(item.unit_price * item.quantity).toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Instructions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Special Kitchen Instructions / Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Extra raita, less spicy, deliver on 3rd floor"
                className="w-full p-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0C3823]/20"
                rows={3}
              />
            </div>

            {/* Bill Summary Calculations */}
            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-16 px-1.5 py-0.5 text-right font-mono border border-gray-200 rounded"
                />
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Delivery Fee (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  className="w-16 px-1.5 py-0.5 text-right font-mono border border-gray-200 rounded"
                />
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (5%):</span>
                <span className="font-mono">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Grand Total:</span>
                <span className="font-mono text-[#0C3823]">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Placing Order..." : "Confirm & Place Order"}
            </Button>
          </div>

        </form>
      </div>
    </div>
    </Portal>
  );
}
