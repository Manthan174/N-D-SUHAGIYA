"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Briefcase,
  User,
  Phone,
  MapPin,
  Tag,
  Camera,
  Loader2,
  ChevronDown,
  UserCircle2,
} from "lucide-react";
import {
  subscribeToEmployees,
  addEmployeeToDB,
  updateEmployeeInDB,
  deleteEmployeeFromDB,
  uploadEmployeePhoto,
} from "@/lib/db";

const CATEGORIES = [
  "Manager",
  "Sales Executive",
  "Accountant",
  "Goldsmith",
  "Support Staff",
  "Security",
  "Other",
];

const COUNTRY_CODES = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+61", country: "Australia" },
  { code: "+971", country: "UAE" },
  { code: "+65", country: "Singapore" },
  { code: "+92", country: "Pakistan" },
  { code: "+880", country: "Bangladesh" },
  { code: "+94", country: "Sri Lanka" },
  { code: "+977", country: "Nepal" },
];

function CategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm border border-stone-200 rounded-xl bg-stone-50/50 hover:bg-stone-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
      >
        <span className={value ? "text-stone-900 font-medium" : "text-stone-400"}>
          {value || "Select category"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-[60] bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onChange(cat);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-amber-50 hover:text-amber-700 ${value === cat ? "bg-amber-50 text-amber-700 font-semibold" : "text-stone-700"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RegionSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = COUNTRY_CODES.filter(
    (o) =>
      o.country.toLowerCase().includes(search.toLowerCase()) ||
      o.code.includes(search)
  );

  return (
    <div className="relative w-28 shrink-0" ref={ref}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-3 text-sm border border-stone-200 border-r-0 rounded-l-xl bg-stone-50/50 hover:bg-stone-50 cursor-pointer flex justify-between items-center h-full"
      >
        <span className="font-semibold text-stone-900">{value}</span>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 z-[70] mt-1 w-56 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2 border-b border-stone-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                autoFocus
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Search region..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onChange(opt.code);
                  setIsOpen(false);
                  setSearch("");
                }}
                className="px-3 py-2 hover:bg-amber-50 hover:text-amber-700 cursor-pointer text-sm rounded-lg transition-colors flex justify-between items-center"
              >
                <span className="text-stone-600 text-xs">{opt.country}</span>
                <span className="font-bold">{opt.code}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const defaultForm = {
  name: "",
  category: "",
  regionCode: "+91",
  mobile: "",
  address: "",
  photoUrl: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeToEmployees((data) => setEmployees(data));
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setForm({ ...defaultForm });
    setPhotoFile(null);
    setPhotoPreview("");
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: any) => {
    const mobileParts = (emp.mobile || "").split(" ");
    setForm({
      name: emp.name || "",
      category: emp.category || "",
      regionCode: mobileParts.length > 1 && mobileParts[0].startsWith("+") ? mobileParts[0] : "+91",
      mobile: mobileParts.length > 1 && mobileParts[0].startsWith("+") ? mobileParts[1] : emp.mobile || "",
      address: emp.address || "",
      photoUrl: emp.photoUrl || "",
    });
    setPhotoFile(null);
    setPhotoPreview(emp.photoUrl || "");
    setEditingId(emp.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm({ ...defaultForm });
    setPhotoFile(null);
    setPhotoPreview("");
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size < 1024 || file.size > 1024 * 1024) {
      alert("Photo size must be between 1KB and 1MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      let photoUrl = form.photoUrl;
      if (photoFile) {
        photoUrl = await uploadEmployeePhoto(photoFile);
      }
      const employeeData = {
        name: form.name.trim(),
        category: form.category,
        mobile: form.mobile ? `${form.regionCode} ${form.mobile}` : "",
        address: form.address.trim(),
        photoUrl,
      };
      if (editingId) {
        await updateEmployeeInDB(editingId, employeeData);
      } else {
        await addEmployeeToDB(employeeData);
      }
      closeModal();
    } catch (err) {
      console.error("Error saving employee:", err);
      alert("Failed to save employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp: any) => {
    if (!confirm(`Are you sure you want to delete "${emp.name}"?`)) return;
    await deleteEmployeeFromDB(emp.id);
  };

  const filtered = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.mobile?.includes(searchQuery)
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-amber-500" />
            Employee Module
          </h1>
          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            Manage your team members, staff and their details in one place.
          </p>
        </div>
        <div className="shrink-0">
          <button
            id="add-employee-btn"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all focus:ring-4 focus:ring-amber-100 shadow-sm hover:shadow-md"
          >
            <Plus className="h-5 w-5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Total Employees</p>
          <p className="text-2xl sm:text-3xl font-black text-stone-900">{employees.length}</p>
        </div>
        {CATEGORIES.slice(0, 3).map((cat) => (
          <div key={cat} className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
            <p className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 truncate">{cat}</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600">
              {employees.filter((e) => e.category === cat).length}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-stone-200 flex items-center gap-4 bg-stone-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              id="employee-search"
              type="text"
              placeholder="Search by name, category, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider w-12 text-center">#</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((emp, idx) => (
                <tr key={emp.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-stone-500 text-center font-medium">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {emp.photoUrl ? (
                        <img
                          src={emp.photoUrl}
                          alt={emp.name}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
                          <UserCircle2 className="w-6 h-6" />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-stone-900">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {emp.category && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
                        <Tag className="w-3 h-3" />
                        {emp.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-600">
                    {emp.mobile?.includes(" ") ? emp.mobile.split(" ")[1] : emp.mobile}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-600 max-w-xs truncate">{emp.address}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        id={`edit-emp-${emp.id}`}
                        title="Edit Employee"
                        onClick={() => openEditModal(emp)}
                        className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        id={`del-emp-${emp.id}`}
                        title="Delete Employee"
                        onClick={() => handleDelete(emp)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <UserCircle2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-stone-400">
                      {searchQuery
                        ? "No employees match your search."
                        : "No employees yet. Add your first team member!"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-stone-100">
          {filtered.map((emp) => (
            <div key={emp.id} className="p-4 flex gap-3 items-start">
              {emp.photoUrl ? (
                <img
                  src={emp.photoUrl}
                  alt={emp.name}
                  className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100 mt-0.5">
                  <UserCircle2 className="w-8 h-8" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-stone-900">{emp.name}</p>
                    {emp.category && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
                        <Tag className="w-2.5 h-2.5" />
                        {emp.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(emp)}
                      className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {emp.mobile && (
                  <p className="mt-1.5 text-xs text-stone-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {emp.mobile?.includes(" ") ? emp.mobile.split(" ")[1] : emp.mobile}
                  </p>
                )}
                {emp.address && (
                  <p className="mt-1 text-xs text-stone-500 flex items-start gap-1.5 line-clamp-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {emp.address}
                  </p>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <UserCircle2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-stone-400 px-4">
                {searchQuery
                  ? "No employees match your search."
                  : "No employees yet. Add your first team member!"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          id="employee-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/80 shrink-0">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-500" />
                {editingId ? "Edit Employee" : "Add New Employee"}
              </h2>
              <button
                id="close-employee-modal"
                onClick={closeModal}
                className="p-2 rounded-lg text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-5">
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-3">
                  <div
                    id="photo-upload-zone"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 hover:border-amber-400 hover:bg-amber-50/40 transition-all cursor-pointer group overflow-hidden"
                  >
                    {photoPreview ? (
                      <>
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                        <Camera className="w-7 h-7 text-stone-300 group-hover:text-amber-400 transition-colors" />
                        <span className="text-[10px] font-bold text-stone-400 group-hover:text-amber-500 text-center leading-tight px-1">
                          Upload Photo
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <p className="text-xs text-stone-400">JPG, PNG or WebP - 1KB to 1MB</p>
                </div>

                {/* Employee Name */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-stone-500 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" />
                    Employee Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="employee-name-input"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50 outline-none transition-all font-medium text-stone-900"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-stone-500 uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5" />
                    Category
                  </label>
                  <CategorySelect
                    value={form.category}
                    onChange={(val) => setForm((p) => ({ ...p, category: val }))}
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-stone-500 uppercase tracking-wider">
                    <Phone className="w-3.5 h-3.5" />
                    Mobile Number
                  </label>
                  <div className="flex">
                    <RegionSelect
                      value={form.regionCode}
                      onChange={(val) => setForm((p) => ({ ...p, regionCode: val }))}
                    />
                    <input
                      id="employee-mobile-input"
                      type="tel"
                      value={form.mobile}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                        }))
                      }
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-3 text-sm border border-stone-200 rounded-r-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-stone-500 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    Address
                  </label>
                  <textarea
                    id="employee-address-input"
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Enter full address"
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-employee-btn"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingId ? "Update Employee" : "Add Employee"}</>
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
