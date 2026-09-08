"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { Users, Search, ChevronDown, CheckCircle2, Edit2, Factory, History } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { subscribeToManufacturers, subscribeToManufacturerPayments, addManufacturerPaymentToDB, updateManufacturerPaymentInDB, subscribeToManufacturerBills } from "@/lib/db";

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
                No matching manufacturers
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type ManufacturerPaymentRecord = {
  id: string;
  date: string;
  manufacturerName: string;
  amount: string;
  notPayableAmount?: string;
  silverKg: string;
  mode: string;
  remarks: string;
};

export default function ManufacturerPayAmountPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for form
  const [formManufacturerName, setFormManufacturerName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formNotPayableAmount, setFormNotPayableAmount] = useState("");
  const [formSilverKg, setFormSilverKg] = useState("");
  const [formMode, setFormMode] = useState("Cash");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [savedManufacturersList, setSavedManufacturersList] = useState<string[]>([]);
  const [manufacturersData, setManufacturersData] = useState<any[]>([]);
  const [history, setHistory] = useState<ManufacturerPaymentRecord[]>([]);
  const [billsHistory, setBillsHistory] = useState<any[]>([]);

  // Load Data from Firebase
  useEffect(() => {
    const today = new Date();
    setFormDate(today.toISOString().split('T')[0]);

    const unsubMfrs = subscribeToManufacturers((parsedMfrs) => {
      setManufacturersData(parsedMfrs);
      const names = parsedMfrs.map((p: any) => p.name).filter(Boolean);
      setSavedManufacturersList(Array.from(new Set(names)) as string[]);
    });

    const unsubPayments = subscribeToManufacturerPayments((loadedHistory) => {
      // Sort collections by descending created date if possible
      const sorted = loadedHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(sorted);
      
      // Check if we have an editId from the URL
      const editId = searchParams.get('editId');
      if (editId && sorted.length > 0) {
        const recordToEdit = sorted.find((h: any) => h.id === editId);
        if (recordToEdit) {
          setEditingId(recordToEdit.id);
          setFormManufacturerName(recordToEdit.manufacturerName);
          setFormDate(recordToEdit.date);
          setFormAmount(recordToEdit.amount === "0.00" ? "" : recordToEdit.amount);
          setFormNotPayableAmount(recordToEdit.notPayableAmount === "0.00" || !recordToEdit.notPayableAmount ? "" : recordToEdit.notPayableAmount);
          setFormSilverKg(recordToEdit.silverKg === "0.000" ? "" : recordToEdit.silverKg);
          setFormMode(recordToEdit.mode);
          // Remove editId from URL so it doesn't persist forever
          router.replace('/dashboard/manufacturers/pay', undefined);
        }
      }
    });

    const unsubBills = subscribeToManufacturerBills((loadedBills) => {
      setBillsHistory(loadedBills);
    });

    return () => {
      unsubMfrs();
      unsubPayments();
      unsubBills();
    };
  }, [searchParams, router]);

  // Auto-apply Payment Mode based on inputs
  useEffect(() => {
    const amountVal = parseFloat(formAmount) || 0;
    const silverVal = parseFloat(formSilverKg) || 0;

    if (amountVal > 0 && silverVal > 0) {
      setFormMode("Cash & Gram");
    } else if (silverVal > 0 && amountVal === 0) {
      setFormMode("Gram");
    } else if (amountVal > 0 && silverVal === 0) {
      // If it was Gram or Cash & Gram, switch back to Cash. Otherwise leave as is (could be Online, Bank)
      if (formMode === "Gram" || formMode === "Cash & Gram") {
        setFormMode("Cash");
      }
    }
  }, [formAmount, formSilverKg]);

  const getManufacturerOutstanding = (mfrName: string) => {
    // 1. Get initial balance from manufacturer data
    const mfr = manufacturersData.find(m => m.name === mfrName);
    let outAmount = parseFloat(mfr?.payAmount || "0");
    let outSilver = parseFloat(mfr?.payFine || "0");

    // 2. Add all bill amounts
    const mfrBills = billsHistory.filter(b => b.manufacturerName === mfrName);
    mfrBills.forEach(bill => {
      outAmount += parseFloat(bill.netAmount || bill.grossAmount || "0");
      outSilver += parseFloat(bill.totalSilverFine || "0");
    });

    // 3. Subtract all paid amounts
    const mfrPayments = history.filter(h => h.manufacturerName === mfrName);
    mfrPayments.forEach(pay => {
      outAmount -= (parseFloat(pay.amount || "0") + parseFloat(pay.notPayableAmount || "0"));
      outSilver -= parseFloat(pay.silverKg || "0");
    });

    return {
      amount: Math.round(outAmount).toString(),
      fine: Number(outSilver.toFixed(3)).toString()
    };
  };

  const getManufacturerPaid = (mfrName: string) => {
    const mfrPayments = history.filter(h => h.manufacturerName === mfrName);
    let pAmount = 0;
    let pFine = 0;
    mfrPayments.forEach(pay => {
      pAmount += (parseFloat(pay.amount || "0") + parseFloat(pay.notPayableAmount || "0"));
      pFine += parseFloat(pay.silverKg || "0");
    });
    return {
      amount: Number(pAmount.toFixed(2)).toString(),
      silver: Number(pFine.toFixed(3)).toString()
    };
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountVal = parseFloat(formAmount) || 0;
    const notPayableVal = parseFloat(formNotPayableAmount) || 0;
    const silverVal = parseFloat(formSilverKg) || 0;

    if (!formManufacturerName || (amountVal <= 0 && silverVal <= 0 && notPayableVal <= 0)) {
      alert("Please select a manufacturer and enter a valid amount or fine.");
      return;
    }

    const newRecord = {
      date: formDate,
      manufacturerName: formManufacturerName,
      amount: formAmount ? Number(amountVal.toFixed(2)).toString() : "0",
      notPayableAmount: formNotPayableAmount ? Number(notPayableVal.toFixed(2)).toString() : "0",
      silverKg: formSilverKg ? Number(silverVal.toFixed(3)).toString() : "0",
      mode: formMode,
      remarks: ""
    };

    if (editingId) {
      await updateManufacturerPaymentInDB(editingId, newRecord);
      setEditingId(null);
    } else {
      await addManufacturerPaymentToDB(newRecord);
    }

    // Reset some form fields
    setFormAmount("");
    setFormNotPayableAmount("");
    setFormSilverKg("");
    // Keep Manufacturer, Date, and Mode for quick consecutive entries
  };

  // Compute Overall Totals
  const initialTotalAmount = manufacturersData.reduce((acc, m) => acc + parseFloat(m.payAmount || "0"), 0);
  const initialTotalFine = manufacturersData.reduce((acc, m) => acc + parseFloat(m.payFine || "0"), 0);
  const billsTotalAmount = billsHistory.reduce((acc, b) => acc + parseFloat(b.netAmount || b.grossAmount || "0"), 0);
  const billsTotalFine = billsHistory.reduce((acc, b) => acc + parseFloat(b.totalSilverFine || "0"), 0);

  const totalAmount = initialTotalAmount + billsTotalAmount;
  const totalFine = initialTotalFine + billsTotalFine;

  const paidAmount = history.reduce((acc, p) => acc + (parseFloat(p.amount || "0") + parseFloat(p.notPayableAmount || "0")), 0);
  const paidFine = history.reduce((acc, p) => acc + parseFloat(p.silverKg || "0"), 0);
  const dueAmount = totalAmount - paidAmount;
  const dueFine = totalFine - paidFine;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Pay Amount (Manufacturers)</h1>
          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            Record payments made to your manufacturers and suppliers.
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={() => router.push('/dashboard/manufacturers/pay/history')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors shadow-sm"
          >
            <History className="w-4 h-4" />
            View History
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Total Payable Amount</span>
          <span className="text-base sm:text-xl lg:text-2xl font-black text-stone-900 break-all leading-tight">₹ {Number(totalAmount.toFixed(2)).toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Total Payable Fine</span>
          <span className="text-base sm:text-xl lg:text-2xl font-black text-stone-900 break-all leading-tight">{Number(totalFine.toFixed(3)).toString()} g</span>
        </div>
        <div className="bg-emerald-50 p-3 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Paid Amount</span>
          <span className="text-base sm:text-xl lg:text-2xl font-black text-emerald-700 break-all leading-tight">₹ {Number(paidAmount.toFixed(2)).toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-emerald-50 p-3 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Paid Fine</span>
          <span className="text-base sm:text-xl lg:text-2xl font-black text-emerald-700 break-all leading-tight">{Number(paidFine.toFixed(3)).toString()} g</span>
        </div>
        <div className="bg-red-50 p-3 sm:p-5 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] sm:text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Remaining Due (₹)</span>
          <span className="text-base sm:text-xl lg:text-2xl font-black text-red-700 break-all leading-tight">₹ {Number(dueAmount.toFixed(2)).toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-red-50 p-3 sm:p-5 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] sm:text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Remaining Due (g)</span>
          <span className="text-base sm:text-xl lg:text-2xl font-black text-red-700 break-all leading-tight">{Number(dueFine.toFixed(3)).toString()} g</span>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-amber-500" />
          {editingId ? "Edit Payment Entry" : "New Payment Entry"}
        </h2>

        {formManufacturerName && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-white rounded-2xl border border-amber-200 p-5 flex flex-col sm:flex-row gap-6 items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-amber-100 rounded-xl shadow-inner border border-amber-200">
                <Factory className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800/70 tracking-wide uppercase">Selected Manufacturer</p>
                <p className="text-xl font-black text-amber-950 mt-0.5">{formManufacturerName}</p>
              </div>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <div className="bg-white flex-1 sm:flex-none px-5 py-3 rounded-xl border border-amber-100 shadow-sm flex flex-col items-center">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Outstanding Amount</p>
                <p className="text-2xl font-black text-red-600 tracking-tight">₹{getManufacturerOutstanding(formManufacturerName).amount}</p>
              </div>
              <div className="bg-white flex-1 sm:flex-none px-5 py-3 rounded-xl border border-amber-100 shadow-sm flex flex-col items-center">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Outstanding Fine</p>
                <p className="text-2xl font-black text-red-600 tracking-tight">{getManufacturerOutstanding(formManufacturerName).fine} <span className="text-sm">g</span></p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSavePayment} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-6 items-end">
          <div className="lg:col-span-1">
            <label className="block text-sm font-semibold text-stone-900 mb-2">
              Manufacturer *
            </label>
            <SearchableSelect
              options={savedManufacturersList}
              value={formManufacturerName}
              onChange={setFormManufacturerName}
              placeholder="Select Manufacturer"
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
              <option value="Online">Online</option>
              <option value="Bank">Bank</option>
              <option value="Gram">Gram</option>
              <option value="Cash & Gram">Cash & Gram</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <button
              type="submit"
              className="w-full px-6 py-3 text-sm font-extrabold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-amber-200 flex justify-center items-center gap-2"
            >
              {editingId ? "Update Payment" : "Pay Now"}
            </button>
          </div>
        </form>
      </div>

      {/* Manufacturers Overview Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-200 bg-stone-50/50">
          <h2 className="text-lg font-bold text-stone-900">Total Manufacturers</h2>
          <p className="text-sm text-stone-500 mt-1">Click on a manufacturer to quickly select them for payment.</p>
        </div>
        <div className="overflow-x-hidden sm:overflow-x-auto max-h-[500px] sm:max-h-80">
          <table className="w-full text-left border-collapse border-none sm:border border-stone-200 block sm:table">
            <thead className="hidden sm:table-header-group sticky top-0 bg-stone-50/90 backdrop-blur-sm z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 w-16 text-center">Sr No</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Company Name</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 text-right">Outstanding (₹)</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 text-right">Outstanding Fine (g)</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 text-right">Paid (₹)</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 text-right">Paid Fine (g)</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Mobile Number</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {manufacturersData.map((mfr, idx) => {
                const outstanding = getManufacturerOutstanding(mfr.name);
                const paid = getManufacturerPaid(mfr.name);
                return (
                  <tr
                    key={mfr.id || idx}
                    onClick={() => setFormManufacturerName(mfr.name)}
                    className="block sm:table-row bg-white hover:bg-amber-50 transition-colors cursor-pointer border-b-8 sm:border-b-0 border-stone-100 sm:border border-stone-200 p-4 sm:p-0 relative"
                  >
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-stone-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-center">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Sr No</span>
                      {idx + 1}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-bold text-stone-900 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Name</span>
                      {mfr.name}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-bold text-stone-900 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Company Name</span>
                      {mfr.companyName || "-"}
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
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Paid (₹)</span>
                      {paid.amount}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-bold text-emerald-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-right">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Paid Fine (g)</span>
                      {paid.silver}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm text-stone-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Mobile</span>
                      {mfr.mobile || "-"}
                    </td>
                  </tr>
                );
              })}
              {manufacturersData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-stone-500 text-sm">
                    No manufacturers found.
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
