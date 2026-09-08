"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import {
  Factory,
  Plus,
  Trash2,
  Edit2,
  Search,
  ChevronDown,
  FileText,
  Calendar,
  IndianRupee,
  Weight,
  Loader2,
  CheckCircle2,
  Eye,
  X,
  Printer,
  History,
  Receipt,
  Building2,
  Phone,
  MapPin
} from "lucide-react";
import {
  subscribeToManufacturers,
  subscribeToManufacturerBills,
  addManufacturerBillToDB,
  updateManufacturerBillInDB,
  deleteManufacturerBillFromDB
} from "@/lib/db";

// Searchable Select Component for Manufacturer selection
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder
}: {
  options: { id: string; name: string; companyName?: string; mobile?: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
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

  const filteredOptions = options.filter(
    opt =>
      opt.name.toLowerCase().includes(search.toLowerCase()) ||
      (opt.companyName && opt.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (opt.mobile && opt.mobile.includes(search))
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl bg-stone-50/50 hover:bg-stone-50 cursor-pointer flex justify-between items-center transition-colors"
      >
        <span className={value ? "text-stone-900 font-medium" : "text-stone-400"}>
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
                placeholder="Search manufacturer by name, company, or mobile..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => {
                  onChange(opt.name);
                  setIsOpen(false);
                  setSearch("");
                }}
                className="px-3 py-2.5 hover:bg-amber-50 hover:text-amber-700 cursor-pointer text-sm rounded-lg transition-colors flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-stone-800">{opt.name}</div>
                  {opt.companyName && (
                    <div className="text-xs text-stone-500">{opt.companyName}</div>
                  )}
                </div>
                {opt.mobile && (
                  <span className="text-xs font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                    {opt.mobile}
                  </span>
                )}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-4 text-sm text-stone-500 text-center">
                No matching manufacturer found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type BillItem = {
  id: string;
  description: string;
  gross: string;
  netWt: string;
  touch: string;
  w: string;
  fine: string;
  wt1000pcs: string;
  rate: string;
  amount: string;
};

type ManufacturerBillRecord = {
  id: string;
  billNo: string;
  date: string;
  manufacturerName: string;
  items: BillItem[];
  totalWeight: string;
  totalSilverFine: string;
  grossAmount: string;
  labourCharges: string;
  discount: string;
  netAmount: string;
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  remarks: string;
  createdAt?: string;
};

export default function AddManufacturerBillPage() {
  const { t } = useLanguage();

  // Data states
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [bills, setBills] = useState<ManufacturerBillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<BillItem[]>([
    { id: "1", description: "", gross: "", netWt: "", touch: "100", w: "", fine: "0.000", wt1000pcs: "", rate: "", amount: "" }
  ]);
  const [labourCharges, setLabourCharges] = useState("");
  const [discount, setDiscount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"Unpaid" | "Partial" | "Paid">("Unpaid");
  const [remarks, setRemarks] = useState("");

  // Search & Filter state for History
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingBill, setViewingBill] = useState<ManufacturerBillRecord | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Subscribe to Manufacturers & Bills
  useEffect(() => {
    const unsubMfrs = subscribeToManufacturers((data) => {
      setManufacturers(data);
    });

    const unsubBills = subscribeToManufacturerBills((data) => {
      setBills(data as ManufacturerBillRecord[]);
      setLoading(false);
    });

    return () => {
      unsubMfrs();
      unsubBills();
    };
  }, []);

  // Selected manufacturer detail
  const currentMfr = manufacturers.find((m) => m.name === selectedManufacturer);

  // Item handler helpers
  const handleItemChange = (id: string, field: keyof BillItem, val: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };

        return updated;
      })
    );
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        description: "",
        gross: "",
        netWt: "",
        touch: "100",
        w: "",
        fine: "0.000",
        wt1000pcs: "",
        rate: "",
        amount: ""
      }
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Calculations
  const calculatedTotalWeight = items
    .reduce((sum, item) => sum + (parseFloat(item.netWt || item.gross) || 0), 0)
    .toFixed(3);

  const calculatedTotalSilverFine = items
    .reduce((sum, item) => sum + (parseFloat(item.fine) || 0), 0)
    .toFixed(3);

  const calculatedGrossAmount = items
    .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const labourVal = parseFloat(labourCharges) || 0;
  const discountVal = parseFloat(discount) || 0;
  const calculatedNetAmount = Math.max(0, calculatedGrossAmount + labourVal - discountVal).toFixed(2);

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setSelectedManufacturer("");
    setBillNo("");
    setBillDate(new Date().toISOString().split("T")[0]);
    setItems([
      { id: "1", description: "", gross: "", netWt: "", touch: "100", w: "", fine: "0.000", wt1000pcs: "", rate: "", amount: "" }
    ]);
    setLabourCharges("");
    setDiscount("");
    setPaymentStatus("Unpaid");
    setRemarks("");
  };

  // Save Bill
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedManufacturer) {
      alert("Please select a manufacturer");
      return;
    }

    if (!billNo.trim()) {
      alert("Please enter a valid bill number");
      return;
    }

    setSaving(true);

    const billData: Omit<ManufacturerBillRecord, "id"> = {
      billNo: billNo.trim(),
      date: billDate,
      manufacturerName: selectedManufacturer,
      items: items.map(i => ({
        id: i.id,
        description: i.description.trim() || "Item",
        gross: i.gross || "0",
        netWt: i.netWt || "0",
        touch: i.touch || "100",
        w: i.w || "0",
        fine: i.fine || "0.000",
        wt1000pcs: i.wt1000pcs || "0",
        rate: i.rate || "0",
        amount: i.amount || "0.00"
      })),
      totalWeight: calculatedTotalWeight,
      totalSilverFine: calculatedTotalSilverFine,
      grossAmount: calculatedGrossAmount.toFixed(2),
      labourCharges: labourCharges || "0.00",
      discount: discount || "0.00",
      netAmount: calculatedNetAmount,
      paymentStatus,
      remarks: remarks.trim()
    };

    try {
      if (editingId) {
        await updateManufacturerBillInDB(editingId, billData);
        alert("Manufacturer Bill updated successfully!");
      } else {
        await addManufacturerBillToDB(billData);
        alert("Manufacturer Bill created successfully!");
      }
      resetForm();
      setShowHistory(true);
    } catch (err) {
      console.error("Error saving bill:", err);
      alert("Failed to save bill. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Edit Bill
  const handleEditBill = (bill: ManufacturerBillRecord) => {
    setEditingId(bill.id);
    setSelectedManufacturer(bill.manufacturerName);
    setBillNo(bill.billNo);
    setBillDate(bill.date);
    setItems(bill.items && bill.items.length > 0 ? bill.items : [
      { id: "1", description: "", gross: "", netWt: "", touch: "100", w: "", fine: "0.000", wt1000pcs: "", rate: "", amount: "" }
    ]);
    setLabourCharges(bill.labourCharges === "0.00" ? "" : bill.labourCharges);
    setDiscount(bill.discount === "0.00" ? "" : bill.discount);
    setPaymentStatus(bill.paymentStatus || "Unpaid");
    setRemarks(bill.remarks || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete Bill
  const handleDeleteBill = async (id: string) => {
    if (confirm("Are you sure you want to delete this manufacturer bill?")) {
      try {
        await deleteManufacturerBillFromDB(id);
      } catch (err) {
        console.error("Error deleting bill:", err);
        alert("Failed to delete bill.");
      }
    }
  };

  // Filtered Bills for History
  const filteredBills = bills.filter(
    (b) =>
      b.manufacturerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.billNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.date.includes(searchQuery)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-center gap-3">
            <Receipt className="w-8 h-8 text-amber-500" />
            Add Manufacturer Bill
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Record new purchase bills and stock entries from manufacturers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors shadow-sm"
          >
            {showHistory ? (
              <>
                <Plus className="w-4 h-4" />
                Back to Create
              </>
            ) : (
              <>
                <History className="w-4 h-4" />
                View History
              </>
            )}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-medium transition-all"
            >
              Cancel Editing
            </button>
          )}
        </div>
      </div>

      {/* Form Container */}
      {!showHistory && (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Info Card: Manufacturer & Bill Details */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Factory className="w-5 h-5 text-amber-500" />
            Manufacturer & Invoice Info
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Manufacturer Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">
                Manufacturer <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={manufacturers}
                value={selectedManufacturer}
                onChange={setSelectedManufacturer}
                placeholder="Select Manufacturer"
              />
            </div>

            {/* Bill / Invoice Number */}
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">
                Bill / Invoice No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-stone-50/50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono font-semibold"
                placeholder="e.g. MB-1001"
              />
            </div>

            {/* Bill Date */}
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">
                Bill Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-stone-50/50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Selected Manufacturer Details Preview */}
          {currentMfr && (
            <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-stone-700">
                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">{currentMfr.companyName || currentMfr.name}</span>
              </div>
              {currentMfr.mobile && (
                <div className="flex items-center gap-2 text-stone-700">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{currentMfr.mobile}</span>
                </div>
              )}
              {currentMfr.address && (
                <div className="flex items-center gap-2 text-stone-700">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">{currentMfr.address}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bill Items Section */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Bill Items
            </h2>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3 min-w-[150px]">Description</th>
                  <th className="p-3 w-24">Gross</th>
                  <th className="p-3 w-24">Net Wt</th>
                  <th className="p-3 w-24">Touch</th>
                  <th className="p-3 w-20">W</th>
                  <th className="p-3 w-28">Fine</th>
                  <th className="p-3 w-28">Wt/1000 pcs</th>
                  <th className="p-3 w-24">Rate (/kg)</th>
                  <th className="p-3 w-28">Amt</th>
                  <th className="p-3 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-3 text-center text-stone-400 font-medium">{idx + 1}</td>
                    <td className="p-1">
                      <input
                        type="text"
                        placeholder="Item"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                        className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded text-sm focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={item.gross}
                        onChange={(e) => handleItemChange(item.id, "gross", e.target.value)}
                        className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded text-sm font-mono focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={item.netWt}
                        onChange={(e) => handleItemChange(item.id, "netWt", e.target.value)}
                        className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded text-sm font-mono focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="any"
                        placeholder="100"
                        value={item.touch}
                        onChange={(e) => handleItemChange(item.id, "touch", e.target.value)}
                        className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded text-sm font-mono focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={item.w}
                        onChange={(e) => handleItemChange(item.id, "w", e.target.value)}
                        className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded text-sm font-mono focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="any"
                        placeholder="0.000"
                        value={item.fine}
                        onChange={(e) => handleItemChange(item.id, "fine", e.target.value)}
                        className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded text-sm font-mono font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={item.wt1000pcs}
                        onChange={(e) => handleItemChange(item.id, "wt1000pcs", e.target.value)}
                        className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded text-sm font-mono focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={item.rate}
                        onChange={(e) => handleItemChange(item.id, "rate", e.target.value)}
                        className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded text-sm font-mono focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={item.amount}
                        onChange={(e) => handleItemChange(item.id, "amount", e.target.value)}
                        className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded text-sm font-mono font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(item.id)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-stone-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 text-base font-extrabold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-stone-200"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Saving...
              </>
            ) : (
              editingId ? "Update Bill" : "Submit"
            )}
          </button>
        </div>
      </form>
      )}

      {/* Recent Bills History Section */}
      {showHistory && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Total Bills</p>
              <p className="text-2xl font-black text-stone-900">{filteredBills.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Total Bill Amount</p>
              <p className="text-2xl font-black text-stone-900">
                ₹{filteredBills.reduce((acc, b) => acc + parseFloat(b.netAmount || b.grossAmount || "0"), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Total Fine</p>
              <p className="text-2xl font-black text-stone-900">
                {filteredBills.reduce((acc, b) => acc + parseFloat(b.totalSilverFine || "0"), 0).toFixed(3)} g
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Total Gross Wt</p>
              <p className="text-2xl font-black text-stone-900">
                {filteredBills.reduce((acc, b) => acc + parseFloat(b.totalWeight || "0"), 0).toFixed(3)} g
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-500" />
                  Recent Manufacturer Bills
                </h2>
                <p className="text-xs text-stone-500">History of purchase bills added to manufacturers</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by Bill No or Manufacturer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-12 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
            <Receipt className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-500">No manufacturer bills found</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-3">Bill No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Manufacturer</th>
                  <th className="p-3 text-right">Silver Fine (g)</th>
                  <th className="p-3 text-right">Net Amount (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-700">{b.billNo}</td>
                    <td className="p-3 text-stone-600">{b.date}</td>
                    <td className="p-3 font-semibold text-stone-900">{b.manufacturerName}</td>
                    <td className="p-3 text-right font-mono text-stone-800">{b.totalSilverFine} g</td>
                    <td className="p-3 text-right font-mono font-bold text-stone-900">
                      ₹{parseFloat(b.netAmount || "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          b.paymentStatus === "Paid"
                            ? "bg-green-100 text-green-800"
                            : b.paymentStatus === "Partial"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingBill(b)}
                          className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="View Bill Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditBill(b)}
                          className="p-1.5 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Bill"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBill(b.id)}
                          className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Bill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </div>
        </div>
      )}

      {/* Bill View Detail Modal */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-stone-200 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-stone-900">
                  Manufacturer Bill Details
                </h3>
                <p className="text-xs text-stone-500">Invoice: {viewingBill.billNo}</p>
              </div>
              <button
                onClick={() => setViewingBill(null)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-stone-50 p-4 rounded-xl">
              <div>
                <span className="text-xs text-stone-500">Manufacturer:</span>
                <div className="font-bold text-stone-900">{viewingBill.manufacturerName}</div>
              </div>
              <div>
                <span className="text-xs text-stone-500">Bill Date:</span>
                <div className="font-bold text-stone-900">{viewingBill.date}</div>
              </div>
              <div>
                <span className="text-xs text-stone-500">Payment Status:</span>
                <div className="font-bold text-amber-700">{viewingBill.paymentStatus}</div>
              </div>
              <div>
                <span className="text-xs text-stone-500">Total Silver Fine:</span>
                <div className="font-bold font-mono text-stone-900">{viewingBill.totalSilverFine} g</div>
              </div>
            </div>

            {/* Items table */}
            <div className="border border-stone-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-stone-100 text-stone-700 font-semibold text-xs">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-right">Gross</th>
                    <th className="p-2.5 text-right">Net Wt</th>
                    <th className="p-2.5 text-right">Touch</th>
                    <th className="p-2.5 text-right">W</th>
                    <th className="p-2.5 text-right">Fine (g)</th>
                    <th className="p-2.5 text-right">Wt/1000</th>
                    <th className="p-2.5 text-right">Rate</th>
                    <th className="p-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {viewingBill.items?.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2.5">{it.description}</td>
                      <td className="p-2.5 text-right font-mono">{it.gross}</td>
                      <td className="p-2.5 text-right font-mono">{it.netWt}</td>
                      <td className="p-2.5 text-right font-mono">{it.touch}</td>
                      <td className="p-2.5 text-right font-mono">{it.w}</td>
                      <td className="p-2.5 text-right font-mono font-semibold text-amber-800">{it.fine || it.silverFine}</td>
                      <td className="p-2.5 text-right font-mono">{it.wt1000pcs}</td>
                      <td className="p-2.5 text-right font-mono">{it.rate}</td>
                      <td className="p-2.5 text-right font-mono">₹{it.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5 text-sm pt-2 border-t border-stone-200">
              <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2">
                <span>Total Amount:</span>
                <span className="font-mono text-amber-600">₹{viewingBill.netAmount || viewingBill.grossAmount}</span>
              </div>
            </div>

            {viewingBill.remarks && (
              <div className="text-xs bg-stone-50 p-3 rounded-lg text-stone-600">
                <span className="font-bold">Remarks: </span>
                {viewingBill.remarks}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-900 transition-colors"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={() => setViewingBill(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
