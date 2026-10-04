import React from "react";
import Link from "next/link";
import { LowStockAlert } from "@/types";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../ui/Table";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface LowStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: LowStockAlert[];
}

export function LowStockModal({ isOpen, onClose, alerts }: LowStockModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Low Stock & Reorder Alerts"
      description="Kitchen ingredients and packaging materials below safe operating thresholds."
      className="max-w-2xl"
    >
      <div className="space-y-4 mt-2">
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            All kitchen ingredients and packaging are above reorder levels.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Reorder Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-xs text-slate-800">
                    {item.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-xs text-rose-600">
                    {item.current_stock} {item.unit}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {item.reorder_level} {item.unit}
                  </TableCell>
                  <TableCell>
                    {item.is_critical ? (
                      <Badge variant="danger" size="sm">
                        Critical
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        Low Stock
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500">
            Automated alerts are triggered when stock reaches configured thresholds.
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Link href="/inventory">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Go to Inventory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
