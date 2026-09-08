"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { Plus, Receipt, Eye } from "lucide-react";

export default function BillingPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Billing</h1>
          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            Manage your invoices and create new bills.
          </p>
        </div>
        
        {/* Top Right Buttons */}
        <div className="shrink-0 flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors focus:ring-4 focus:ring-stone-50">
            <Eye className="h-5 w-5" />
            View
          </button>
        </div>
      </div>

      {/* Empty State / Content area */}
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
        <div className="mx-auto h-12 w-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
          <Receipt className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-medium text-stone-900">No bills found</h3>
        <p className="mt-2 text-sm text-stone-500">Get started by creating your first bill.</p>
        <div className="mt-6">
          <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-xl transition-colors">
            <Plus className="h-5 w-5" />
            Create your first bill
          </button>
        </div>
      </div>
    </div>
  );
}
