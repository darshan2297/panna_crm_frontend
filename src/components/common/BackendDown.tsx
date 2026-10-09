"use client";

import React from "react";
import { ServerCrash, RefreshCw, WifiOff } from "lucide-react";

export function BackendDown() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 text-center bg-[#FAF8F5]">
      <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm mb-6">
        <ServerCrash className="w-10 h-10" />
      </div>

      <div className="space-y-3 max-w-md">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
          Backend Server Offline
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          The CRM backend service is not running. Please start the backend server and try again.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 bg-panna-green-900 hover:bg-panna-green-800 text-white font-bold px-6 py-2.5 rounded-full text-xs uppercase tracking-wider transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>

      <div className="mt-10 flex items-center gap-2 text-xs text-slate-400">
        <WifiOff className="w-3.5 h-3.5" />
        <span>API service unreachable at http://localhost:8000</span>
      </div>
    </div>
  );
}
