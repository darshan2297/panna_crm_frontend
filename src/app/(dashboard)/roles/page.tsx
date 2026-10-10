import React, { Suspense } from "react";
import { Shield } from "lucide-react";
import { RolesClient } from "@/components/roles/RolesClient";

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
            Roles &amp; Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control what each staff member can see and change, module by module.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="h-96 bg-stone-200/60 rounded-2xl animate-pulse" aria-hidden="true" />
        }
      >
        <RolesClient />
      </Suspense>
    </div>
  );
}
