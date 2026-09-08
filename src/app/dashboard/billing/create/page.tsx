"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { Plus, Settings2, X, Users, Receipt, ChevronDown, Search, Edit2, Trash2, Eye, Download, History, Eraser, MoreVertical } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { generateBillPDF, generateBulkBillPDF } from "@/lib/pdfGenerator";
import { subscribeToParties, subscribeToSettings, addBillToDB, moveToTrashDB, updateSettings, deleteBillFromDB, updateBillInDB, getPaginatedBills, getBillsForParty, getCollectionsForParty, subscribeToCollections } from "@/lib/db";
import { useRouter } from "next/navigation";

type PartyProfile = {
  name: string;
  mobile: string;
  address: string;
  previousAmount?: string;
  previousFine?: string;
};

// Custom Searchable Dropdown Component
function SearchableSelect({ options, value, onChange, onAdd, placeholder, id }: { options: string[], value: string, onChange: (val: string) => void, onAdd?: (val: string) => void, placeholder: string, id?: string }) {
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
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl bg-stone-50/50 hover:bg-stone-50 cursor-pointer flex justify-between items-center transition-colors"
      >
        <span className={value ? "text-stone-900" : "text-stone-400"}>
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
            {search.trim() && !filteredOptions.some(o => o.toLowerCase() === search.trim().toLowerCase()) && onAdd && (
              <div
                onClick={() => {
                  onAdd(search.trim());
                  onChange(search.trim());
                  setIsOpen(false);
                  setSearch("");
                }}
                className="px-3 py-2.5 text-amber-600 hover:bg-amber-50 cursor-pointer text-sm rounded-lg transition-colors font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add "{search.trim()}"
              </div>
            )}
            {filteredOptions.length === 0 && !search.trim() && (
              <div className="px-4 py-4 text-sm text-stone-500 text-center">
                No matching options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Custom ComboBox for Items Detail (allows free text & dropdown)
function ComboBox({ options, value, onChange, onSelectNext, placeholder, id, disabled }: { options: string[], value: string, onChange: (val: string) => void, onSelectNext?: () => void, placeholder: string, id?: string, disabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
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

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setIsOpen(false);
              if (onSelectNext) onSelectNext();
            }
            if (e.key === 'Escape' || e.key === 'Tab') setIsOpen(false);
          }}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-8 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${disabled ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'bg-white'}`}
          autoComplete="off"
        />
        <ChevronDown
          onClick={() => { if (!disabled) setIsOpen(!isOpen) }}
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-[70] mt-1 bg-white border border-stone-200 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {filteredOptions.map((opt, idx) => (
            <div
              key={idx}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt);
                setIsOpen(false);
                if (onSelectNext) setTimeout(() => onSelectNext(), 50);
              }}
              className="px-3 py-2 hover:bg-amber-50 hover:text-amber-700 cursor-pointer text-sm rounded-lg transition-colors"
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateBillPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageModalView, setManageModalView] = useState("bill"); // "bill", "bill_number"
  const [showHistory, setShowHistory] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // History Filters & Bulk Download
  const [historySearch, setHistorySearch] = useState("");
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());

  const [isInnerManageOpen, setIsInnerManageOpen] = useState(false);
  const [innerInputValue, setInnerInputValue] = useState("");

  const [savedPartiesList, setSavedPartiesList] = useState<string[]>([]);
  const [savedItemsList, setSavedItemsList] = useState<string[]>([]);
  const [savedMobilesList, setSavedMobilesList] = useState<string[]>([]);
  const [savedAddressesList, setSavedAddressesList] = useState<string[]>([]);

  // Party Profiles for Auto-fill
  const [partyProfiles, setPartyProfiles] = useState<PartyProfile[]>([]);
  const [billsHistory, setBillsHistory] = useState<any[]>([]);
  const [collectionsHistory, setCollectionsHistory] = useState<any[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisibleDocs, setLastVisibleDocs] = useState<any[]>([]);
  const [hasMoreBills, setHasMoreBills] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Action Dropdown State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as Element).closest('.action-dropdown-container')) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form State
  const [formPartyName, setFormPartyName] = useState("");
  const [formMobileNumber, setFormMobileNumber] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formItemName, setFormItemName] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [editBillId, setEditBillId] = useState<string | null>(null);

  const [items, setItems] = useState<any[]>([]);

  // Input Row State
  const [inputPcs, setInputPcs] = useState("");
  const [inputPwt, setInputPwt] = useState("");
  const [inputGrwt, setInputGrwt] = useState("");
  const [inputLesswt, setInputLesswt] = useState("");
  const [inputNetwt, setInputNetwt] = useState("");
  const [inputTouch, setInputTouch] = useState("");
  const [inputWest, setInputWest] = useState("");
  const [inputLbrrate, setInputLbrrate] = useState("");
  const [inputSilver, setInputSilver] = useState("");
  const [originalSilver, setOriginalSilver] = useState("");
  const [inputLbramt, setInputLbramt] = useState("");

  const [previousAmount, setPreviousAmount] = useState("");
  const [previousSilver, setPreviousSilver] = useState("");

  // Item Language State
  const [itemLanguage, setItemLanguage] = useState("english");
  const [isWtPrice, setIsWtPrice] = useState(false);

  const itemHeaders = {
    english: {
      ItemName: "Detail",
      Pcs: "Pcs",
      LbrRate: isWtPrice ? "Wt Price" : "Lbr",
      LbrAmount: "Total Lbr",
      NetWt: "Total Wt",
      LessWt: "Less Wt",
      GrWt: "Wt",
      Touch: "Touch",
      Silver: "Fine"
    },
    gujarati: {
      ItemName: "વિગત",
      Pcs: "નંગ",
      LbrRate: isWtPrice ? "વજન ભાવ" : "મજૂરી",
      LbrAmount: "કુલ મજૂરી",
      NetWt: "કુલ વજન",
      LessWt: "લેસ વજન",
      GrWt: "વજન",
      Touch: "ટચ",
      Silver: "ફાઈન"
    }
  };
  const tH = itemHeaders[itemLanguage as keyof typeof itemHeaders] || itemHeaders.english;

  useEffect(() => {
    if (isWtPrice) {
      if (inputGrwt && inputLbrrate) {
        const wt = parseFloat(inputGrwt) || 0;
        const lbr = parseFloat(inputLbrrate) || 0;
        setInputLbramt(Math.round((wt / 1000) * lbr).toString());
      }
    } else {
      if (inputPcs && inputLbrrate) {
        const pcs = parseFloat(inputPcs) || 0;
        const lbr = parseFloat(inputLbrrate) || 0;
        setInputLbramt(Math.round(pcs * lbr).toString());
      }
    }
  }, [isWtPrice, inputPcs, inputLbrrate, inputGrwt]);

  useEffect(() => {
    if (inputGrwt) {
      const wt = parseFloat(inputGrwt) || 0;
      const lessWt = parseFloat(inputLesswt) || 0;
      setInputNetwt(Number((wt - lessWt).toFixed(2)).toString());
    }
  }, [inputGrwt, inputLesswt]);

  useEffect(() => {
    if (inputNetwt && inputTouch) {
      const totalWt = parseFloat(inputNetwt) || 0;
      const touch = parseFloat(inputTouch) || 0;
      const calculatedSilver = (totalWt * touch) / 100;

      const integerPart = Math.floor(calculatedSilver);
      const decimalPart = calculatedSilver - integerPart;

      const roundedSilver = Math.round(calculatedSilver);

      if (decimalPart > 0) {
        setOriginalSilver(Number(calculatedSilver.toFixed(3)).toString());
      } else {
        setOriginalSilver("");
      }

      setInputSilver(roundedSilver.toString());
    }
  }, [inputNetwt, inputTouch]);

  // Helper for Enter key navigation
  const focusNext = (e: React.KeyboardEvent, nextId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const el = document.getElementById(nextId);
      if (el) el.focus();
    }
  };

  const clearItemInputs = () => {
    setFormItemName("");
    setInputPcs("");
    setInputPwt("");
    setInputGrwt("");
    setInputLesswt("");
    setInputNetwt("");
    setInputTouch("");
    setInputWest("");
    setInputLbrrate("");
    setInputSilver("");
    setOriginalSilver("");
    setInputLbramt("");
  };

  const handleAddItem = () => {
    if (!formItemName) return; // Require at least Item Name
    const newItem = {
      name: formItemName,
      pcs: inputPcs,
      pwt: inputPwt,
      grwt: inputGrwt,
      lesswt: inputLesswt,
      netwt: inputNetwt,
      touch: inputTouch,
      west: inputWest,
      lbrrate: inputLbrrate,
      silver: inputSilver,
      lbramt: inputLbramt
    };
    setItems([...items, newItem]);
    clearItemInputs();
  };

  const handleEditItem = (idx: number) => {
    const item = items[idx];
    setFormItemName(item.name);
    setInputPcs(item.pcs);
    setInputPwt(item.pwt);
    setInputGrwt(item.grwt);
    setInputLesswt(item.lesswt);
    setInputNetwt(item.netwt);
    setInputTouch(item.touch);
    setInputWest(item.west);
    setInputLbrrate(item.lbrrate);
    setInputSilver(item.silver);
    setInputLbramt(item.lbramt);
    setItems(items.filter((_, i) => i !== idx));
  };

  // Auto-calculate current totals for display
  const currentTotalAmount = Math.round(items.reduce((sum, item) => sum + (parseFloat(item.lbramt) || 0), 0)).toString();
  const currentTotalFine = Math.round(items.reduce((sum, item) => sum + (parseFloat(item.silver) || 0), 0)).toString();

  const handlePreviewCurrentBill = async () => {
    const billData = {
      id: Date.now().toString(),
      srNo: billNumber || "N/A",
      date: currentDate || "N/A",
      dateTime: new Date().toLocaleString(),
      partyName: formPartyName || "N/A",
      mobile: formMobileNumber || "N/A",
      address: formAddress || "N/A",
      billNumber: billNumber || "N/A",
      previousAmount: previousAmount || "0.00",
      previousSilver: previousSilver || "0.000",
      items: [...items]
    };
    const blobUrl = await generateBillPDF(billData, 'bloburl');
    if (blobUrl) {
      setPreviewUrl(blobUrl.toString());
      setIsPreviewModalOpen(true);
    }
  };

  const handleSubmitBill = async () => {
    if (items.length === 0) {
      alert("Please add at least one item to the bill.");
      return;
    }

    const billData = {
      srNo: billNumber || "N/A",
      date: currentDate || "N/A",
      dateTime: new Date().toLocaleString(),
      partyName: formPartyName || "N/A",
      mobile: formMobileNumber || "N/A",
      address: formAddress || "N/A",
      billNumber: billNumber || "N/A",
      previousAmount: previousAmount || "0.00",
      previousSilver: previousSilver || "0.000",
      items: [...items]
    };

    // Save to history (Firebase)
    try {
      if (editBillId) {
        await updateBillInDB(editBillId, billData);
      } else {
        await addBillToDB(billData);
      }
    } catch (error) {
      console.error("Error saving bill: ", error);
      alert("Failed to save bill to database.");
      return;
    }

    // Auto-increment bill number if possible
    if (!editBillId && billNumber) {
      const numericMatch = billNumber.match(/(\d+)$/);
      if (numericMatch) {
        const numStr = numericMatch[1];
        const numLen = numStr.length;
        const nextNum = (parseInt(numStr, 10) + 1).toString().padStart(numLen, '0');
        const nextBillNum = billNumber.replace(/\d+$/, nextNum);
        setBillNumber(nextBillNum);
        await updateSettings({ startingBillNumber: nextBillNum });
      }
    }

    // Only reset Items list, preserve Party Details
    setItems([]);
    setEditBillId(null);
    alert(editBillId ? "Bill updated successfully!" : "Bill saved successfully!");
    setShowHistory(true);
  };

  // Format current date as YYYY-MM-DD for the date input default
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setCurrentDate(formattedDate);
  }, []);

  // Auto-fill mobile and address when a known party is selected
  useEffect(() => {
    const profile = partyProfiles.find(p => p.name === formPartyName);
    if (profile) {
      if (profile.mobile) setFormMobileNumber(profile.mobile);
      if (profile.address) setFormAddress(profile.address);
    }
  }, [formPartyName, partyProfiles]);

  // Auto-fill outstanding balances using targeted queries
  useEffect(() => {
    if (!formPartyName) {
      setPreviousAmount("");
      setPreviousSilver("");
      return;
    }

    const calculateOutstanding = async () => {
      // 1. Get initial balance from party profile
      const profile = partyProfiles.find(p => p.name === formPartyName);
      let outAmount = parseFloat(profile?.previousAmount || "0");
      let outSilver = parseFloat(profile?.previousFine || "0");

      // Fetch only bills and collections for this specific party
      const partyBills = await getBillsForParty(formPartyName);
      const partyCollections = await getCollectionsForParty(formPartyName);

      // 2. Add all bill amounts
      partyBills.forEach((bill: any) => {
        const billAmount = Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.lbramt) || 0), 0) || 0);
        const billSilver = Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.silver) || 0), 0) || 0);
        outAmount += billAmount;
        outSilver += billSilver;
      });

      // 3. Subtract all collected amounts
      partyCollections.forEach((coll: any) => {
        outAmount -= (parseFloat(coll.amount || "0") + parseFloat(coll.notPayableAmount || "0"));
        outSilver -= parseFloat(coll.silverKg || "0");
      });

      setPreviousAmount(Math.round(outAmount).toString());
      setPreviousSilver(Number(outSilver.toFixed(3)).toString());
    };

    calculateOutstanding();
  }, [formPartyName, partyProfiles]);

  // Fetch paginated history when needed
  const fetchHistoryPage = async (pageIndex: number, lastDoc: any = null) => {
    setIsHistoryLoading(true);
    try {
      const { bills, lastDoc: newLastDoc, hasMore } = await getPaginatedBills(10, lastDoc, historySearch, historyFromDate, historyToDate);
      setBillsHistory(bills);
      setHasMoreBills(hasMore);

      const newDocs = [...lastVisibleDocs];
      newDocs[pageIndex] = newLastDoc;
      setLastVisibleDocs(newDocs);
    } catch (error) {
      console.error("Error fetching bills: ", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      // Re-fetch when entering history view, or search changes
      setCurrentPage(1);
      setLastVisibleDocs([]);
      fetchHistoryPage(1, null);
    }
  }, [showHistory, historySearch, historyFromDate, historyToDate]);

  const handleNextPage = () => {
    if (hasMoreBills) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchHistoryPage(nextPage, lastVisibleDocs[currentPage - 1]);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      // If we go to page 1, pass null. Otherwise pass the document from page - 2
      const lastDoc = prevPage === 1 ? null : lastVisibleDocs[prevPage - 2];
      fetchHistoryPage(prevPage, lastDoc);
    }
  };

  // Load static data from Firebase
  useEffect(() => {
    const unsubParties = subscribeToParties((parsedParties) => {
      setPartyProfiles(parsedParties);
      setSavedPartiesList(prev => {
        const names = parsedParties.map((p: any) => p.name);
        return Array.from(new Set([...prev, ...names]));
      });
    });

    const unsubSettings = subscribeToSettings((data) => {
      if (data.itemsList) setSavedItemsList(data.itemsList);
      if (data.startingBillNumber) {
        setBillNumber(prev => prev === "" ? data.startingBillNumber : prev);
      }
    });

    const unsubCollections = subscribeToCollections((data) => {
      setCollectionsHistory(data);
    });

    return () => {
      unsubParties();
      unsubSettings();
      unsubCollections();
    };
  }, []);

  const handleDeleteHistory = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this bill from history?");
    if (confirmDelete) {
      const deletedBill = billsHistory.find((b: any) => b.id === id);
      if (deletedBill) {
        await moveToTrashDB('bill', deletedBill);
        await deleteBillFromDB(id);
      }
    }
  };

  const handleDownload = async (bill: any) => {
    await generateBillPDF(bill, 'download');
  };

  const handlePreview = async (bill: any) => {
    const blobUrl = await generateBillPDF(bill, 'bloburl');
    if (blobUrl) {
      window.open(blobUrl.toString(), '_blank');
    }
  };

  const handleEditHistory = (bill: any) => {
    // Fill the current form with the edit data
    setFormPartyName(bill.partyName || "");
    setFormMobileNumber(bill.mobile || "");
    setFormAddress(bill.address || "");
    setBillNumber(bill.billNumber || "");
    setItems(bill.items || []);
    setEditBillId(bill.id);
    setShowHistory(false);
  };

  const handleWhatsApp = async (bill: any) => {
    const phone = bill.mobile?.replace(/\D/g, '') || '';
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
    const totalAmount = Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.lbramt) || 0), 0) || 0).toString();
    const totalFine = Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.silver) || 0), 0) || 0).toString();

    // Calculate outstanding balances for the party using targeted queries
    const profile = partyProfiles.find(p => p.name === bill.partyName);
    let outAmount = parseFloat(profile?.previousAmount || "0");
    let outSilver = parseFloat(profile?.previousFine || "0");

    const partyBills = await getBillsForParty(bill.partyName);
    const partyCollections = await getCollectionsForParty(bill.partyName);

    partyBills.forEach((b: any) => {
      outAmount += Math.round(b.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.lbramt) || 0), 0) || 0);
      outSilver += Math.round(b.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.silver) || 0), 0) || 0);
    });

    partyCollections.forEach((coll: any) => {
      outAmount -= (parseFloat(coll.amount || "0") + parseFloat(coll.notPayableAmount || "0"));
      outSilver -= parseFloat(coll.silverKg || "0");
    });

    const outAmountStr = Math.round(outAmount).toString();
    const outSilverStr = Math.round(outSilver).toString();

    const text = `Hello ${bill.partyName},\n\nPlease find your bill (No. ${bill.billNumber || '-'}) attached.\n\n🔵 Amount: ₹${totalAmount}\n🔵 Fine: ${totalFine} g\n\n🔴 Total Outstanding Amount: ₹${outAmountStr}\n🔴 Total Outstanding Fine: ${outSilverStr} g\n\nThank you!\nvia N D Suhagiya`;

    const pdfBlob = await generateBillPDF(bill, 'blob');
    const safePartyName = (bill.partyName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
    const safeBillNumber = (bill.billNumber || 'New').replace(/[^a-zA-Z0-9]/g, '_');
    const file = new File([pdfBlob as Blob], `${safePartyName}_${safeBillNumber}.pdf`, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Bill ${bill.billNumber || ''}`,
          text: text,
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing:', error);
        await generateBillPDF(bill, 'download');
        const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
      }
    } else {
      await generateBillPDF(bill, 'download');
      const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    }
  };

  const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );

  const filteredHistory = billsHistory.filter((bill: any) => {
    const searchMatch = !historySearch ||
      (bill.partyName || "").toLowerCase().includes(historySearch.toLowerCase()) ||
      (bill.billNumber || "").toLowerCase().includes(historySearch.toLowerCase()) ||
      (bill.mobile || "").includes(historySearch);

    let dateMatch = true;
    const billDate = new Date(bill.date || bill.dateTime);
    if (historyFromDate && !isNaN(billDate.getTime())) {
      if (billDate < new Date(historyFromDate)) dateMatch = false;
    }
    if (historyToDate && !isNaN(billDate.getTime())) {
      // Add 1 day to toDate to include the whole day
      const to = new Date(historyToDate);
      to.setDate(to.getDate() + 1);
      if (billDate >= to) dateMatch = false;
    }

    return searchMatch && dateMatch;
  });

  const historyTotalAmount = filteredHistory.reduce((acc, bill) => {
    const billAmount = Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.lbramt) || 0), 0) || 0);
    return acc + billAmount;
  }, 0);

  const historyTotalFine = filteredHistory.reduce((acc, bill) => {
    const billFine = Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.silver) || 0), 0) || 0);
    return acc + billFine;
  }, 0);

  const filteredCollections = collectionsHistory.filter((coll: any) => {
    const searchMatch = !historySearch || (coll.partyName || "").toLowerCase().includes(historySearch.toLowerCase());
    let dateMatch = true;
    const collDate = new Date(coll.date || coll.createdAt || coll.dateTime);
    if (historyFromDate && !isNaN(collDate.getTime())) {
      if (collDate < new Date(historyFromDate)) dateMatch = false;
    }
    if (historyToDate && !isNaN(collDate.getTime())) {
      const to = new Date(historyToDate);
      to.setDate(to.getDate() + 1);
      if (collDate >= to) dateMatch = false;
    }
    return searchMatch && dateMatch;
  });

  const historyTotalCollectAmount = filteredCollections.reduce((acc, coll) => acc + (parseFloat(coll.amount || "0") + parseFloat(coll.notPayableAmount || "0")), 0);
  const historyTotalCollectFine = filteredCollections.reduce((acc, coll) => acc + parseFloat(coll.silverKg || "0"), 0);

  const toggleSelectAll = () => {
    if (selectedBills.size === filteredHistory.length) {
      setSelectedBills(new Set());
    } else {
      setSelectedBills(new Set(filteredHistory.map((b: any) => b.id)));
    }
  };

  const toggleSelectBill = (id: string) => {
    const newSelected = new Set(selectedBills);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedBills(newSelected);
  };

  const handleBulkDownload = () => {
    const billsToDownload = filteredHistory.filter((b: any) => selectedBills.has(b.id));
    generateBulkBillPDF(billsToDownload);
    setSelectedBills(new Set());
  };


  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Global Datalists for Autocomplete */}
      <datalist id="saved-parties-list">
        {savedPartiesList.map((party, idx) => (
          <option key={idx} value={party} />
        ))}
      </datalist>
      <datalist id="saved-mobiles-list">
        {savedMobilesList.map((mobile, idx) => (
          <option key={idx} value={mobile} />
        ))}
      </datalist>
      <datalist id="saved-addresses-list">
        {savedAddressesList.map((address, idx) => (
          <option key={idx} value={address} />
        ))}
      </datalist>
      <datalist id="saved-items-list">
        {savedItemsList.map((item, idx) => (
          <option key={idx} value={item} />
        ))}
      </datalist>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">{showHistory ? "Bill History" : "Create Bill"}</h1>

        </div>

        {/* Top Right Buttons */}
        <div className="shrink-0 flex items-center gap-3">
          <button
            onClick={() => {
              if (!showHistory) {
                setEditBillId(null);
                setItems([]);
              }
              setShowHistory(!showHistory);
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors focus:ring-4 focus:ring-stone-50"
          >
            <History className="h-5 w-5" />
            {showHistory ? "Back to Create" : "View History"}
          </button>
          {!showHistory && (
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors focus:ring-4 focus:ring-stone-50"
            >
              <Settings2 className="h-5 w-5" />
              Setting
            </button>
          )}
        </div>
      </div>

      {showHistory ? (
        <div className="space-y-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-1">Total Bill Amount</p>
                <p className="text-2xl xl:text-3xl font-black text-amber-600">₹{Math.round(historyTotalAmount).toLocaleString('en-IN')}</p>
              </div>
              <div className="hidden xl:flex h-12 w-12 bg-amber-50 rounded-xl items-center justify-center text-amber-600">
                <span className="text-xl font-bold">₹</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-1">Total Collect Amount</p>
                <p className="text-2xl xl:text-3xl font-black text-green-600">₹{Math.round(historyTotalCollectAmount).toLocaleString('en-IN')}</p>
              </div>
              <div className="hidden xl:flex h-12 w-12 bg-green-50 rounded-xl items-center justify-center text-green-600">
                <span className="text-xl font-bold">₹</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-1">Total Fine Weight</p>
                <p className="text-2xl xl:text-3xl font-black text-stone-900">{Math.round(historyTotalFine).toString()} g</p>
              </div>
              <div className="hidden xl:flex h-12 w-12 bg-stone-100 rounded-xl items-center justify-center text-stone-600">
                <span className="text-xl font-bold text-lg">⚖️</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-1">Total Collect Fine</p>
                <p className="text-2xl xl:text-3xl font-black text-blue-600">{Number(historyTotalCollectFine.toFixed(3)).toString()} g</p>
              </div>
              <div className="hidden xl:flex h-12 w-12 bg-blue-50 rounded-xl items-center justify-center text-blue-600">
                <span className="text-xl font-bold text-lg">⚖️</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">
              <div className="relative w-full md:w-64 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search bills..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-stone-500 text-sm font-medium whitespace-nowrap">From:</span>
                  <input
                    type="date"
                    value={historyFromDate}
                    onChange={(e) => setHistoryFromDate(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    title="From Date"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-stone-500 text-sm font-medium whitespace-nowrap">To:</span>
                  <input
                    type="date"
                    value={historyToDate}
                    onChange={(e) => setHistoryToDate(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    title="To Date"
                  />
                </div>
                {(historyFromDate || historyToDate || historySearch) && (
                  <button
                    onClick={() => {
                      setHistoryFromDate("");
                      setHistoryToDate("");
                      setHistorySearch("");
                    }}
                    className="w-full sm:w-auto p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex justify-center items-center shrink-0"
                    title="Clear Filters"
                  >
                    <X className="w-5 h-5" />
                    <span className="sm:hidden ml-2 font-medium">Clear Filters</span>
                  </button>
                )}
              </div>
            </div>
            <div className="w-full xl:w-auto flex justify-end shrink-0">
              <button
                onClick={handleBulkDownload}
                disabled={selectedBills.size === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-800"
              >
                <Download className="w-4 h-4" />
                Bulk Download ({selectedBills.size})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div className="overflow-x-auto pb-16">
              <table className="w-full text-left text-sm text-stone-600">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200">
                    <th className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded text-amber-500 focus:ring-amber-500"
                        checked={filteredHistory.length > 0 && selectedBills.size === filteredHistory.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider">Sr No</th>
                    <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider">Bill Number</th>
                    <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider">Party Name</th>
                    <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider">Mobile Number</th>
                    <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider text-right">Total Amount (₹)</th>
                    <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider text-right">Total Fine (g)</th>
                    <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-stone-500">
                        No bills found.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((bill: any, idx: number) => (
                      <tr key={bill.id} className={`hover:bg-amber-50/30 transition-colors ${selectedBills.has(bill.id) ? 'bg-amber-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded text-amber-500 focus:ring-amber-500"
                            checked={selectedBills.has(bill.id)}
                            onChange={() => toggleSelectBill(bill.id)}
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-stone-900">{idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{bill.dateTime || bill.date}</td>
                        <td className="px-6 py-4 font-bold text-stone-900">{bill.billNumber || "-"}</td>
                        <td className="px-6 py-4 font-semibold text-stone-900">{bill.partyName}</td>
                        <td className="px-6 py-4">{bill.mobile?.includes(' ') ? bill.mobile.split(' ')[1] : bill.mobile}</td>
                        <td className="px-6 py-4 font-bold text-amber-600 text-right">
                          {Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.lbramt) || 0), 0) || 0).toString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-stone-900 text-right">
                          {Math.round(bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.silver) || 0), 0) || 0).toString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleWhatsApp(bill)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Send via WhatsApp">
                              <WhatsAppIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleEditHistory(bill)} className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <div className="relative action-dropdown-container">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(activeDropdown === bill.id ? null : bill.id);
                                }}
                                className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                                title="More Actions"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>
                              {activeDropdown === bill.id && (
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-stone-200 rounded-xl shadow-xl z-[90] overflow-hidden text-left">
                                  <button onClick={() => { setActiveDropdown(null); handlePreview(bill); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">
                                    <Eye className="w-4 h-4 text-blue-600" />
                                    Preview
                                  </button>
                                  <button onClick={() => { setActiveDropdown(null); handleDownload(bill); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">
                                    <Download className="w-4 h-4 text-amber-600" />
                                    Download
                                  </button>
                                  <button onClick={() => { setActiveDropdown(null); handleDeleteHistory(bill.id); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-stone-100">
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50/50">
              <span className="text-sm text-stone-500">
                Page {currentPage}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || isHistoryLoading}
                  className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!hasMoreBills || isHistoryLoading}
                  className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-stone-900">Party Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/dashboard/parties')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Party</span>
                  <span className="sm:hidden">Add</span>
                </button>
                <button
                  onClick={() => {
                    setFormPartyName("");
                    setFormMobileNumber("");
                    setFormAddress("");
                    setPreviousAmount("");
                    setPreviousSilver("");
                  }}
                  className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear Party Details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label htmlFor="partyName" className="block text-sm font-semibold text-stone-900 mb-2">
                  Party Name
                </label>
                <SearchableSelect
                  options={savedPartiesList}
                  value={formPartyName}
                  onChange={(val) => {
                    setFormPartyName(val);
                    setTimeout(() => document.getElementById("detailSelect")?.click(), 100);
                  }}
                  placeholder="Select Party"
                />
              </div>
              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-semibold text-stone-900 mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="mobileNumber"
                  value={formMobileNumber}
                  onChange={(e) => setFormMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={(e) => focusNext(e, 'address')}
                  placeholder="Enter mobile number"
                  className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all"
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-stone-900 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  onKeyDown={(e) => focusNext(e, 'billDate')}
                  placeholder="Enter full address"
                  className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all"
                />
              </div>
              <div>
                <label htmlFor="billNumber" className="block text-sm font-semibold text-stone-900 mb-2">
                  Bill Number
                </label>
                <input
                  type="text"
                  id="billNumber"
                  value={billNumber}
                  disabled
                  readOnly
                  onChange={(e) => setBillNumber(e.target.value)}
                  placeholder="e.g. INV-001"
                  className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl text-stone-500 bg-stone-100 cursor-not-allowed transition-all"
                />
              </div>
              <div>
                <label htmlFor="billDate" className="block text-sm font-semibold text-stone-900 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  id="billDate"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-bold text-stone-900">Items</h2>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isWtPrice} onChange={(e) => setIsWtPrice(e.target.checked)} className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4" />
                  <span className="text-sm font-medium text-stone-700">{itemLanguage === "gujarati" ? "વજન ભાવ" : "Wt Price"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="itemLanguage" value="english" checked={itemLanguage === "english"} onChange={() => setItemLanguage("english")} className="text-amber-500 focus:ring-amber-500" />
                  <span className="text-sm font-medium text-stone-700">English</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="itemLanguage" value="gujarati" checked={itemLanguage === "gujarati"} onChange={() => setItemLanguage("gujarati")} className="text-amber-500 focus:ring-amber-500" />
                  <span className="text-sm font-medium text-stone-700">Gujarati</span>
                </label>
              </div>
            </div>
            <div className="w-full pb-8 sm:pb-48">
              {/* Header Row (Desktop Only) */}
              <div className="hidden lg:grid grid-cols-[3fr_0.8fr_1.2fr_1.8fr_1.2fr_0.8fr_1.2fr_0.8fr_1.2fr_auto] gap-3 mb-2 px-2 items-end">
                <div className="text-xs font-bold text-stone-500 uppercase tracking-normal">{tH.ItemName}</div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-normal">{tH.Pcs}</div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-normal">{tH.LbrRate}</div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-normal">{tH.LbrAmount}</div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-normal">{tH.GrWt}</div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-normal">{tH.LessWt}</div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-normal">{tH.NetWt}</div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-normal">{tH.Touch}</div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-normal">{tH.Silver}</div>
                <div className="w-10"></div> {/* Space for button */}
              </div>

              {/* Input Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-[3fr_0.8fr_1.2fr_1.8fr_1.2fr_0.8fr_1.2fr_0.8fr_1.2fr_auto] gap-3 items-end bg-stone-50 p-4 lg:p-2 rounded-xl border border-stone-200 mt-2">
                <div className="col-span-2 sm:col-span-4 md:col-span-6 lg:col-span-1" title={!formPartyName ? "Please select a Party Name first" : ""}>
                  <label className="lg:hidden block text-xs font-semibold text-stone-500 mb-1">{tH.ItemName}</label>
                  <ComboBox
                    id="detailSelect"
                    options={savedItemsList}
                    value={formItemName}
                    onChange={setFormItemName}
                    onSelectNext={() => document.getElementById("inputPcs")?.focus()}
                    placeholder={tH.ItemName}
                    disabled={!formPartyName}
                  />
                </div>
                <div className="col-span-1 lg:col-span-1">
                  <label className="lg:hidden block text-xs font-semibold text-stone-500 mb-1">{tH.Pcs}</label>
                  <input id="inputPcs" type="number" value={inputPcs} onChange={e => setInputPcs(e.target.value)} onKeyDown={(e) => focusNext(e, 'inputLbrrate')} placeholder="0" className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white" />
                </div>
                <div className="col-span-1 lg:col-span-1">
                  <label className="lg:hidden block text-xs font-semibold text-stone-500 mb-1">{tH.LbrRate}</label>
                  <input id="inputLbrrate" type="number" value={inputLbrrate} onChange={e => setInputLbrrate(e.target.value)} onKeyDown={(e) => focusNext(e, 'inputGrwt')} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white" />
                </div>
                <div className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-1">
                  <label className="lg:hidden block text-xs font-semibold text-stone-500 mb-1">{tH.LbrAmount}</label>
                  <input id="inputLbramt" type="number" value={inputLbramt} readOnly tabIndex={-1} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-100 text-stone-500 cursor-not-allowed focus:outline-none" />
                </div>
                <div className="col-span-1 lg:col-span-1">
                  <label className="lg:hidden block text-xs font-semibold text-stone-500 mb-1">{tH.GrWt}</label>
                  <input id="inputGrwt" type="number" value={inputGrwt} onChange={e => setInputGrwt(e.target.value)} onBlur={e => e.target.value && setInputGrwt(Number(Number(e.target.value).toFixed(2)).toString())} onKeyDown={(e) => focusNext(e, 'inputLesswt')} placeholder="0" className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white" />
                </div>
                <div className="col-span-1 lg:col-span-1">
                  <label className="lg:hidden block text-xs font-semibold text-stone-500 mb-1">{tH.LessWt}</label>
                  <input id="inputLesswt" type="number" value={inputLesswt} onChange={e => setInputLesswt(e.target.value)} onBlur={e => e.target.value && setInputLesswt(Number(Number(e.target.value).toFixed(2)).toString())} onKeyDown={(e) => focusNext(e, 'inputTouch')} placeholder="0" className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white" />
                </div>
                <div className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-1">
                  <label className="lg:hidden block text-xs font-semibold text-stone-500 mb-1">{tH.NetWt}</label>
                  <input id="inputNetwt" type="number" value={inputNetwt} readOnly tabIndex={-1} placeholder="0" className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-100 text-stone-500 cursor-not-allowed focus:outline-none" />
                </div>
                <div className="col-span-1 lg:col-span-1">
                  <label className="lg:hidden block text-xs font-semibold text-stone-500 mb-1">{tH.Touch}</label>
                  <input id="inputTouch" type="number" value={inputTouch} onChange={e => setInputTouch(e.target.value)} onBlur={e => e.target.value && setInputTouch(Number(Number(e.target.value).toFixed(2)).toString())} onKeyDown={(e) => focusNext(e, 'inputSilver')} placeholder="0" className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white" />
                </div>
                <div className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-1 relative">
                  <label className="lg:hidden block text-xs font-semibold text-stone-500 mb-1">{tH.Silver}</label>
                  {originalSilver && (
                    <div className="absolute -top-6 right-0 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shadow-sm whitespace-nowrap z-10">
                      Round off (Orig: {originalSilver})
                    </div>
                  )}
                  <input id="inputSilver" type="number" value={inputSilver} onChange={e => { setInputSilver(e.target.value); setOriginalSilver(""); }} onKeyDown={(e) => focusNext(e, 'btnAddItem')} placeholder="0" className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white" />
                </div>
                <div className="col-span-2 sm:col-span-1 md:col-span-1 lg:col-span-1 mt-2 lg:mt-0 flex gap-2 w-full lg:w-auto shrink-0">
                  <button
                    id="btnAddItem"
                    onClick={handleAddItem}
                    className="h-[38px] flex-1 lg:w-10 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                    title="Add Item"
                  >
                    <span className="lg:hidden mr-2 font-medium">Add Item</span>
                    <Plus className="h-5 w-5" />
                  </button>
                  <button
                    onClick={clearItemInputs}
                    className="h-[38px] flex-[0.3] lg:w-10 flex items-center justify-center bg-stone-200 hover:bg-stone-300 text-stone-600 rounded-lg transition-colors"
                    title="Clear Inputs"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Render Added Items */}
              <div className="mt-4 border-t border-stone-100 pt-2 space-y-3 lg:space-y-1">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-[3fr_0.8fr_1.2fr_1.8fr_1.2fr_0.8fr_1.2fr_0.8fr_1.2fr_auto] gap-3 lg:gap-3 items-center p-4 lg:p-2 rounded-xl bg-white border border-stone-200 lg:border-stone-100 hover:border-amber-200 hover:shadow-sm transition-all relative">
                    <div className="col-span-2 sm:col-span-4 md:col-span-6 lg:col-span-1 pb-2 lg:pb-0 border-b lg:border-b-0 border-stone-100">
                      <div className="text-sm font-bold text-stone-900 px-0 lg:px-3 truncate">{item.name}</div>
                    </div>

                    <div className="col-span-1 lg:col-span-1 flex flex-col lg:block px-0 lg:px-3">
                      <span className="lg:hidden text-[10px] text-stone-400 font-bold uppercase tracking-normal">{tH.Pcs}</span>
                      <div className="text-sm text-stone-600">{item.pcs}</div>
                    </div>
                    <div className="col-span-1 lg:col-span-1 flex flex-col lg:block px-0 lg:px-3">
                      <span className="lg:hidden text-[10px] text-stone-400 font-bold uppercase tracking-normal">{tH.LbrRate}</span>
                      <div className="text-sm text-stone-600">{item.lbrrate}</div>
                    </div>
                    <div className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-1 flex flex-col lg:block px-0 lg:px-3">
                      <span className="lg:hidden text-[10px] text-stone-400 font-bold uppercase tracking-normal">{tH.LbrAmount}</span>
                      <div className="text-sm font-bold text-stone-900">{item.lbramt}</div>
                    </div>
                    <div className="col-span-1 lg:col-span-1 flex flex-col lg:block px-0 lg:px-3">
                      <span className="lg:hidden text-[10px] text-stone-400 font-bold uppercase tracking-normal">{tH.GrWt}</span>
                      <div className="text-sm text-stone-600">{item.grwt}</div>
                    </div>
                    <div className="col-span-1 lg:col-span-1 flex flex-col lg:block px-0 lg:px-3">
                      <span className="lg:hidden text-[10px] text-stone-400 font-bold uppercase tracking-normal">{tH.LessWt}</span>
                      <div className="text-sm text-stone-600">{item.lesswt}</div>
                    </div>
                    <div className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-1 flex flex-col lg:block px-0 lg:px-3">
                      <span className="lg:hidden text-[10px] text-stone-400 font-bold uppercase tracking-normal">{tH.NetWt}</span>
                      <div className="text-sm text-stone-600">{item.netwt}</div>
                    </div>
                    <div className="col-span-1 lg:col-span-1 flex flex-col lg:block px-0 lg:px-3">
                      <span className="lg:hidden text-[10px] text-stone-400 font-bold uppercase tracking-normal">{tH.Touch}</span>
                      <div className="text-sm text-stone-600">{item.touch}</div>
                    </div>
                    <div className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-1 flex flex-col lg:block px-0 lg:px-3">
                      <span className="lg:hidden text-[10px] text-stone-400 font-bold uppercase tracking-normal">{tH.Silver}</span>
                      <div className="text-sm text-stone-600">{item.silver}</div>
                    </div>

                    <div className="col-span-2 sm:col-span-1 md:col-span-1 lg:col-span-1 flex items-center justify-end gap-2 lg:gap-1 mt-2 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100 pr-0 lg:pr-2">
                      <button
                        onClick={() => handleEditItem(idx)}
                        className="h-8 w-8 flex items-center justify-center text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors shrink-0"
                        title="Edit Item"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        className="h-8 w-8 flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                        title="Delete Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Current Totals Display */}
              {items.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50/50 border border-amber-100 flex flex-col sm:flex-row justify-end gap-8">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-stone-600">Total Amount:</span>
                    <span className="text-lg font-bold text-amber-600">₹{currentTotalAmount}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-stone-600">Total Fine:</span>
                    <span className="text-lg font-bold text-amber-600">{currentTotalFine}</span>
                  </div>
                </div>
              )}

              {/* Outstanding Balances inside Items card */}
              <div className="mt-8 pt-6 border-t border-stone-200">
                <h3 className="text-sm font-bold text-stone-900 mb-4">Outstanding Balances</h3>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={previousAmount}
                      onChange={(e) => setPreviousAmount(e.target.value)}
                      readOnly
                      disabled
                      placeholder="0.00"
                      className="block w-full sm:w-48 px-4 py-3 sm:text-sm border border-stone-200 rounded-xl bg-stone-100 text-stone-500 cursor-not-allowed transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">
                      Outstanding Fine (g)
                    </label>
                    <input
                      type="number"
                      value={previousSilver}
                      onChange={(e) => setPreviousSilver(e.target.value)}
                      readOnly
                      disabled
                      placeholder="0.000"
                      className="block w-full sm:w-48 px-4 py-3 sm:text-sm border border-stone-200 rounded-xl bg-stone-100 text-stone-500 cursor-not-allowed transition-all font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <button
              onClick={handlePreviewCurrentBill}
              className="px-8 py-3.5 text-base font-extrabold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all shadow-sm focus:ring-4 focus:ring-stone-50"
            >
              View
            </button>
            <button
              onClick={handleSubmitBill}
              className="px-8 py-3.5 text-base font-extrabold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-stone-200"
            >
              {editBillId ? "Update Bill" : "Submit"}
            </button>
          </div>
        </>
      )}


      {/* Manage Settings Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl min-h-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50 shrink-0">
              <h3 className="text-xl font-bold text-stone-900">
                Manage Settings
              </h3>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              {/* Radio Button Row */}
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-stone-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="setting_type"
                    checked={manageModalView === "bill"}
                    onChange={() => setManageModalView("bill")}
                    className="w-5 h-5 text-amber-600 border-stone-300 focus:ring-amber-500 transition-colors"
                  />
                  <span className={`font-semibold text-base transition-colors ${manageModalView === "bill" ? "text-stone-900" : "text-stone-500 group-hover:text-stone-700"}`}>
                    Bill Setting
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="setting_type"
                    checked={manageModalView === "bill_number"}
                    onChange={() => setManageModalView("bill_number")}
                    className="w-5 h-5 text-amber-600 border-stone-300 focus:ring-amber-500 transition-colors"
                  />
                  <span className={`font-semibold text-base transition-colors ${manageModalView === "bill_number" ? "text-stone-900" : "text-stone-500 group-hover:text-stone-700"}`}>
                    Bill Number
                  </span>
                </label>
              </div>

              {manageModalView === "bill" && (
                <div className="flex-1 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-stone-900">Item Name</label>
                        <button
                          onClick={() => setIsInnerManageOpen(true)}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Manage
                        </button>
                      </div>
                      <SearchableSelect
                        options={savedItemsList}
                        value={formItemName}
                        onChange={setFormItemName}
                        onAdd={async (val) => {
                          const next = [...savedItemsList, val];
                          setSavedItemsList(next);
                          await updateSettings({ itemsList: next });
                        }}
                        placeholder="Select or add item name"
                      />
                    </div>
                  </div>

                  <div className="mt-auto flex justify-end gap-3 pt-4 border-t border-stone-100">
                    <button
                      onClick={() => setIsManageModalOpen(false)}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors shadow-sm"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}

              {manageModalView === "bill_number" && (
                <div className="flex-1 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-stone-900 mb-2">Starting Bill Number</label>
                      <input
                        type="text"
                        value={billNumber}
                        onChange={(e) => setBillNumber(e.target.value)}
                        placeholder="Enter starting bill number"
                        className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50"
                      />
                    </div>
                  </div>

                  <div className="mt-auto flex justify-end gap-3 pt-4 border-t border-stone-100">
                    <button
                      onClick={async () => {
                        await updateSettings({ startingBillNumber: billNumber });
                        setIsManageModalOpen(false);
                      }}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors shadow-sm"
                    >
                      <Settings2 className="w-4 h-4" />
                      Save Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nested Manage Modal for Items */}
      {isInnerManageOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50 shrink-0">
              <h3 className="text-xl font-bold text-stone-900">Manage Item Names</h3>
              <button
                onClick={() => setIsInnerManageOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={innerInputValue}
                  onChange={e => setInnerInputValue(e.target.value)}
                  placeholder="Type new item name..."
                  className="flex-1 px-4 py-2.5 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && innerInputValue.trim()) {
                      e.preventDefault();
                      const next = Array.from(new Set([...savedItemsList, innerInputValue.trim()]));
                      setSavedItemsList(next);
                      await updateSettings({ itemsList: next });
                      setFormItemName(innerInputValue.trim());
                      setInnerInputValue("");
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    if (innerInputValue.trim()) {
                      const next = Array.from(new Set([...savedItemsList, innerInputValue.trim()]));
                      setSavedItemsList(next);
                      await updateSettings({ itemsList: next });
                      setFormItemName(innerInputValue.trim());
                      setInnerInputValue("");
                    }
                  }}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors shadow-sm shrink-0"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {savedItemsList.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-stone-100 bg-stone-50/50 group hover:bg-stone-50 transition-colors">
                    <span className="text-sm font-medium text-stone-700">{item}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={async () => {
                          setInnerInputValue(item);
                          const next = savedItemsList.filter(i => i !== item);
                          setSavedItemsList(next);
                          await updateSettings({ itemsList: next });
                        }}
                        className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          const next = savedItemsList.filter(i => i !== item);
                          setSavedItemsList(next);
                          await updateSettings({ itemsList: next });
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {savedItemsList.length === 0 && (
                  <div className="text-center py-8 text-sm text-stone-500">
                    No items saved yet. Add one above!
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-stone-100 bg-stone-50/50 shrink-0 flex justify-end">
              <button
                onClick={() => setIsInnerManageOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-stone-700 bg-stone-200 hover:bg-stone-300 rounded-xl transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreviewModalOpen && previewUrl && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50/50 shrink-0">
              <h3 className="text-xl font-bold text-stone-900">
                Bill Preview
              </h3>
              <button
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  setPreviewUrl(null);
                }}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 w-full h-full bg-stone-100">
              <iframe
                src={previewUrl}
                className="w-full h-full border-none"
                title="Bill Preview"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
