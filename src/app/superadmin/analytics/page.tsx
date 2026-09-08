"use client";

import { useState, useEffect } from "react";
import { superAdminFirestore } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, limit, startAfter } from "firebase/firestore";
import { Activity, Search, Loader2, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export default function AnalyticsPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const pageSize = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastDocs, setLastDocs] = useState<any[]>([null]);

  const loadPageData = async (page: number) => {
    setLoading(true);
    try {
      const lastDoc = lastDocs[page - 1] || null;
      let q = query(
        collection(superAdminFirestore, "login_history"),
        orderBy("timestamp", "desc"),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setHistory(data);
      setHasMore(snapshot.docs.length === pageSize);

      if (snapshot.docs.length === pageSize) {
        const newLastDocs = [...lastDocs];
        newLastDocs[page] = snapshot.docs[snapshot.docs.length - 1];
        setLastDocs(newLastDocs);
      }
    } catch (error) {
      console.error("Error fetching login history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData(1);
  }, []);

  const handleNextPage = () => {
    if (hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadPageData(nextPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      loadPageData(prevPage);
    }
  };

  const filteredHistory = history.filter(item => 
    item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-amber-600" />
            User Analytics
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Monitor user login activity and sessions across the platform.
          </p>
        </div>
        
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-medium">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Login Time</th>
                <th className="px-6 py-4">Login Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                    <p className="text-stone-500 mt-2">Loading analytics data...</p>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-6 h-6 text-stone-400" />
                    </div>
                    <p className="text-stone-900 font-medium">No login history found</p>
                    <p className="text-stone-500 mt-1">Users logging in will appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const date = new Date(item.timestamp);
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-stone-900">{item.name || "Unknown"}</div>
                        <div className="text-xs text-stone-400 mt-0.5 font-mono">{item.userId}</div>
                      </td>
                      <td className="px-6 py-4 text-stone-600">
                        {item.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-medium text-xs">
                          {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-stone-600">
                          <Calendar className="w-4 h-4 text-stone-400" />
                          {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && (
          <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-between">
            <p className="text-sm text-stone-500">
              Page <span className="font-bold text-stone-900">{currentPage}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-semibold">Prev</span>
              </button>
              <button
                onClick={handleNextPage}
                disabled={!hasMore}
                className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors flex items-center gap-1"
              >
                <span className="text-sm font-semibold">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
