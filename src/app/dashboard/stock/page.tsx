"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { Plus, Package, Search, X, Edit2, Trash2, ChevronDown, Gem, Layers, Weight, Info, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { subscribeToStock, addStockToDB, updateStockInDB, deleteStockFromDB, moveToTrashDB } from "@/lib/db";

const CATEGORIES = ["Gold", "Silver", "Diamond", "Other"];

export default function StockPage() {
  const { t } = useLanguage();
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Gold");
  const [formGrossWeight, setFormGrossWeight] = useState("");
  const [formPurity, setFormPurity] = useState("100");
  const [formFineWeight, setFormFineWeight] = useState("0");
  const [formPieces, setFormPieces] = useState("1");
  const [formRemarks, setFormRemarks] = useState("");

  // Subscriptions
  useEffect(() => {
    const unsub = subscribeToStock((data) => {
      setStockItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Auto-calculate Fine Weight based on Gross Weight and Purity
  useEffect(() => {
    const gross = parseFloat(formGrossWeight) || 0;
    const purity = parseFloat(formPurity) || 0;
    const fine = (gross * purity) / 100;
    setFormFineWeight(Number(fine.toFixed(3)).toString());
  }, [formGrossWeight, formPurity]);

  // Total Calculations
  const totalGoldFineWeight = stockItems
    .filter(item => item.category === "Gold")
    .reduce((sum, item) => sum + (parseFloat(item.fineWeight) || 0), 0);

  const totalSilverFineWeight = stockItems
    .filter(item => item.category === "Silver")
    .reduce((sum, item) => sum + (parseFloat(item.fineWeight) || 0), 0);

  const totalPieces = stockItems.reduce((sum, item) => sum + (parseInt(item.pieces) || 0), 0);

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.remarks?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "All" || item.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItemId(null);
    setFormName("");
    setFormCategory("Gold");
    setFormGrossWeight("");
    setFormPurity("100");
    setFormFineWeight("0");
    setFormPieces("1");
    setFormRemarks("");
  };

  const handleEditClick = (item: any) => {
    setEditingItemId(item.id);
    setFormName(item.name || "");
    setFormCategory(item.category || "Gold");
    setFormGrossWeight(item.grossWeight || "");
    setFormPurity(item.purity || "100");
    setFormFineWeight(item.fineWeight || "0");
    setFormPieces(item.pieces || "1");
    setFormRemarks(item.remarks || "");
    setIsModalOpen(true);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSubmitting(true);

    const stockData = {
      name: formName.trim(),
      category: formCategory,
      grossWeight: formGrossWeight || "0",
      purity: formPurity || "100",
      fineWeight: formFineWeight || "0",
      pieces: formPieces || "1",
      remarks: formRemarks.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingItemId) {
        await updateStockInDB(editingItemId, stockData);
      } else {
        await addStockToDB(stockData);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save stock item", error);
      alert("Error saving stock item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      await moveToTrashDB("stock", item);
      await deleteStockFromDB(item.id);
    } catch (error) {
      console.error("Failed to delete stock item", error);
      alert("Error deleting stock item");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8 text-amber-500" />
            {t("Stock") || "Stock"} Management
          </h1>
          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            Track gold, silver, and diamond stock levels, manage purities, and monitor total weights in real time.
          </p>
        </div>
        
        {/* Top Right Buttons */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-amber-100"
        >
          <Plus className="h-5 w-5" />
          Add Stock Item
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gold Summary */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-200/50 p-6 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <Gem className="w-40 h-40" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-700 uppercase tracking-wider">Gold Stock (Fine)</span>
            <div className="p-2.5 bg-amber-500 text-white rounded-xl">
              <Gem className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-950">{totalGoldFineWeight.toFixed(3)}</span>
            <span className="text-sm font-bold text-amber-700">grams</span>
          </div>
        </div>

        {/* Silver Summary */}
        <div className="bg-gradient-to-br from-stone-500/10 to-stone-600/5 border border-stone-200 p-6 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <Weight className="w-40 h-40" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-600 uppercase tracking-wider">Silver Stock (Fine)</span>
            <div className="p-2.5 bg-stone-400 text-white rounded-xl">
              <Weight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-950">{totalSilverFineWeight.toFixed(3)}</span>
            <span className="text-sm font-bold text-stone-500">grams</span>
          </div>
        </div>

        {/* Total Pieces Summary */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-200/50 p-6 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <Layers className="w-40 h-40" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-700 uppercase tracking-wider">Total Inventory Pcs</span>
            <div className="p-2.5 bg-blue-500 text-white rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-950">{totalPieces}</span>
            <span className="text-sm font-bold text-blue-700">pieces</span>
          </div>
        </div>
      </div>

      {/* Filters and List */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-stone-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-stone-50/50">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search items by name or remarks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-stone-800 placeholder-stone-400"
            />
          </div>

          {/* Category Quick Filters */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setSelectedCategoryFilter("All")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                selectedCategoryFilter === "All"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  selectedCategoryFilter === cat
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table / Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
            <p className="font-semibold text-sm">Loading stock list...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto h-14 w-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
              <Package className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">No stock items found</h3>
            <p className="mt-2 text-sm text-stone-500 max-w-sm mx-auto">
              Get started by adding items to your gold, silver, or diamond inventory.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add First Stock Item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/30 text-stone-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Gross Wt. (g)</th>
                  <th className="px-6 py-4 text-right">Purity/Touch (%)</th>
                  <th className="px-6 py-4 text-right bg-amber-50/20 text-amber-800">Fine Wt. (g)</th>
                  <th className="px-6 py-4 text-center">Pcs</th>
                  <th className="px-6 py-4">Remarks</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm font-medium text-stone-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-stone-950">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.category === "Gold" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        item.category === "Silver" ? "bg-stone-100 text-stone-700 border border-stone-200" :
                        item.category === "Diamond" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                        "bg-teal-50 text-teal-700 border border-teal-100"
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold font-mono">{(parseFloat(item.grossWeight) || 0).toFixed(3)}</td>
                    <td className="px-6 py-4 text-right text-stone-500 font-mono">{item.purity}%</td>
                    <td className="px-6 py-4 text-right font-black text-amber-800 bg-amber-50/10 font-mono">{(parseFloat(item.fineWeight) || 0).toFixed(3)}</td>
                    <td className="px-6 py-4 text-center font-bold font-mono">{item.pieces}</td>
                    <td className="px-6 py-4 text-xs text-stone-500 max-w-xs truncate" title={item.remarks}>{item.remarks || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Edit Stock Item"
                        >
                          <Edit2 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/80">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                {editingItemId ? "Edit Stock Item" : "Add Stock Item"}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 rounded-lg text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStock} className="p-6 space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-stone-900 font-medium"
                  placeholder="e.g. Gold Ring, Silver Chain"
                />
              </div>

              {/* Category & Pieces */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-stone-900 font-medium appearance-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Pieces
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formPieces}
                    onChange={e => setFormPieces(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-stone-900 font-medium"
                  />
                </div>
              </div>

              {/* Gross Weight & Purity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Gross Weight (g)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    min="0"
                    placeholder="0.000"
                    value={formGrossWeight}
                    onChange={e => setFormGrossWeight(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-stone-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    Purity / Touch (%)
                    <div className="group relative cursor-pointer text-stone-400 hover:text-stone-600">
                      <Info className="w-3.5 h-3.5" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-stone-900 text-white text-[10px] rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[55] font-normal normal-case">
                        Percentage of pure metal. E.g., 91.6% for 22k Gold, 100% for fine.
                      </div>
                    </div>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    max="100"
                    value={formPurity}
                    onChange={e => setFormPurity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-stone-900 font-medium"
                  />
                </div>
              </div>

              {/* Fine Weight Auto-calculated */}
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Fine Weight</h4>
                  <p className="text-[10px] text-amber-700">Calculated automatically (Gross × Purity%)</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-amber-950 font-mono">{formFineWeight}</span>
                  <span className="text-xs font-bold text-amber-900 ml-1">g</span>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Remarks
                </label>
                <input
                  type="text"
                  value={formRemarks}
                  onChange={e => setFormRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-stone-900 font-medium"
                  placeholder="Optional notes or supplier info"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-stone-500 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
