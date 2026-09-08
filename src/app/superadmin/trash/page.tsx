"use client";

import { useState, useEffect } from "react";
import { Trash2, Search, Filter, Loader2, ArrowLeft, RefreshCw, Eye } from "lucide-react";
import { superAdminFirestore } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, getDocs, deleteDoc, doc, limit } from "firebase/firestore";
import Link from "next/link";

type TrashItem = {
  id: string;
  type: string;
  userId: string;
  deletedAt: string;
  originalId: string;
  data: any;
};

export default function SuperAdminTrashPage() {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [viewItem, setViewItem] = useState<TrashItem | null>(null);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = () => {
    setLoading(true);
    // Notice: we are querying the root 'trash' collection which holds trash from all users
    const trashQuery = query(collection(superAdminFirestore, 'trash'), orderBy('deletedAt', 'desc'), limit(500));
    
    const unsubscribe = onSnapshot(trashQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TrashItem[];
      setTrashItems(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching trash:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const handleEmptyTrash = async () => {
    const confirm = window.confirm("Are you sure you want to empty all trash? This action cannot be undone.");
    if (!confirm) return;

    try {
      // In a real production app, deleting all documents should ideally be done via a Cloud Function.
      // Doing it from the client like this is fine for smaller collections.
      const querySnapshot = await getDocs(collection(superAdminFirestore, 'trash'));
      
      const deletePromises = querySnapshot.docs.map(document => 
        deleteDoc(doc(superAdminFirestore, 'trash', document.id))
      );
      
      await Promise.all(deletePromises);
      alert("Trash emptied successfully.");
    } catch (error) {
      console.error("Error emptying trash:", error);
      alert("Failed to empty trash.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    const confirm = window.confirm("Are you sure you want to permanently delete this item?");
    if (!confirm) return;

    try {
      await deleteDoc(doc(superAdminFirestore, 'trash', id));
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item.");
    }
  };

  const filteredTrash = trashItems.filter(item => {
    const matchesSearch = 
      item.userId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(item.data).toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = filterType === "all" || item.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getTypes = () => {
    const types = new Set(trashItems.map(item => item.type));
    return Array.from(types);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-amber-600" />
            System Trash
          </h1>
          <p className="text-sm font-medium text-stone-500 mt-1">
            View and manage deleted data across all user accounts.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchTrash}
            className="p-2 text-stone-500 hover:text-stone-900 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={handleEmptyTrash}
            disabled={trashItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Empty Trash
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input 
              type="text"
              placeholder="Search by User ID, type, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="all">All Types</option>
              {getTypes().map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
            <p className="text-sm font-medium text-stone-500">Loading trash data...</p>
          </div>
        ) : filteredTrash.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Trash is empty</h3>
            <p className="text-sm text-stone-500 mt-1 max-w-sm">
              No deleted items found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider text-xs">Date Deleted</th>
                  <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider text-xs">Type</th>
                  <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider text-xs">User ID</th>
                  <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider text-xs">Details</th>
                  <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTrash.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-stone-900">
                        {new Date(item.deletedAt).toLocaleDateString('en-IN')}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {new Date(item.deletedAt).toLocaleTimeString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2 items-start">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-stone-100 text-stone-700 border border-stone-200">
                          {item.type}
                        </span>
                        {(item as any).permanentlyDeleted && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                            User Deleted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-stone-100 px-2 py-1 rounded text-stone-600">
                        {item.userId?.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-stone-600 truncate max-w-[200px] lg:max-w-[300px]">
                        {item.type === 'bill' && item.data.partyName ? `Bill for ${item.data.partyName} (${item.data.billNumber || 'N/A'})` :
                         item.type === 'party' ? `Party: ${item.data.name}` :
                         item.type === 'collection' ? `Collection from ${item.data.partyName} (₹${item.data.amount})` :
                         `ID: ${item.originalId || 'Unknown'}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewItem(item)}
                          className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="View Data"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Permanently Delete"
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

      {/* JSON Viewer Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50 shrink-0">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-600" />
                Raw Data View: {viewItem.type}
              </h3>
              <button
                onClick={() => setViewItem(null)}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-stone-900 text-stone-100 font-mono text-sm">
              <pre>{JSON.stringify(viewItem.data, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
