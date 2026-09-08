"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { Plus, Users, Search, X, Edit2, Trash2, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { subscribeToParties, subscribeToBills, subscribeToCollections, addPartyToDB, updatePartyInDB, deletePartyFromDB, moveToTrashDB } from "@/lib/db";

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
  { code: "+977", country: "Nepal" }
];

function RegionSelect({ value, onChange }: { value: string, onChange: (val: string) => void }) {
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

  const filteredOptions = COUNTRY_CODES.filter(opt =>
    opt.country.toLowerCase().includes(search.toLowerCase()) ||
    opt.code.includes(search)
  );

  return (
    <div className="relative w-32 shrink-0" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-3 text-sm border border-stone-200 border-r-0 rounded-l-xl bg-stone-50/50 hover:bg-stone-50 cursor-pointer flex justify-between items-center transition-colors h-full"
      >
        <span className="font-semibold text-stone-900">{value}</span>
        <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-[70] mt-1 w-56 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-stone-100 bg-stone-50/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                autoFocus
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Search region..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filteredOptions.map((opt, idx) => (
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

export default function PartiesPage() {
  const { t } = useLanguage();
  const [parties, setParties] = useState<any[]>([]);
  const [billsHistory, setBillsHistory] = useState<any[]>([]);
  const [collectionsHistory, setCollectionsHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubParties = subscribeToParties((data) => setParties(data));
    const unsubBills = subscribeToBills((data) => setBillsHistory(data));
    const unsubColls = subscribeToCollections((data) => setCollectionsHistory(data));

    return () => {
      unsubParties();
      unsubBills();
      unsubColls();
    };
  }, []);

  const getPartyOutstanding = (party: any) => {
    let outAmount = parseFloat(party?.previousAmount || "0");
    let outSilver = parseFloat(party?.previousFine || "0");

    const partyBills = billsHistory.filter(b => b.partyName === party.name);
    partyBills.forEach(bill => {
      const billAmount = Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.lbramt) || 0), 0) || 0);
      const billSilver = Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.silver) || 0), 0) || 0);
      outAmount += billAmount;
      outSilver += billSilver;
    });

    const partyCollections = collectionsHistory.filter(h => h.partyName === party.name);
    partyCollections.forEach(coll => {
      outAmount -= parseFloat(coll.amount || "0");
      outSilver -= parseFloat(coll.silverKg || "0");
    });

    return {
      amount: Math.round(outAmount).toString(),
      fine: Math.round(outSilver).toString()
    };
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartyId, setEditingPartyId] = useState<number | null>(null);

  const [formName, setFormName] = useState("");
  const [formRegionCode, setFormRegionCode] = useState("+91");
  const [formMobile, setFormMobile] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCategory, setFormCategory] = useState("Customer");
  const [formPreviousAmount, setFormPreviousAmount] = useState("");
  const [formPreviousFine, setFormPreviousFine] = useState("");

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPartyId(null);
    setFormName("");
    setFormRegionCode("+91");
    setFormMobile("");
    setFormAddress("");
    setFormCategory("Customer");
    setFormPreviousAmount("");
    setFormPreviousFine("");
  };

  const handleEditClick = (party: any) => {
    setEditingPartyId(party.id);
    setFormName(party.name);

    const mobileParts = (party.mobile || "").split(" ");
    if (mobileParts.length > 1 && mobileParts[0].startsWith("+")) {
      setFormRegionCode(mobileParts[0]);
      setFormMobile(mobileParts[1]);
    } else {
      setFormRegionCode("+91");
      setFormMobile(party.mobile || "");
    }

    setFormAddress(party.address || "");
    setFormCategory(party.category || "Customer");
    setFormPreviousAmount(party.previousAmount === "0.00" ? "" : (party.previousAmount || ""));
    setFormPreviousFine(party.previousFine === "0.000" ? "" : (party.previousFine || ""));
    setIsModalOpen(true);
  };

  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const partyData = {
      name: formName.trim(),
      mobile: formMobile ? `${formRegionCode} ${formMobile}` : "",
      address: formAddress.trim(),
      category: formCategory,
      previousAmount: formPreviousAmount || "0.00",
      previousFine: formPreviousFine || "0.000"
    };

    handleCloseModal();

    try {
      if (editingPartyId) {
        await updatePartyInDB(editingPartyId as any, partyData);
      } else {
        await addPartyToDB(partyData);
      }
    } catch (error) {
      console.error("Failed to save party to DB", error);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Party Module</h1>
          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            Manage your customers, clients, and business partners.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <button
            onClick={() => {
              handleCloseModal();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors focus:ring-4 focus:ring-amber-100 shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Add Party
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] sm:text-sm font-bold text-stone-500 uppercase tracking-wider mb-1">Total Outstanding Amount</p>
          <p className="text-xl sm:text-3xl font-black text-red-600 truncate">
            ₹{parties.reduce((sum, p) => sum + parseFloat(getPartyOutstanding(p).amount), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] sm:text-sm font-bold text-stone-500 uppercase tracking-wider mb-1">Total Outstanding Fine</p>
          <p className="text-xl sm:text-3xl font-black text-red-600 truncate">
            {parties.reduce((sum, p) => sum + parseFloat(getPartyOutstanding(p).fine), 0).toFixed(3)} g
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center gap-4 bg-stone-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search parties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
            />
          </div>
        </div>
        <div className="overflow-x-hidden sm:overflow-x-auto">
          <table className="w-full text-left border-collapse border-none sm:border border-stone-200 block sm:table">
            <thead className="hidden sm:table-header-group">
              <tr className="bg-stone-50/80">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 w-16 text-center">Sr No</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Party Name</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 text-right">Outstanding Amount (₹)</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 text-right">Outstanding Fine (g)</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Mobile Number</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Address</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right border border-stone-200 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {parties
                .filter(party => 
                  party.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (party.mobile && party.mobile.includes(searchQuery))
                )
                .map((party, idx) => {
                const outstanding = getPartyOutstanding(party);
                return (
                  <tr key={party.id} className="block sm:table-row bg-white hover:bg-stone-50/50 transition-colors border-b-8 sm:border-b-0 border-stone-100 sm:border border-stone-200 p-4 sm:p-0 relative">
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-stone-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-center">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Sr No</span>
                      {idx + 1}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-stone-900 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Party Name</span>
                      {party.name}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-bold text-red-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-right">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Amount (₹)</span>
                      {outstanding.amount}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-bold text-red-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:text-right">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Fine (g)</span>
                      {outstanding.fine}
                    </td>
                    <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm text-stone-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Mobile</span>
                      {party.mobile?.includes(' ') ? party.mobile.split(' ')[1] : party.mobile}
                    </td>
                    <td className="flex sm:table-cell justify-between items-start sm:items-center px-2 py-2 sm:px-6 sm:py-4 text-sm text-stone-600 max-w-xs sm:truncate border-b sm:border-b-0 sm:border-solid border-stone-200">
                      <span className="sm:hidden text-xs font-bold text-stone-400 uppercase whitespace-nowrap mr-4 mt-1">Address</span>
                      <span className="text-right sm:text-left">{party.address}</span>
                    </td>
                    <td className="flex sm:table-cell justify-end sm:justify-center items-center px-2 py-3 sm:px-6 sm:py-4 text-sm text-right border-none sm:border-solid sm:border border-stone-200 bg-stone-50/50 sm:bg-transparent mt-2 sm:mt-0 rounded-lg sm:rounded-none">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          title="Edit Party"
                          onClick={() => handleEditClick(party)}
                          className="flex items-center gap-2 px-3 py-1.5 sm:p-2 text-stone-500 sm:text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors bg-white sm:bg-transparent border border-stone-200 sm:border-none shadow-sm sm:shadow-none font-medium text-xs sm:text-sm"
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="sm:hidden">Edit</span>
                        </button>
                        <button
                          title="Delete Party"
                          onClick={async () => {
                            if (confirm("Are you sure you want to delete this party?")) {
                              await moveToTrashDB('party', party);
                              await deletePartyFromDB(party.id);
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 sm:p-2 text-red-500 sm:text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white sm:bg-transparent border border-stone-200 sm:border-none shadow-sm sm:shadow-none font-medium text-xs sm:text-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="sm:hidden">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {parties.filter(party => 
                  party.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (party.mobile && party.mobile.includes(searchQuery))
                ).length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-stone-500 border border-stone-200">
                    No parties found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Party Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-stone-100">
              <h2 className="text-xl font-bold text-stone-900">
                {editingPartyId ? "Edit Party" : "Add New Party"}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              {editingPartyId && (
                <div className="mb-6 bg-gradient-to-r from-amber-50 to-white border border-amber-200 p-4 rounded-xl flex gap-4 justify-around shadow-sm">
                  <div className="text-center">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Current Outstanding Amount</p>
                    <p className="text-2xl font-black text-red-600">₹{getPartyOutstanding(parties.find(p => p.id === editingPartyId)).amount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Current Outstanding Fine</p>
                    <p className="text-2xl font-black text-red-600">{getPartyOutstanding(parties.find(p => p.id === editingPartyId)).fine} g</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveParty} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">Party Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Enter party name"
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">Mobile Number</label>
                  <div className="flex">
                    <RegionSelect value={formRegionCode} onChange={setFormRegionCode} />
                    <input
                      type="tel"
                      value={formMobile}
                      onChange={e => setFormMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-3 text-sm border border-stone-200 rounded-r-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">Address</label>
                  <textarea
                    rows={3}
                    value={formAddress}
                    onChange={e => setFormAddress(e.target.value)}
                    placeholder="Full address"
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50 resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-stone-900 mb-2">Outstanding Amount (₹)</label>
                    <input
                      type="number"
                      value={formPreviousAmount}
                      onChange={e => setFormPreviousAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-stone-900 mb-2">Outstanding Fine (g)</label>
                    <input
                      type="number"
                      value={formPreviousFine}
                      onChange={e => setFormPreviousFine(e.target.value)}
                      placeholder="0.000"
                      className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2.5 text-sm font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors shadow-sm"
                  >
                    {editingPartyId ? "Update" : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
