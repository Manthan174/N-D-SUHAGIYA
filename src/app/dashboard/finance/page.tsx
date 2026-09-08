"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, Wallet, Search, Filter, X, FileText, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { addFinanceToDB, subscribeToFinances, uploadFinanceDocument, moveToTrashDB, deleteFinanceFromDB, subscribeToCollections, subscribeToManufacturerPayments } from "@/lib/db";

export default function FinancePage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"income" | "expense">("income");
  
  const [finances, setFinances] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [type, setType] = useState<"income" | "expense">("income");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [name, setName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [amount, setAmount] = useState("");
  const [fineAmount, setFineAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  useEffect(() => {
    let financeData: any[] = [];
    let collectionData: any[] = [];
    let manufacturerPaymentData: any[] = [];

    const combineAndSort = () => {
      const combined = [...financeData, ...collectionData, ...manufacturerPaymentData];
      const sorted = combined.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date || 0).getTime();
        const timeB = new Date(b.createdAt || b.date || 0).getTime();
        return timeB - timeA;
      });
      setFinances(sorted);
    };

    const unsubFinances = subscribeToFinances((data) => {
      financeData = data;
      combineAndSort();
    });

    const unsubCollections = subscribeToCollections((data) => {
      collectionData = data.map((c: any) => ({
        id: c.id,
        type: "income",
        date: c.date,
        name: `Collection: ${c.partyName}`,
        invoiceNo: c.mode || "-",
        amount: parseFloat(c.amount) || 0,
        fineAmount: parseFloat(c.silverKg) || 0,
        remark: c.remarks || "Amount Collected",
        documentUrl: null,
        createdAt: c.createdAt || c.date,
        isCollection: true
      }));
      combineAndSort();
    });

    const unsubPayments = subscribeToManufacturerPayments((data) => {
      manufacturerPaymentData = data.map((p: any) => ({
        id: p.id,
        type: "expense",
        date: p.date,
        name: `Payment: ${p.manufacturerName}`,
        invoiceNo: p.mode || "-",
        amount: parseFloat(p.amount) || 0,
        fineAmount: parseFloat(p.silverKg) || 0,
        remark: p.remarks || "Amount Paid",
        documentUrl: null,
        createdAt: p.createdAt || p.date,
        isExpensePayment: true
      }));
      combineAndSort();
    });

    return () => {
      unsubFinances();
      unsubCollections();
      unsubPayments();
    };
  }, []);

  const totalIncome = finances.filter(f => f.type === "income").reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalExpense = finances.filter(f => f.type === "expense").reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const balance = totalIncome - totalExpense;

  const totalFineIncome = finances.filter(f => f.type === "income").reduce((acc, curr) => acc + (parseFloat(curr.fineAmount) || 0), 0);
  const totalFineExpense = finances.filter(f => f.type === "expense").reduce((acc, curr) => acc + (parseFloat(curr.fineAmount) || 0), 0);
  const fineBalance = totalFineIncome - totalFineExpense;

  const filteredFinances = finances.filter(f => f.type === activeTab);

  const handleDelete = async (record: any) => {
    if (record.isCollection) {
      alert("Please delete collection records from the Collection History page.");
      return;
    }
    if (record.isExpensePayment) {
      alert("Please delete payment records from the Manufacturer Payment History page.");
      return;
    }
    if (confirm("Are you sure you want to move this record to trash?")) {
      try {
        await moveToTrashDB('finance', record);
        await deleteFinanceFromDB(record.id);
      } catch (error) {
        console.error("Failed to delete finance record", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !date) return;
    
    setIsSubmitting(true);
    try {
      let documentUrl = null;
      if (documentFile) {
        documentUrl = await uploadFinanceDocument(documentFile);
      }

      await addFinanceToDB({
        type,
        date,
        name,
        invoiceNo,
        amount: parseFloat(amount) || 0,
        fineAmount: parseFloat(fineAmount) || 0,
        remark,
        documentUrl
      });
      setIsModalOpen(false);
      // Reset form
      setName("");
      setInvoiceNo("");
      setAmount("");
      setFineAmount("");
      setRemark("");
      setDocumentFile(null);
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error("Failed to add finance record", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (defaultType: "income" | "expense" = "income") => {
    setType(defaultType);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
            Finance & Account
          </h1>
          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            Manage your company's income and expenses.
          </p>
        </div>
        
        {/* Top Right Buttons */}
        <div className="shrink-0 flex items-center gap-3">
          <button 
            onClick={() => openModal("income")}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-sm shadow-amber-500/20"
          >
            <Plus className="h-5 w-5" />
            Add New
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-6">
        {/* ROW 1: Monetary Stats */}
        <div className="bg-white p-2 sm:p-6 rounded-xl sm:rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left">
          <div className="h-8 w-8 sm:h-12 sm:w-12 bg-emerald-50 text-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <ArrowDownRight className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-sm text-stone-500 font-medium truncate">Total Income (₹)</p>
            <h3 className="text-sm sm:text-2xl font-bold text-stone-900 truncate">₹{totalIncome.toFixed(2)}</h3>
          </div>
        </div>
        
        <div className="bg-white p-2 sm:p-6 rounded-xl sm:rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left">
          <div className="h-8 w-8 sm:h-12 sm:w-12 bg-rose-50 text-rose-500 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <ArrowUpRight className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-sm text-stone-500 font-medium truncate">Total Expense (₹)</p>
            <h3 className="text-sm sm:text-2xl font-bold text-stone-900 truncate">₹{totalExpense.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-2 sm:p-6 rounded-xl sm:rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left">
          <div className="h-8 w-8 sm:h-12 sm:w-12 bg-amber-50 text-amber-500 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <Wallet className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-sm text-stone-500 font-medium truncate">Balance (₹)</p>
            <h3 className={`text-sm sm:text-2xl font-bold truncate ${balance >= 0 ? 'text-stone-900' : 'text-rose-600'}`}>
              ₹{balance.toFixed(2)}
            </h3>
          </div>
        </div>

        {/* ROW 2: Fine Stats */}
        <div className="bg-white p-2 sm:p-6 rounded-xl sm:rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left">
          <div className="h-8 w-8 sm:h-12 sm:w-12 bg-emerald-50 text-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <ArrowDownRight className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-sm text-stone-500 font-medium truncate">Fine Income (g)</p>
            <h3 className="text-sm sm:text-2xl font-bold text-stone-900 truncate">{totalFineIncome.toFixed(3)}g</h3>
          </div>
        </div>

        <div className="bg-white p-2 sm:p-6 rounded-xl sm:rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left">
          <div className="h-8 w-8 sm:h-12 sm:w-12 bg-rose-50 text-rose-500 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <ArrowUpRight className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-sm text-stone-500 font-medium truncate">Fine Expense (g)</p>
            <h3 className="text-sm sm:text-2xl font-bold text-stone-900 truncate">{totalFineExpense.toFixed(3)}g</h3>
          </div>
        </div>

        <div className="bg-white p-2 sm:p-6 rounded-xl sm:rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left">
          <div className="h-8 w-8 sm:h-12 sm:w-12 bg-amber-50 text-amber-500 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <Wallet className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-sm text-stone-500 font-medium truncate">Fine Balance (g)</p>
            <h3 className={`text-sm sm:text-2xl font-bold truncate ${fineBalance >= 0 ? 'text-stone-900' : 'text-rose-600'}`}>
              {fineBalance.toFixed(3)}g
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs and Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex bg-stone-100/80 p-1.5 rounded-xl self-start">
          <button
            onClick={() => setActiveTab("income")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "income"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <ArrowDownRight className={`h-4 w-4 ${activeTab === "income" ? "text-emerald-500" : "text-stone-400"}`} />
            Income
          </button>
          <button
            onClick={() => setActiveTab("expense")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "expense"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <ArrowUpRight className={`h-4 w-4 ${activeTab === "expense" ? "text-rose-500" : "text-stone-400"}`} />
            Expense
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search records..."
              className="pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all w-full sm:w-64"
            />
          </div>
          <button className="p-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content area */}
      {filteredFinances.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
            activeTab === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
          }`}>
            {activeTab === 'income' ? <ArrowDownRight className="h-8 w-8" /> : <ArrowUpRight className="h-8 w-8" />}
          </div>
          <h3 className="text-xl font-bold text-stone-900">
            No {activeTab} records found
          </h3>
          <p className="mt-2 text-sm text-stone-500">
            Get started by adding your first {activeTab} entry.
          </p>
          <div className="mt-8">
            <button 
              onClick={() => openModal(activeTab)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white hover:bg-stone-800 font-bold rounded-xl transition-colors shadow-md"
            >
              <Plus className="h-5 w-5" />
              Add {activeTab === 'income' ? 'Income' : 'Expense'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Remark</th>
                  <th className="px-6 py-4 text-right">Amount (₹)</th>
                  <th className="px-6 py-4 text-right">Fine (g)</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredFinances.map((f, i) => (
                  <tr key={f.id || i} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-stone-600">{f.date}</td>
                    <td className="px-6 py-4 font-medium text-stone-900">{f.name}</td>
                    <td className="px-6 py-4 text-stone-600">{f.invoiceNo || "-"}</td>
                    <td className="px-6 py-4 text-stone-500 max-w-[200px] truncate">{f.remark || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {f.documentUrl && (
                          <a href={f.documentUrl} target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-600 transition-colors p-1.5 hover:bg-amber-50 rounded-lg" title="View Document">
                            <FileText className="w-4 h-4" />
                          </a>
                        )}
                        <span className="font-bold text-stone-900">₹{(f.amount || 0).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-stone-900">{(f.fineAmount || 0).toFixed(3)}g</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!f.isCollection ? (
                        <button 
                          onClick={() => handleDelete(f)}
                          className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          title="Send WhatsApp"
                          onClick={() => {
                            const text = `Hello ${f.name.replace('Collection: ', '')},\n\nWe have successfully received your payment. Thank you!\n\n🟢 Collected Amount: ₹${f.amount}\n📅 Date: ${f.date}\n\nThank you!\nvia N D Suhagiya`;
                            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                            window.open(url, '_blank');
                          }}
                          className="p-1.5 text-stone-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-stone-100 shrink-0">
              <h3 className="text-lg font-bold text-stone-900">Add New Record</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div className="flex gap-4">
                <label className="flex-1 flex items-center gap-2 p-3 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
                  <input 
                    type="radio" 
                    name="type" 
                    value="income" 
                    checked={type === "income"} 
                    onChange={() => setType("income")} 
                    className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 border-stone-300" 
                  />
                  <span className="font-semibold text-stone-900">Income</span>
                </label>
                <label className="flex-1 flex items-center gap-2 p-3 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
                  <input 
                    type="radio" 
                    name="type" 
                    value="expense" 
                    checked={type === "expense"} 
                    onChange={() => setType("expense")} 
                    className="w-4 h-4 text-rose-500 focus:ring-rose-500 border-stone-300" 
                  />
                  <span className="font-semibold text-stone-900">Expense</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-1.5">Date *</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                  className="w-full px-4 py-2.5 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-1.5">Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  placeholder="e.g. Sales, Rent" 
                  className="w-full px-4 py-2.5 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-1.5">Invoice Number</label>
                <input 
                  type="text" 
                  value={invoiceNo} 
                  onChange={e => setInvoiceNo(e.target.value)} 
                  placeholder="Optional" 
                  className="w-full px-4 py-2.5 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-1.5">Amount (₹) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  required 
                  placeholder="0.00" 
                  className="w-full px-4 py-2.5 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-1.5">Fine Amount (g)</label>
                <input 
                  type="number" 
                  step="0.001" 
                  value={fineAmount} 
                  onChange={e => setFineAmount(e.target.value)} 
                  placeholder="0.000" 
                  className="w-full px-4 py-2.5 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-1.5">Remark</label>
                <textarea 
                  value={remark} 
                  onChange={e => setRemark(e.target.value)} 
                  placeholder="Add any notes here" 
                  rows={2} 
                  className="w-full px-4 py-2.5 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50 resize-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-1.5">Document (Optional)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    id="finance-document-upload"
                    onChange={e => setDocumentFile(e.target.files?.[0] || null)} 
                    className="w-full px-4 py-2.5 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-600 hover:file:bg-amber-100" 
                  />
                  {documentFile && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setDocumentFile(null);
                        const fileInput = document.getElementById('finance-document-upload') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all flex-shrink-0"
                      title="Remove document"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
              
            <div className="px-4 sm:px-6 py-4 border-t border-stone-100 flex justify-end gap-3 shrink-0 bg-stone-50">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-2.5 text-sm font-bold text-stone-600 bg-white border border-stone-200 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-6 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
