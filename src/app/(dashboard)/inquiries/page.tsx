"use client";

import React, { useEffect, useState } from "react";
import { Trash2, Inbox, CheckCheck, MailOpen, Mail, Phone, Calendar, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/services/api";
import { ContactInquiry } from "@/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "contact" | "bulk";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function InquiriesPage() {
  const [items, setItems] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getContactInquiries(
        filter === "all" ? undefined : { inquiry_type: filter }
      );
      setItems(res.data || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const markRead = async (i: ContactInquiry) => {
    if (i.is_read) return;
    await api.updateContactInquiry(i.id, { is_read: true });
    setItems((c) => c.map((x) => (x.id === i.id ? { ...x, is_read: true } : x)));
  };

  const toggleResolved = async (i: ContactInquiry) => {
    const res = await api.updateContactInquiry(i.id, { is_resolved: !i.is_resolved });
    if (res.data) setItems((c) => c.map((x) => (x.id === i.id ? res.data! : x)));
  };

  const remove = async (i: ContactInquiry) => {
    if (!confirm("Delete this enquiry?")) return;
    await api.deleteContactInquiry(i.id);
    setItems((c) => c.filter((x) => x.id !== i.id));
  };

  const parseDetails = (json: string | null): Record<string, any> => {
    if (!json) return {};
    try { return JSON.parse(json); } catch { return {}; }
  };

  const unreadCount = items.filter((i) => !i.is_read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Inbox className="h-6 w-6" /> Website Enquiries
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-xs font-black">{unreadCount} new</span>
              )}
            </h1>
            <p className="text-sm text-gray-500">Contact form messages and bulk / catering order requests from the website.</p>
          </div>
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            {(["all", "contact", "bulk"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-all capitalize",
                  filter === f ? "bg-white text-gray-900 shadow-xs font-bold" : "text-gray-500 hover:text-gray-800"
                )}
              >
                {f === "all" ? "All" : f === "contact" ? "Contact" : "Bulk Orders"}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

        <Card>
          <CardHeader>
            <CardTitle>Enquiry Inbox</CardTitle>
            <CardDescription>Click an enquiry to read it — doing so marks it as read</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <TableSkeleton rows={5} columns={4} /> : items.length === 0 ? (
              <p className="py-8 text-center text-gray-400 text-sm">No enquiries yet</p>
            ) : (
              <div className="space-y-2">
                {items.map((i) => {
                  const details = parseDetails(i.details_json);
                  const expanded = expandedId === i.id;
                  return (
                    <div
                      key={i.id}
                      className={cn(
                        "rounded-xl border p-4 transition-colors cursor-pointer",
                        i.is_read ? "border-gray-200 bg-white" : "border-amber-300 bg-amber-50/60",
                        i.is_resolved && "opacity-60"
                      )}
                      onClick={() => { setExpandedId(expanded ? null : i.id); markRead(i); }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className={cn("mt-0.5 shrink-0", i.is_read ? "text-gray-400" : "text-amber-600")}>
                            {i.is_read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900">{i.name}</span>
                              <Badge variant={i.inquiry_type === "bulk" ? "gold" : "neutral"}>
                                {i.inquiry_type === "bulk" ? "Bulk Order" : "Contact"}
                              </Badge>
                              {i.is_resolved && <Badge variant="success">Resolved</Badge>}
                            </div>
                            <p className="text-sm text-gray-700 mt-0.5 truncate">{i.subject || i.message || "—"}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              {i.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{i.phone}</span>}
                              {i.email && <span>{i.email}</span>}
                              <span>{timeAgo(i.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleResolved(i)}
                            title={i.is_resolved ? "Reopen" : "Mark resolved"}
                            className={cn("p-1.5 rounded-lg", i.is_resolved ? "text-emerald-600" : "text-gray-400 hover:text-emerald-600")}
                          >
                            <CheckCheck className="h-4 w-4" />
                          </button>
                          <button onClick={() => remove(i)} className="p-1.5 text-gray-400 hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="mt-3 pt-3 border-t border-gray-200 text-sm space-y-2">
                          {i.subject && <p><span className="font-semibold text-gray-500">Subject:</span> {i.subject}</p>}
                          {i.message && <p className="whitespace-pre-wrap text-gray-800">{i.message}</p>}
                          {i.inquiry_type === "bulk" && Object.keys(details).length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                              {details.event_date && (
                                <div className="bg-white border rounded-lg p-2">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3" />Event Date</span>
                                  <p className="font-semibold">{details.event_date}</p>
                                </div>
                              )}
                              {details.guest_count && (
                                <div className="bg-white border rounded-lg p-2">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1"><Users className="h-3 w-3" />Guests</span>
                                  <p className="font-semibold">{details.guest_count}</p>
                                </div>
                              )}
                              {details.preferred_biryani && (
                                <div className="bg-white border rounded-lg p-2">
                                  <span className="text-[10px] uppercase font-bold text-gray-400">Biryani</span>
                                  <p className="font-semibold">{details.preferred_biryani}</p>
                                </div>
                              )}
                              {details.order_type && (
                                <div className="bg-white border rounded-lg p-2">
                                  <span className="text-[10px] uppercase font-bold text-gray-400">Order Type</span>
                                  <p className="font-semibold capitalize">{details.order_type}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
