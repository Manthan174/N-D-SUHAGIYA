"use client";

import { useEffect, useState } from "react";
import { Loader2, X, Users, CreditCard, Wallet, TrendingUp, IndianRupee } from "lucide-react";
import { superAdminFirestore } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface UserStatsModalProps {
  userId: string;
  shopName: string;
  onClose: () => void;
}

export default function UserStatsModal({ userId, shopName, onClose }: UserStatsModalProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalParties: 0,
    totalBills: 0,
    totalAmount: 0,
    collectedAmount: 0,
    outstandingAmount: 0,
    totalFine: 0,
    collectedFine: 0,
    outstandingFine: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const partiesQ = query(collection(superAdminFirestore, "parties"), where("userId", "==", userId));
        const billsQ = query(collection(superAdminFirestore, "bills"), where("userId", "==", userId));
        const collsQ = query(collection(superAdminFirestore, "collections"), where("userId", "==", userId));

        const [partiesSnap, billsSnap, collsSnap] = await Promise.all([
          getDocs(partiesQ),
          getDocs(billsQ),
          getDocs(collsQ)
        ]);

        let totalAmt = 0;
        let totalSilver = 0;

        partiesSnap.forEach(doc => {
          const party = doc.data();
          totalAmt += parseFloat(party.previousAmount || "0");
          totalSilver += parseFloat(party.previousFine || "0");
        });

        billsSnap.forEach(doc => {
          const bill = doc.data();
          const bAmt = bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.lbramt) || 0), 0) || 0;
          const bFine = bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.silver) || 0), 0) || 0;
          totalAmt += bAmt;
          totalSilver += bFine;
        });

        let collectedAmt = 0;
        let collectedSilver = 0;

        collsSnap.forEach(doc => {
          const coll = doc.data();
          collectedAmt += parseFloat(coll.amount || "0");
          collectedSilver += parseFloat(coll.silverKg || "0");
        });

        setStats({
          totalParties: partiesSnap.size,
          totalBills: billsSnap.size,
          totalAmount: totalAmt,
          collectedAmount: collectedAmt,
          outstandingAmount: totalAmt - collectedAmt,
          totalFine: totalSilver,
          collectedFine: collectedSilver,
          outstandingFine: totalSilver - collectedSilver
        });
      } catch (err) {
        console.error("Error fetching user stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: any) => (
    <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-xl font-black text-stone-900">{value}</p>
        {subtitle && <p className="text-xs text-stone-400 font-medium mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div>
            <h2 className="text-xl font-black text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-amber-500" />
              User Statistics
            </h2>
            <p className="text-sm font-medium text-stone-500 mt-1">Viewing analytics for <span className="text-amber-600 font-bold">{shopName}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-sm font-bold text-stone-500">Calculating financial data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Activity Overview */}
              <div>
                <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest mb-3">Activity Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard 
                    title="Total Parties" 
                    value={stats.totalParties.toString()} 
                    icon={Users} 
                    colorClass="bg-blue-100 text-blue-600"
                  />
                  <StatCard 
                    title="Total Bills Generated" 
                    value={stats.totalBills.toString()} 
                    icon={CreditCard} 
                    colorClass="bg-purple-100 text-purple-600"
                  />
                </div>
              </div>

              <div className="h-px bg-stone-100 w-full" />

              {/* Financial Summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Cash Amounts */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-500" />
                    Amount (₹)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-sm font-semibold text-stone-600">Total Amount Generated</span>
                      <span className="text-sm font-black text-stone-900">₹{stats.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-sm font-semibold text-emerald-700">Total Amount Collected</span>
                      <span className="text-sm font-black text-emerald-700">₹{stats.collectedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50 border border-rose-100">
                      <span className="text-sm font-semibold text-rose-700">Total Outstanding Amount</span>
                      <span className="text-sm font-black text-rose-700">₹{stats.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Fine (Silver) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-500" />
                    Fine (Silver)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-sm font-semibold text-stone-600">Total Fine Generated</span>
                      <span className="text-sm font-black text-stone-900">{stats.totalFine.toLocaleString('en-IN', { minimumFractionDigits: 3 })}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-sm font-semibold text-emerald-700">Total Fine Collected</span>
                      <span className="text-sm font-black text-emerald-700">{stats.collectedFine.toLocaleString('en-IN', { minimumFractionDigits: 3 })}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50 border border-rose-100">
                      <span className="text-sm font-semibold text-rose-700">Total Outstanding Fine</span>
                      <span className="text-sm font-black text-rose-700">{stats.outstandingFine.toLocaleString('en-IN', { minimumFractionDigits: 3 })}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-stone-900 text-white text-sm font-bold rounded-xl hover:bg-stone-800 transition-colors"
          >
            Close Overview
          </button>
        </div>

      </div>
    </div>
  );
}
