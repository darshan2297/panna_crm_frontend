import React from "react";
import Link from "next/link";
import { RecentOrderSummary } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../ui/Table";
import { Badge } from "../ui/Badge";
import { ChevronRight, ArrowUpRight } from "lucide-react";

interface RecentOrdersTableProps {
  orders: RecentOrderSummary[];
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const getPlatformBadge = (platform: string) => {
    switch (platform.toUpperCase()) {
      case "ZOMATO":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Zomato
          </span>
        );
      case "SWIGGY":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
            Swiggy
          </span>
        );
      case "WEBSITE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Website
          </span>
        );
      default:
        return <Badge variant="neutral">{platform}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PREPARING":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Preparing
          </span>
        );
      case "READY":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Ready
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Confirmed
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Delivered
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Live incoming customer & delivery orders across all channels</CardDescription>
        </div>
        <Link
          href="/orders"
          className="text-xs font-semibold text-panna-green-800 hover:text-panna-green-950 inline-flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-xs text-slate-400">
                  No orders recorded yet
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono font-bold text-xs text-slate-800">
                    #{o.order_number}
                  </TableCell>
                  <TableCell>{getPlatformBadge(o.platform)}</TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-slate-800">
                      {o.customer_name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {o.customer_phone}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                    {o.items_summary}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900 text-xs">
                    {formatCurrency(o.total_amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(o.order_status)}</TableCell>
                  <TableCell className="text-right text-xs font-medium text-slate-500 whitespace-nowrap">
                    {o.time_formatted}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
