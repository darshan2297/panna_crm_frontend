"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Mail,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/services/api";
import {
  NotificationItem,
  NotificationChannel,
  NotificationDispatchResult,
} from "@/types";

interface DispatchAlertModalProps {
  notification: NotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DispatchAlertModal({
  notification,
  isOpen,
  onClose,
  onSuccess,
}: DispatchAlertModalProps) {
  const [channel, setChannel] = useState<NotificationChannel>("WHATSAPP");
  const [recipient, setRecipient] = useState("+91 98765 43210");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<NotificationDispatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!notification) return null;

  const handleDispatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.dispatchNotification(
        notification.id,
        {
          channel,
          recipient: recipient.trim() || undefined,
        }
      );
      if (res && res.data) {
        setResult(res.data);
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to dispatch notification");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch External Kitchen Alert"
      description="Send stock breaches and order notices directly via WhatsApp or Email."
      className="max-w-xl"
    >
      <div className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Channel Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setChannel("WHATSAPP");
              setRecipient("+91 98765 43210");
              setResult(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
              channel === "WHATSAPP"
                ? "bg-emerald-900 text-white border-emerald-950 shadow-sm"
                : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Dispatch</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setChannel("EMAIL");
              setRecipient("headchef@pannabiryani.com");
              setResult(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
              channel === "EMAIL"
                ? "bg-emerald-900 text-white border-emerald-950 shadow-sm"
                : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
            }`}
          >
            <Mail className="w-4 h-4 text-amber-400" />
            <span>Email Dispatch</span>
          </button>
        </div>

        {/* Recipient Input */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            {channel === "WHATSAPP"
              ? "Recipient WhatsApp Phone Number"
              : "Recipient Email Address"}
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={
              channel === "WHATSAPP"
                ? "+91 98765 43210"
                : "kitchen.manager@pannabiryani.com"
            }
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white"
          />
        </div>

        {/* Alert Preview Box */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Formatted Alert Preview
          </span>

          {channel === "WHATSAPP" ? (
            <div className="p-3.5 bg-emerald-950/5 rounded-xl border border-emerald-200/80 font-mono text-xs text-stone-800 space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <span>🔔 [PANNA KITCHEN ALERT]</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                  {notification.severity}
                </span>
              </div>
              <p className="text-stone-700 pt-1 font-sans">{notification.title}</p>
              <p className="text-stone-600 font-sans text-[11px]">{notification.message}</p>
              <p className="text-stone-400 text-[10px] pt-1">
                Timestamp: {new Date(notification.created_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs space-y-2">
              <div className="bg-emerald-950 text-white p-2.5 rounded-lg flex items-center justify-between">
                <span className="font-serif font-bold text-xs">Royal Panna Biryani</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-stone-950">
                  {notification.severity}
                </span>
              </div>
              <h5 className="font-bold text-xs text-stone-900">{notification.title}</h5>
              <p className="text-stone-600 text-xs">{notification.message}</p>
            </div>
          )}
        </div>

        {/* Result & Actions */}
        {result && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Alert successfully generated and ready!</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {(result.action_url || result.whatsapp_url) && channel === "WHATSAPP" && (
                <a
                  href={result.action_url || result.whatsapp_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Open WhatsApp Web / App</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {(result.action_url || result.email_mailto) && channel === "EMAIL" && (
                <a
                  href={result.action_url || result.email_mailto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Mail Client</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {(result.rendered_body || result.preview_content) && (
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(result.rendered_body || result.preview_content || "")
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 text-xs font-semibold"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 border border-stone-200 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDispatch}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-950 text-white hover:bg-emerald-900 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>{loading ? "Dispatching..." : "Dispatch Alert Now"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
