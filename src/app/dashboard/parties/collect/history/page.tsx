"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { Users, Edit2, Trash2, ArrowLeft, Search, X, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { subscribeToCollections, deleteCollectionFromDB, moveToTrashDB, subscribeToParties, subscribeToBills } from "@/lib/db";

type CollectionRecord = {
  id: string;
  date: string;
  partyName: string;
  amount: string;
  silverKg: string;
  mode: string;
  remarks: string;
  createdAt?: string;
};

export default function CollectionHistoryPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [history, setHistory] = useState<CollectionRecord[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [billsHistory, setBillsHistory] = useState<any[]>([]);

  const [historySearch, setHistorySearch] = useState("");
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");

  useEffect(() => {
    const unsubColls = subscribeToCollections((loadedHistory) => {
      const sorted = loadedHistory.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setHistory(sorted);
    });
    
    const unsubParties = subscribeToParties((data) => setParties(data));
    const unsubBills = subscribeToBills((data) => setBillsHistory(data));

    return () => {
      unsubColls();
      unsubParties();
      unsubBills();
    };
  }, []);

  const getPartyOutstanding = (party: any) => {
    let outAmount = parseFloat(party?.previousAmount || "0");
    let outSilver = parseFloat(party?.previousFine || "0");

    const partyBills = billsHistory.filter((b: any) => b.partyName === party.name);
    partyBills.forEach((bill: any) => {
      const billAmount = Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.lbramt) || 0), 0) || 0);
      const billSilver = Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.silver) || 0), 0) || 0);
      outAmount += billAmount;
      outSilver += billSilver;
    });

    const partyCollections = history.filter((h: any) => h.partyName === party.name);
    partyCollections.forEach((coll: any) => {
      outAmount -= parseFloat(coll.amount || "0");
      outSilver -= parseFloat(coll.silverKg || "0");
    });

    return {
      amount: Math.round(outAmount).toString(),
      fine: Math.round(outSilver).toString()
    };
  };

  const handleWhatsApp = (record: CollectionRecord) => {
    const party = parties.find(p => p.name === record.partyName);
    let outAmount = "0";
    let outFine = "0";
    if (party) {
      const outstanding = getPartyOutstanding(party);
      outAmount = outstanding.amount;
      outFine = outstanding.fine;
    }

    const text = `Hello ${record.partyName},\n\nWe have successfully received your payment. Thank you!\n\n🟢 Collected Amount: ₹${record.amount}\n🟢 Collected Fine: ${record.silverKg || 0} g\n\n🔴 Total Outstanding Amount: ₹${outAmount}\n🔴 Total Outstanding Fine: ${outFine} g\n\nThank you!\nvia N D Suhagiya`;
    const encodedText = encodeURIComponent(text);

    let url = `https://wa.me/?text=${encodedText}`;
    if (party && party.mobile) {
      const phone = party.mobile.replace(/\D/g, '');
      if (phone) {
        url = `https://wa.me/${phone}?text=${encodedText}`;
      }
    }
    window.open(url, '_blank');
  };

  const handleEdit = (record: CollectionRecord) => {
    // Navigate to collect page with editId query param
    router.push(`/dashboard/parties/collect?editId=${record.id}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this collection record?")) {
      const deletedRecord = history.find(r => r.id === id);
      if (deletedRecord) {
        await moveToTrashDB('collection', deletedRecord);
        await deleteCollectionFromDB(id);
      }
    }
  };

  const filteredHistory = history.filter((record) => {
    const searchMatch = !historySearch || 
      (record.partyName || "").toLowerCase().includes(historySearch.toLowerCase());
      
    let dateMatch = true;
    const recordDate = new Date(record.date);
    if (historyFromDate && !isNaN(recordDate.getTime())) {
      if (recordDate < new Date(historyFromDate)) dateMatch = false;
    }
    if (historyToDate && !isNaN(recordDate.getTime())) {
      const to = new Date(historyToDate);
      to.setDate(to.getDate() + 1);
      if (recordDate >= to) dateMatch = false;
    }
    
    return searchMatch && dateMatch;
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/dashboard/parties/collect"
              className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Collection History</h1>
          </div>
          <p className="mt-2 text-sm text-stone-500 max-w-2xl ml-10">
            View all past collection records.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by party..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <input
              type="date"
              value={historyFromDate}
              onChange={(e) => setHistoryFromDate(e.target.value)}
              className="flex-1 min-w-0 w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              title="From Date"
            />
            <span className="text-stone-400 text-sm">to</span>
            <input
              type="date"
              value={historyToDate}
              onChange={(e) => setHistoryToDate(e.target.value)}
              className="flex-1 min-w-0 w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              title="To Date"
            />
            {(historyFromDate || historyToDate || historySearch) && (
              <button
                onClick={() => {
                  setHistoryFromDate("");
                  setHistoryToDate("");
                  setHistorySearch("");
                }}
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                title="Clear Filters"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-hidden sm:overflow-x-auto">
          <table className="w-full text-left border-collapse border-none sm:border border-stone-200 block sm:table">
            <thead className="hidden sm:table-header-group">
              <tr className="bg-stone-50/80">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 w-16 text-center">Sr No</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Time</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Party Name</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 text-right">Amount (₹)</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 text-right">Fine (Kg)</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 text-center">Mode</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right border border-stone-200 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {filteredHistory.map((record, idx) => (
                <tr key={record.id} className="block sm:table-row bg-white hover:bg-stone-50/50 transition-colors border-b-8 sm:border-b-0 border-stone-100 sm:border border-stone-200 p-4 sm:p-0 relative">
                  <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-stone-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-center">
                    <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Sr No</span>
                    {idx + 1}
                  </td>
                  <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-stone-900 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 whitespace-nowrap">
                    <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Date</span>
                    {new Date(record.date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-stone-500 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 whitespace-nowrap">
                    <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Time</span>
                    {record.createdAt ? new Date(record.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : "-"}
                  </td>
                  <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-bold text-amber-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                    <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Party Name</span>
                    {record.partyName}
                  </td>
                  <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-bold text-stone-900 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-right">
                    <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Amount (₹)</span>
                    {record.amount}
                  </td>
                  <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-bold text-stone-900 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-right">
                    <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Fine (Kg)</span>
                    {record.silverKg || "0.000"}
                  </td>
                  <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-center">
                    <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Mode</span>
                    <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-semibold whitespace-nowrap">
                      {record.mode}
                    </span>
                  </td>
                  <td className="flex sm:table-cell justify-end sm:justify-center items-center px-2 py-3 sm:px-6 sm:py-4 text-sm text-right border-none sm:border-solid sm:border border-stone-200 bg-stone-50/50 sm:bg-transparent mt-2 sm:mt-0 rounded-lg sm:rounded-none">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        title="Send WhatsApp"
                        onClick={() => handleWhatsApp(record)}
                        className="flex items-center gap-2 px-3 py-1.5 sm:p-2 text-green-500 sm:text-stone-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors bg-white sm:bg-transparent border border-stone-200 sm:border-none shadow-sm sm:shadow-none font-medium text-xs sm:text-sm"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <span className="sm:hidden">WhatsApp</span>
                      </button>
                      <button
                        title="Edit Record"
                        onClick={() => handleEdit(record)}
                        className="flex items-center gap-2 px-3 py-1.5 sm:p-2 text-emerald-500 sm:text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors bg-white sm:bg-transparent border border-stone-200 sm:border-none shadow-sm sm:shadow-none font-medium text-xs sm:text-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="sm:hidden">Edit</span>
                      </button>
                      <button
                        title="Delete Record"
                        onClick={() => handleDelete(record.id)}
                        className="flex items-center gap-2 px-3 py-1.5 sm:p-2 text-red-500 sm:text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white sm:bg-transparent border border-stone-200 sm:border-none shadow-sm sm:shadow-none font-medium text-xs sm:text-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="sm:hidden">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-stone-400">
                      <Users className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm font-medium">No collection records found.</p>
                      <p className="text-xs mt-1">Go back to record a payment.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
