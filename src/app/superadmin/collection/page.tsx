"use client";

import { Layers } from "lucide-react";

export default function CollectionPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-600" />
            Collection
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Manage your collections here.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-8 text-center">
        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8 text-stone-400" />
        </div>
        <h2 className="text-lg font-semibold text-stone-900 mb-2">Collection Module</h2>
        <p className="text-stone-500">This module is currently under development.</p>
      </div>
    </div>
  );
}
