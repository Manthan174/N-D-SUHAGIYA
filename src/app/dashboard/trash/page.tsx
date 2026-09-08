"use client";

import { useState, useEffect } from "react";
import { Trash2, RefreshCcw, AlertTriangle, Trash } from "lucide-react";
import { subscribeToTrash, deleteFromTrashDB, hideFromUserTrashDB, addBillToDB, addPartyToDB, addCollectionToDB } from "@/lib/db";

type TrashRecord = {
  id: string;
  type: 'bill' | 'party' | 'collection';
  deletedAt: string;
  data: any;
};

export default function TrashPage() {
  const [trashItems, setTrashItems] = useState<TrashRecord[]>([]);

  useEffect(() => {
    const unsubTrash = subscribeToTrash((data) => {
      const sorted = data.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
      setTrashItems(sorted);
    });

    return () => unsubTrash();
  }, []);

  const handleRestore = async (item: TrashRecord) => {
    if (!confirm("Are you sure you want to restore this item?")) return;

    try {
      if (item.type === 'bill') await addBillToDB(item.data);
      else if (item.type === 'party') await addPartyToDB(item.data);
      else if (item.type === 'collection') await addCollectionToDB(item.data);

      await deleteFromTrashDB(item.id);
    } catch (e) {
      console.error("Error restoring item", e);
      alert("Failed to restore item.");
    }
  };

  const handleDeleteForever = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this item? This action cannot be undone.")) return;

    await hideFromUserTrashDB(id);
  };

  const handleEmptyTrash = async () => {
    if (!confirm("Are you sure you want to empty the trash? ALL items will be permanently deleted!")) return;

    for (const item of trashItems) {
      await hideFromUserTrashDB(item.id);
    }
  };

  const getDetailsText = (item: TrashRecord) => {
    if (item.type === 'bill') {
      return `Bill No: ${item.data.billNumber || '-'} | Party: ${item.data.partyName}`;
    } else if (item.type === 'party') {
      return `Party Name: ${item.data.name}`;
    } else if (item.type === 'collection') {
      return `Collection: ₹${item.data.amount} / ${item.data.silverKg}g | Party: ${item.data.partyName}`;
    }
    return "Unknown data";
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-3">
            <Trash className="w-8 h-8 text-stone-400" />
            Trash
          </h1>
          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            View and restore deleted bills, parties, and collection records. Items here can be restored or permanently deleted.
          </p>
        </div>
        {trashItems.length > 0 && (
          <div className="shrink-0">
            <button
              onClick={handleEmptyTrash}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors shadow-sm border border-red-200"
            >
              <Trash2 className="w-4 h-4" />
              Empty Trash
            </button>
          </div>
        )}
      </div>

      {/* Trash Items Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-hidden sm:overflow-x-auto">
          <table className="w-full text-left border-collapse border-none sm:border border-stone-200 block sm:table">
            <thead className="hidden sm:table-header-group">
              <tr className="bg-stone-50/80">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 w-24">Date Deleted</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200 w-32">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider border border-stone-200">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right border border-stone-200 w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {trashItems.map((item) => (
                <tr key={item.id} className="block sm:table-row bg-white hover:bg-stone-50/50 transition-colors border-b-8 sm:border-b-0 border-stone-100 sm:border border-stone-200 p-4 sm:p-0 relative">
                  <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-stone-600 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200 sm:whitespace-nowrap">
                    <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Date Deleted</span>
                    {new Date(item.deletedAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="flex sm:table-cell justify-between items-center px-2 py-2 sm:px-6 sm:py-4 text-sm border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                    <span className="sm:hidden text-xs font-bold text-stone-400 uppercase">Type</span>
                    <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                      {item.type}
                    </span>
                  </td>
                  <td className="flex sm:table-cell justify-between items-start sm:items-center px-2 py-2 sm:px-6 sm:py-4 text-sm font-medium text-stone-900 border-b border-dashed border-stone-200 sm:border-solid sm:border-stone-200">
                    <span className="sm:hidden text-xs font-bold text-stone-400 uppercase mr-4 mt-1">Details</span>
                    <span className="text-right sm:text-left break-all sm:break-normal">{getDetailsText(item)}</span>
                  </td>
                  <td className="flex sm:table-cell justify-end sm:justify-center items-center px-2 py-3 sm:px-6 sm:py-4 text-sm text-right border-none sm:border-solid sm:border border-stone-200 bg-stone-50/50 sm:bg-transparent mt-2 sm:mt-0 rounded-lg sm:rounded-none">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        title="Restore"
                        onClick={() => handleRestore(item)}
                        className="p-2 text-emerald-500 sm:text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 font-semibold bg-white sm:bg-transparent shadow-sm sm:shadow-none border border-stone-200 sm:border-none"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        <span className="inline text-xs">Restore</span>
                      </button>
                      <button
                        title="Delete Forever"
                        onClick={() => handleDeleteForever(item.id)}
                        className="p-2 text-red-500 sm:text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-semibold bg-white sm:bg-transparent shadow-sm sm:shadow-none border border-stone-200 sm:border-none"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="inline text-xs">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {trashItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-stone-400">
                      <Trash className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg font-medium text-stone-500">Trash is empty</p>
                      <p className="text-sm mt-1">Deleted items will appear here.</p>
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
