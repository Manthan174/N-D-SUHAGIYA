"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { Plus, Users, Search, ChevronDown, CheckCircle2, Edit2, Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { subscribeToParties, subscribeToBills, subscribeToCollections, addCollectionToDB, updateCollectionInDB } from "@/lib/db";

// Custom Searchable Dropdown Component
function SearchableSelect({ options, value, onChange, placeholder }: { options: string[], value: string, onChange: (val: string) => void, placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl bg-stone-50/50 hover:bg-stone-50 cursor-pointer flex justify-between items-center transition-colors"
      >
        <span className={value ? "text-stone-900 font-semibold" : "text-stone-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-[70] mt-2 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-stone-100 bg-stone-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                autoFocus
                type="text"
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Search options..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {filteredOptions.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch("");
                }}
                className="px-3 py-2.5 hover:bg-amber-50 hover:text-amber-700 cursor-pointer text-sm rounded-lg transition-colors"
              >
                {opt}
              </div>
            ))}
            {filteredOptions.length === 0 && !search.trim() && (
              <div className="px-4 py-4 text-sm text-stone-500 text-center">
                No matching parties
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type CollectionRecord = {
  id: string;
  date: string;
  partyName: string;
  amount: string;
  notPayableAmount?: string;
  silverKg: string;
  mode: string;
  remarks: string;
};

export default function CollectAmountPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for form
  const [formPartyName, setFormPartyName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formNotPayableAmount, setFormNotPayableAmount] = useState("");
  const [formSilverKg, setFormSilverKg] = useState("");
  const [formMode, setFormMode] = useState("Cash");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [savedPartiesList, setSavedPartiesList] = useState<string[]>([]);
  const [partiesData, setPartiesData] = useState<any[]>([]);
  const [history, setHistory] = useState<CollectionRecord[]>([]);
  const [billsHistory, setBillsHistory] = useState<any[]>([]);

  // Load Data from Firebase
  useEffect(() => {
    const today = new Date();
    setFormDate(today.toISOString().split('T')[0]);

    const unsubParties = subscribeToParties((parsedParties) => {
      setPartiesData(parsedParties);
      const names = parsedParties.map((p: any) => p.name);
      setSavedPartiesList(Array.from(new Set(names)) as string[]);
    });

    const unsubBills = subscribeToBills((data) => setBillsHistory(data));

    const unsubColls = subscribeToCollections((loadedHistory) => {
      // Sort collections by descending created date if possible
      const sorted = loadedHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(sorted);
      
      // Check if we have an editId from the URL
      const editId = searchParams.get('editId');
      if (editId && sorted.length > 0) {
        const recordToEdit = sorted.find((h: any) => h.id === editId);
        if (recordToEdit) {
          setEditingId(recordToEdit.id);
          setFormPartyName(recordToEdit.partyName);
          setFormDate(recordToEdit.date);
          setFormAmount(recordToEdit.amount === "0.00" ? "" : recordToEdit.amount);
          setFormNotPayableAmount(recordToEdit.notPayableAmount === "0.00" || !recordToEdit.notPayableAmount ? "" : recordToEdit.notPayableAmount);
          setFormSilverKg(recordToEdit.silverKg === "0.000" ? "" : recordToEdit.silverKg);
          setFormMode(recordToEdit.mode);
          // Remove editId from URL so it doesn't persist forever
          router.replace('/dashboard/parties/collect', undefined);
        }
      }
    });

    return () => {
      unsubParties();
      unsubBills();
      unsubColls();
    };
  }, [searchParams, router]);

  // Auto-apply "Gram" payment mode if only fine is collected
  useEffect(() => {
    const amountVal = parseFloat(formAmount) || 0;
    const notPayableVal = parseFloat(formNotPayableAmount) || 0;
    const silverVal = parseFloat(formSilverKg) || 0;

    if (silverVal > 0 && amountVal === 0 && notPayableVal === 0) {
      setFormMode("Gram");
    } else if (formMode === "Gram" && (amountVal > 0 || notPayableVal > 0)) {
      setFormMode("Cash");
    }
  }, [formAmount, formNotPayableAmount, formSilverKg, formMode]);

  const getPartyOutstanding = (partyName: string) => {
    // 1. Get initial balance from party data
    const party = partiesData.find(p => p.name === partyName);
    let outAmount = parseFloat(party?.previousAmount || "0");
    let outSilver = parseFloat(party?.previousFine || "0");

    // 2. Add all bill amounts for this party
    const partyBills = billsHistory.filter(b => b.partyName === partyName);
    partyBills.forEach(bill => {
      const billAmount = Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.lbramt) || 0), 0) || 0);
      const billSilver = Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.silver) || 0), 0) || 0);
      outAmount += billAmount;
      outSilver += billSilver;
    });

    // 3. Subtract all collected amounts
    const partyCollections = history.filter(h => h.partyName === partyName);
    partyCollections.forEach(coll => {
      outAmount -= (parseFloat(coll.amount || "0") + parseFloat(coll.notPayableAmount || "0"));
      outSilver -= parseFloat(coll.silverKg || "0");
    });

    return {
      amount: Math.round(outAmount).toString(),
      fine: Math.round(outSilver).toString()
    };
  };

  const getPartyCollected = (partyName: string) => {
    const partyCollections = history.filter(h => h.partyName === partyName);
    let cAmount = 0;
    let cFine = 0;
    partyCollections.forEach(coll => {
      cAmount += (parseFloat(coll.amount || "0") + parseFloat(coll.notPayableAmount || "0"));
      cFine += parseFloat(coll.silverKg || "0");
    });
    return {
      amount: Number(cAmount.toFixed(2)).toString(),
      silver: Number(cFine.toFixed(3)).toString()
    };
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountVal = parseFloat(formAmount) || 0;
    const notPayableVal = parseFloat(formNotPayableAmount) || 0;
    const silverVal = parseFloat(formSilverKg) || 0;

    if (!formPartyName || (amountVal <= 0 && silverVal <= 0 && notPayableVal <= 0)) {
      alert("Please select a party and enter a valid amount or fine.");
      return;
    }

    const newRecord = {
      date: formDate,
      partyName: formPartyName,
      amount: formAmount ? Number(amountVal.toFixed(2)).toString() : "0",
      notPayableAmount: formNotPayableAmount ? Number(notPayableVal.toFixed(2)).toString() : "0",
      silverKg: formSilverKg ? Number(silverVal.toFixed(3)).toString() : "0",
      mode: formMode,
      remarks: ""
    };

    if (editingId) {
      await updateCollectionInDB(editingId, newRecord);
      setEditingId(null);
    } else {
      await addCollectionToDB(newRecord);
    }

    // Reset some form fields
    setFormAmount("");
    setFormNotPayableAmount("");
    setFormSilverKg("");
    // Keep Party, Date, and Mode for quick consecutive entries
  };

  // Compute Overall Totals
  const totalAmount = partiesData.reduce((acc, p) => acc + parseFloat(p.previousAmount || "0"), 0) +
    billsHistory.reduce((acc, b) => acc + (b.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.lbramt) || 0), 0) || 0), 0);
  const totalFine = partiesData.reduce((acc, p) => acc + parseFloat(p.previousFine || "0"), 0) +
    billsHistory.reduce((acc, b) => acc + (b.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.silver) || 0), 0) || 0), 0);
  const collectedAmount = history.reduce((acc, c) => acc + (parseFloat(c.amount || "0") + parseFloat(c.notPayableAmount || "0")), 0);
  const collectedFine = history.reduce((acc, c) => acc + parseFloat(c.silverKg || "0"), 0);
  const dueAmount = totalAmount - collectedAmount;
  const dueFine = totalFine - collectedFine;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Collect Amount</h1>
          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            Record payments received from your parties and customers.
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={() => router.push('/dashboard/parties/collect/history')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors shadow-sm"
          >
            View History
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Total Amount Billed</span>
          <span className="text-base sm:text-xl lg:text-2xl font-black text-stone-900 break-all leading-tight">₹ {Number(totalAmount.toFixed(2)).toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Total Fine Billed</span>
          <span className="text-base sm:text-xl lg:text-2xl font-black text-stone-900 break-all leading-tight">{Number(totalFine.toFixed(3)).toString()} g</span>
        </div>
        <div className="bg-emerald-50 p-3 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Collected Amount</span>
          <span className="text-base sm:text-xl lg:text-2xl font-black text-emerald-700 break-all leading-tight">₹ {Number(collectedAmount.toFixed(2)).toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-emerald-50 p-3 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Collected Fine</span>
          <span className="text-base sm:text-xl lg:text-2xl font-black text-emerald-700 break-all leading-tight">{Number(collectedFine.toFixed(3)).toString()} g</span>
        </div>
        <div className="bg-red-50 p-3 sm:p-5 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] sm:text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Due Amount</span>
          <span className="text-base sm:text-xl lg:text-2xl font-black text-red-700 break-all leading-tight">₹ {Number(dueAmount.toFixed(2)).toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-red-50 p-3 sm:p-5 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] sm:text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Due Fine</span>
          <span className="text-base sm:text-xl lg:text-2xl font-black text-red-700 break-all leading-tight">{Number(dueFine.toFixed(3)).toString()} g</span>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          {editingId ? "Edit Collection Entry" : "New Collection Entry"}
        </h2>

        {formPartyName && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-white rounded-2xl border border-amber-200 p-5 flex flex-col sm:flex-row gap-6 items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-amber-100 rounded-xl shadow-inner border border-amber-200">
                <Users className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800/70 tracking-wide uppercase">Selected Party</p>
                <p className="text-xl font-black text-amber-950 mt-0.5">{formPartyName}</p>
              </div>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <div className="bg-white flex-1 sm:flex-none px-5 py-3 rounded-xl border border-amber-100 shadow-sm flex flex-col items-center">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Outstanding Amount</p>
                <p className="text-2xl font-black text-red-600 tracking-tight">₹{getPartyOutstanding(formPartyName).amount}</p>
              </div>
              <div className="bg-white flex-1 sm:flex-none px-5 py-3 rounded-xl border border-amber-100 shadow-sm flex flex-col items-center">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Outstanding Fine</p>
                <p className="text-2xl font-black text-red-600 tracking-tight">{getPartyOutstanding(formPartyName).fine} <span className="text-sm">g</span></p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveCollection} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-6 items-end">
          <div className="lg:col-span-1">
            <label className="block text-sm font-semibold text-stone-900 mb-2">
              Party Name *
            </label>
            <SearchableSelect
              options={savedPartiesList}
              value={formPartyName}
              onChange={setFormPartyName}
              placeholder="Select Party"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              value={formAmount}
              onChange={e => setFormAmount(e.target.value)}
              onBlur={e => e.target.value && setFormAmount(Number(Number(e.target.value).toFixed(2)).toString())}
              placeholder="0"
              className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all font-semibold"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-2">
              Not Payable (₹)
            </label>
            <input
              type="number"
              value={formNotPayableAmount}
              onChange={e => setFormNotPayableAmount(e.target.value)}
              onBlur={e => e.target.value && setFormNotPayableAmount(Number(Number(e.target.value).toFixed(2)).toString())}
              placeholder="0"
              className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-red-50 focus:border-red-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all font-semibold text-red-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-2">
              Fine (g)
            </label>
            <input
              type="number"
              value={formSilverKg}
              onChange={e => setFormSilverKg(e.target.value)}
              onBlur={e => e.target.value && setFormSilverKg(Number(Number(e.target.value).toFixed(3)).toString())}
              placeholder="0"
              className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all font-semibold"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-2">
              Payment Mode
            </label>
            <select
              value={formMode}
              onChange={e => setFormMode(e.target.value)}
              className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI</option>
              <option value="Gram">Gram</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <button
              type="submit"
              className="w-full px-6 py-3 text-sm font-extrabold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-stone-200 flex justify-center items-center gap-2"
            >
              {editingId ? "Update Collection" : "Collect"}
            </button>
          </div>
        </form>
      </div>

      {/* Created Parties Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-200 bg-stone-50/50">
          <h2 className="text-lg font-bold text-stone-900">Total Parties</h2>
          <p className="text-sm text-stone-500 mt-1">Click on a party to quickly select them for collection.</p>
        </div>
        <div className="overflow-x-hidden sm:overflow-x-auto max-h-[500px] sm:max-h-80">
          <table className="w-full text-left border-collapse border-none sm:border border-stone-200 block sm:table">
            <thead className="hidden sm:table-header-group sticky top-0 bg-stone-50/90 backdrop-blur-sm z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 w-16 text-center">Sr No</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Party Name</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 text-right">Outstanding Amount (₹)</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 text-right">Outstanding Fine (g)</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 text-right">Collected Amount (₹)</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 text-right">Collected Fine (g)</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Mobile Number</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Address</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {partiesData.map((party, idx) => {
                const outstanding = getPartyOutstanding(party.name);
                const collected = getPartyCollected(party.name);
                return (
                  <tr
                    key={party.id || idx}
                    onClick={() => setFormPartyName(party.name)}
                    className="block sm:table-row bg-white hover:bg-amber-50 transition-colors cursor-pointer border-b-8 sm:border-b-0 border-stone-100 sm:border border-stone-200 p-4 sm:p-0 relative"
                  >
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-stone-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-center">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Sr No</span>
                      {idx + 1}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-bold text-stone-900 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Party Name</span>
                      {party.name}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-bold text-red-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-right">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Outstanding (₹)</span>
                      {outstanding.amount}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-bold text-red-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-right">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Outstanding Fine (g)</span>
                      {outstanding.fine}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-bold text-emerald-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-right">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Collected (₹)</span>
                      {collected.amount}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-bold text-emerald-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-right">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Collected Fine (g)</span>
                      {collected.silver}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm text-stone-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Mobile</span>
                      {party.mobile || "-"}
                    </td>
                    <td className="flex sm:table-cell justify-between items-start sm:items-center px-2 py-2 sm:px-6 sm:py-4 text-sm text-stone-600 max-w-xs sm:truncate border-none sm:border-solid border-stone-200">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase whitespace-nowrap mr-4 mt-1">Address</span>
                      <span className="text-right sm:text-left">{party.address || "-"}</span>
                    </td>
                  </tr>
                );
              })}
              {partiesData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-stone-500 text-sm">
                    No parties found.
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
