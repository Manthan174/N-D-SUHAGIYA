"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { Users, Save, ArrowLeft } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addPartyToDB } from "@/lib/db";

export default function AddPartyPage() {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formAddress, setFormAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    
    // Redirect back to parties list immediately for better UX
    router.push("/dashboard/parties");

    try {
      await addPartyToDB({
        name: formName.trim(),
        mobile: formMobile,
        address: formAddress,
        category: "Customer",
        previousAmount: "0.00",
        previousFine: "0.000"
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link 
              href="/dashboard/parties"
              className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Add New Party</h1>
          </div>
          <p className="text-sm text-stone-500 max-w-2xl ml-10">
            Create a new party profile to quickly use in your billing and invoicing.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm max-w-2xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-2">Party Name *</label>
            <input 
              type="text" 
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Enter customer or business name"
              className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-2">Mobile Number</label>
            <input 
              type="tel" 
              value={formMobile}
              onChange={e => setFormMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-2">Address</label>
            <textarea 
              rows={4}
              value={formAddress}
              onChange={e => setFormAddress(e.target.value)}
              placeholder="Full address details"
              className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50 resize-none"
            />
          </div>
          
          <div className="pt-6 mt-6 flex gap-4 border-t border-stone-100">
            <Link 
              href="/dashboard/parties"
              className="flex-1 text-center px-6 py-3 text-sm font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit"
              className="flex-1 flex justify-center items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Party
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
