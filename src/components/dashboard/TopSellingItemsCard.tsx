import React from "react";
import { TopSellingItem } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Flame } from "lucide-react";

interface TopSellingItemsCardProps {
  items: TopSellingItem[];
}

export function TopSellingItemsCard({ items }: TopSellingItemsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-panna-gold-50 text-panna-gold-700">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Top Selling Biryanis</CardTitle>
            <CardDescription>Most ordered items ranked by volume</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No sales data recorded</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item.item_name}-${item.portion_size}`} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-slate-800">{item.item_name}</span>
                  <Badge variant="neutral" size="sm">
                    {item.portion_size}
                  </Badge>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 mr-2">
                    {formatCurrency(item.total_revenue)}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({item.quantity_sold} sold)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-panna-green-700 to-panna-gold-500 rounded-full"
                  style={{ width: `${Math.min(item.share_pct, 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
