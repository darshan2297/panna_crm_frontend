"use client";

import React, { useState } from "react";
import { SalesTrendPoint } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";

interface SalesTrendChartProps {
  trendData: SalesTrendPoint[];
}

export function SalesTrendChart({ trendData }: SalesTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!trendData || trendData.length === 0) {
    return null;
  }

  const maxTotal = Math.max(...trendData.map((d) => d.total), 1000);
  const chartHeight = 200;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 20;

  const getX = (index: number) => {
    return paddingX + (index * (chartWidth - 2 * paddingX)) / (trendData.length - 1);
  };

  const getY = (val: number) => {
    return chartHeight - paddingY - (val / maxTotal) * (chartHeight - 2 * paddingY);
  };

  // Build SVG path for each series
  const buildPath = (key: "zomato" | "swiggy" | "website") => {
    return trendData
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d[key])}`)
      .join(" ");
  };

  const zomatoPath = buildPath("zomato");
  const swiggyPath = buildPath("swiggy");
  const websitePath = buildPath("website");

  const hoveredData = hoveredIndex !== null ? trendData[hoveredIndex] : null;

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div>
          <CardTitle>Sales Overview & Platform Trends</CardTitle>
          <CardDescription>
            Multi-platform revenue over the last 7 days (Zomato, Swiggy, Website)
          </CardDescription>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600 font-medium">Zomato</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-600 font-medium">Swiggy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 font-medium">Website</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Tooltip inspection */}
        <div className="h-7 mb-2 flex items-center justify-between text-xs">
          {hoveredData ? (
            <div className="flex items-center gap-3 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 font-medium animate-in fade-in">
              <span className="font-bold text-slate-800">{hoveredData.day} ({hoveredData.date}):</span>
              <span className="text-amber-600 font-semibold">Zomato: {formatCurrency(hoveredData.zomato)}</span>
              <span className="text-orange-600 font-semibold">Swiggy: {formatCurrency(hoveredData.swiggy)}</span>
              <span className="text-emerald-600 font-semibold">Website: {formatCurrency(hoveredData.website)}</span>
              <span className="text-slate-900 font-bold border-l pl-2">Total: {formatCurrency(hoveredData.total)}</span>
            </div>
          ) : (
            <span className="text-slate-400 italic">Hover over any day point to inspect platform breakdown</span>
          )}
        </div>

        {/* SVG Chart */}
        <div className="relative w-full aspect-[3/1] max-h-56">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full overflow-visible"
          >
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = chartHeight - paddingY - pct * (chartHeight - 2 * paddingY);
              const labelVal = Math.round(pct * maxTotal);
              return (
                <g key={i}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-400 font-sans"
                  >
                    ₹{labelVal >= 1000 ? `${(labelVal / 1000).toFixed(0)}k` : labelVal}
                  </text>
                </g>
              );
            })}

            {/* Lines */}
            <path
              d={zomatoPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-all duration-300"
            />
            <path
              d={swiggyPath}
              fill="none"
              stroke="#ea580c"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-all duration-300"
            />
            <path
              d={websitePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-all duration-300"
            />

            {/* Points & Interactive Hover Columns */}
            {trendData.map((d, i) => {
              const x = getX(i);
              return (
                <g key={i} className="cursor-pointer">
                  {/* Invisible hover trigger column */}
                  <rect
                    x={x - 20}
                    y={0}
                    width={40}
                    height={chartHeight}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* Zomato dot */}
                  <circle
                    cx={x}
                    cy={getY(d.zomato)}
                    r={hoveredIndex === i ? "5" : "3.5"}
                    fill="#ffffff"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />

                  {/* Swiggy dot */}
                  <circle
                    cx={x}
                    cy={getY(d.swiggy)}
                    r={hoveredIndex === i ? "5" : "3.5"}
                    fill="#ffffff"
                    stroke="#ea580c"
                    strokeWidth="2"
                  />

                  {/* Website dot */}
                  <circle
                    cx={x}
                    cy={getY(d.website)}
                    r={hoveredIndex === i ? "5" : "3.5"}
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth="2"
                  />

                  {/* X Axis Day Label */}
                  <text
                    x={x}
                    y={chartHeight - 2}
                    textAnchor="middle"
                    className={`text-[10px] font-sans ${
                      hoveredIndex === i
                        ? "fill-slate-900 font-bold"
                        : "fill-slate-500 font-medium"
                    }`}
                  >
                    {d.day}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
