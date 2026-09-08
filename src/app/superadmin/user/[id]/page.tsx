"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Users, CreditCard, Wallet, TrendingUp, IndianRupee, Store, Phone, Mail, Calendar, Shield, Activity } from "lucide-react";
import { superAdminFirestore } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export default function SuperAdminUserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
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
    if (!userId) return;

    const fetchAllData = async () => {
      try {
        // Fetch user data from both collections just in case
        let userDocSnap = await getDoc(doc(superAdminFirestore, "users", userId));
        if (!userDocSnap.exists()) {
          userDocSnap = await getDoc(doc(superAdminFirestore, "trial_users", userId));
        }
        
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        }

        // Fetch stats
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
        console.error("Error fetching user details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-8">
        <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200">
          User not found.
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: any) => (
    <div className="bg-white border border-stone-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-black text-stone-900">{value}</p>
        {subtitle && <p className="text-xs text-stone-400 font-medium mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
            <Store className="w-7 h-7 text-amber-500" />
            {userData.shopName || "Unknown Shop"}
          </h1>
          <p className="text-sm text-stone-500 font-medium mt-1 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${userData.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${userData.isActive !== false ? 'bg-emerald-500' : 'bg-stone-400'}`}></div>
              {userData.isActive !== false ? 'Active Account' : 'Disabled'}
            </span>
            {userData.trialExpiresAt && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600">
                Trial User
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: User Profile Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Users className="w-4 h-4 text-stone-400" />
              Owner Details
            </h3>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Full Name</p>
                <p className="text-sm font-semibold text-stone-900">{userData.name || "-"}</p>
              </div>
              <div className="h-px bg-stone-100 w-full" />
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Email Address</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-stone-400" />
                  <p className="text-sm font-semibold text-stone-900">{userData.emailId || userData.email || "-"}</p>
                </div>
              </div>
              <div className="h-px bg-stone-100 w-full" />
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Mobile Number</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-stone-400" />
                  <p className="text-sm font-semibold text-stone-900">{userData.mobile || "-"}</p>
                </div>
              </div>
              <div className="h-px bg-stone-100 w-full" />
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Registration Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <p className="text-sm font-semibold text-stone-900">
                    {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric"
                    }) : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-stone-900 to-black rounded-3xl p-6 border border-stone-800 shadow-lg text-white">
            <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-amber-500" />
              System Usage
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Parties</p>
                <p className="text-2xl font-black text-amber-400">{stats.totalParties}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Bills</p>
                <p className="text-2xl font-black text-amber-400">{stats.totalBills}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Summaries */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest flex items-center gap-2 mb-6">
              <IndianRupee className="w-4 h-4 text-emerald-500" />
              Amount Summary (₹)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard 
                title="Total Generated" 
                value={`₹${stats.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
                icon={TrendingUp} 
                colorClass="bg-stone-100 text-stone-600"
              />
              <StatCard 
                title="Total Collected" 
                value={`₹${stats.collectedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
                icon={IndianRupee} 
                colorClass="bg-emerald-100 text-emerald-600"
              />
              <StatCard 
                title="Outstanding" 
                value={`₹${stats.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
                icon={Wallet} 
                colorClass="bg-rose-100 text-rose-600"
              />
            </div>

            <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-1000" 
                style={{ width: `${stats.totalAmount > 0 ? (stats.collectedAmount / stats.totalAmount) * 100 : 0}%` }}
              ></div>
              <div 
                className="bg-rose-500 h-full transition-all duration-1000" 
                style={{ width: `${stats.totalAmount > 0 ? (stats.outstandingAmount / stats.totalAmount) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-xs font-bold text-emerald-600">{stats.totalAmount > 0 ? ((stats.collectedAmount / stats.totalAmount) * 100).toFixed(1) : 0}% Collected</span>
              <span className="text-xs font-bold text-rose-600">{stats.totalAmount > 0 ? ((stats.outstandingAmount / stats.totalAmount) * 100).toFixed(1) : 0}% Outstanding</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Wallet className="w-4 h-4 text-amber-500" />
              Fine (Silver) Summary
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard 
                title="Total Generated" 
                value={Math.round(stats.totalFine).toLocaleString('en-IN')} 
                icon={TrendingUp} 
                colorClass="bg-stone-100 text-stone-600"
              />
              <StatCard 
                title="Total Collected" 
                value={Math.round(stats.collectedFine).toLocaleString('en-IN')} 
                icon={IndianRupee} 
                colorClass="bg-emerald-100 text-emerald-600"
              />
              <StatCard 
                title="Outstanding" 
                value={Math.round(stats.outstandingFine).toLocaleString('en-IN')} 
                icon={Wallet} 
                colorClass="bg-rose-100 text-rose-600"
              />
            </div>

            <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden flex">
              <div 
                className="bg-amber-400 h-full transition-all duration-1000" 
                style={{ width: `${stats.totalFine > 0 ? (stats.collectedFine / stats.totalFine) * 100 : 0}%` }}
              ></div>
              <div 
                className="bg-rose-500 h-full transition-all duration-1000" 
                style={{ width: `${stats.totalFine > 0 ? (stats.outstandingFine / stats.totalFine) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-xs font-bold text-amber-600">{stats.totalFine > 0 ? ((stats.collectedFine / stats.totalFine) * 100).toFixed(1) : 0}% Collected</span>
              <span className="text-xs font-bold text-rose-600">{stats.totalFine > 0 ? ((stats.outstandingFine / stats.totalFine) * 100).toFixed(1) : 0}% Outstanding</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
