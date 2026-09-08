"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Building2,
  User,
  Phone,
  MapPin,
  Loader2,
  Factory,
  IndianRupee,
  Weight
} from "lucide-react";
import {
  subscribeToManufacturers,
  addManufacturerToDB,
  updateManufacturerInDB,
  deleteManufacturerFromDB,
} from "@/lib/db";

const defaultForm = {
  name: "",
  companyName: "",
  mobile: "",
  address: "",
  payAmount: "",
  payFine: "",
};

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToManufacturers((data) => {
      setManufacturers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredManufacturers = manufacturers.filter((m) =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.mobile?.includes(searchQuery)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateManufacturerInDB(editingId, form);
      } else {
        await addManufacturerToDB(form);
      }
      setIsModalOpen(false);
      setForm({ ...defaultForm });
      setEditingId(null);
    } catch (error) {
      console.error("Error saving manufacturer:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (manufacturer: any) => {
    setForm({
      name: manufacturer.name || "",
      companyName: manufacturer.companyName || "",
      mobile: manufacturer.mobile || "",
      address: manufacturer.address || "",
      payAmount: manufacturer.payAmount || "",
      payFine: manufacturer.payFine || "",
    });
    setEditingId(manufacturer.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this manufacturer?")) {
      try {
        await deleteManufacturerFromDB(id);
      } catch (error) {
        console.error("Error deleting manufacturer:", error);
        alert("Failed to delete. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-center gap-3">
            <Factory className="w-8 h-8 text-amber-500" />
            Manufacturers
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage your manufacturers and suppliers
          </p>
        </div>
        
        <button
          onClick={() => {
            setForm({ ...defaultForm });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-amber-600 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Manufacturer
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="Search manufacturers by name, company, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Grid of Manufacturers */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : filteredManufacturers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Factory className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-1">No manufacturers found</h3>
          <p className="text-stone-500 text-sm mb-6">
            {searchQuery ? "Try adjusting your search terms" : "Get started by adding your first manufacturer"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 text-amber-600 font-medium hover:text-amber-700 bg-amber-50 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Manufacturer
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-hidden sm:overflow-x-auto">
            <table className="w-full text-left border-collapse border-none sm:border border-stone-200 block sm:table">
              <thead className="hidden sm:table-header-group">
                <tr className="bg-stone-50/80">
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 w-16 text-center">Sr No</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Company Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Mobile Number</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Pay Amount (₹)</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Pay Fine (g)</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Address</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right border border-stone-200 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="block sm:table-row-group">
                {filteredManufacturers.map((manufacturer, idx) => (
                    <tr key={manufacturer.id} className="block sm:table-row bg-white hover:bg-stone-50/50 transition-colors border-b-8 sm:border-b-0 border-stone-100 sm:border border-stone-200 p-4 sm:p-0 relative">
                      <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-stone-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-center">
                        <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Sr No</span>
                        {idx + 1}
                      </td>
                      <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-stone-900 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                        <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Name</span>
                        {manufacturer.name}
                      </td>
                      <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-medium text-stone-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                        <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Company Name</span>
                        {manufacturer.companyName || "-"}
                      </td>
                      <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm text-stone-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                        <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Mobile</span>
                        {manufacturer.mobile || "-"}
                      </td>
                      <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm text-stone-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                        <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Pay Amount</span>
                        {manufacturer.payAmount ? `₹${manufacturer.payAmount}` : "-"}
                      </td>
                      <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm text-stone-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                        <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Pay Fine</span>
                        {manufacturer.payFine ? `${manufacturer.payFine} g` : "-"}
                      </td>
                      <td className="flex sm:table-cell justify-between items-start sm:items-center px-2 py-2 sm:px-6 sm:py-4 text-sm text-stone-600 max-w-xs sm:truncate border-b sm:border-b-0 sm:border-solid border-stone-200">
                        <span className="sm:hidden text-xs font-bold text-stone-400 uppercase whitespace-nowrap mr-4 mt-1">Address</span>
                        <span className="text-right sm:text-left">{manufacturer.address || "-"}</span>
                      </td>
                      <td className="flex sm:table-cell justify-end sm:justify-center items-center px-2 py-3 sm:px-6 sm:py-4 text-sm text-right border-none sm:border-solid sm:border border-stone-200 bg-stone-50/50 sm:bg-transparent mt-2 sm:mt-0 rounded-lg sm:rounded-none">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title="Edit Manufacturer"
                            onClick={() => handleEdit(manufacturer)}
                            className="flex items-center gap-2 px-3 py-1.5 sm:p-2 text-stone-500 sm:text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors bg-white sm:bg-transparent border border-stone-200 sm:border-none shadow-sm sm:shadow-none font-medium text-xs sm:text-sm"
                          >
                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="sm:hidden">Edit</span>
                          </button>
                          <button
                            title="Delete Manufacturer"
                            onClick={() => handleDelete(manufacturer.id)}
                            className="flex items-center gap-2 px-3 py-1.5 sm:p-2 text-red-500 sm:text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white sm:bg-transparent border border-stone-200 sm:border-none shadow-sm sm:shadow-none font-medium text-xs sm:text-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="sm:hidden">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => !saving && setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Factory className="w-5 h-5 text-amber-500" />
                {editingId ? "Edit Manufacturer" : "Add Manufacturer"}
              </h2>
              <button
                onClick={() => !saving && setIsModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      required
                      autoFocus
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-stone-50/50 focus:bg-white"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-1.5">
                    Company Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-stone-50/50 focus:bg-white"
                      placeholder="e.g. ABC Manufacturing Co."
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={form.mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setForm({ ...form, mobile: val });
                      }}
                      className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-stone-50/50 focus:bg-white"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pay Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-900 mb-1.5">
                      Pay Amount (₹)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IndianRupee className="h-5 w-5 text-stone-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.payAmount}
                        onChange={(e) => setForm({ ...form, payAmount: e.target.value })}
                        className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-stone-50/50 focus:bg-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Pay Fine */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-900 mb-1.5">
                      Pay Fine (Gram)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Weight className="h-5 w-5 text-stone-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={form.payFine}
                        onChange={(e) => setForm({ ...form, payFine: e.target.value })}
                        className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-stone-50/50 focus:bg-white"
                        placeholder="0.000"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-1.5">
                    Address
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MapPin className="h-5 w-5 text-stone-400" />
                    </div>
                    <textarea
                      rows={3}
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-stone-50/50 focus:bg-white resize-none"
                      placeholder="Full address here..."
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Save Changes" : "Add Manufacturer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
