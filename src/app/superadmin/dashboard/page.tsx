"use client";

import { Users, CreditCard, Clock, Activity, X, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { superAdminFirestore as firestore } from "@/lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function SuperAdminDashboard() {
  const [showPopup, setShowPopup] = useState(false);
  const [recentTrials, setRecentTrials] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, activeSubs: 0, trials: 0 });
  const [growthData, setGrowthData] = useState<any[]>([]);

  const handleClosePopup = () => {
    if (recentTrials.length > 0) {
      const maxTime = Math.max(
        ...recentTrials.map(u => u.createdAt?.toDate ? u.createdAt.toDate().getTime() : (u.createdAt ? new Date(u.createdAt).getTime() : 0))
      );
      const currentLastSeen = localStorage.getItem("lastSeenTrialTimestamp");
      const newTime = currentLastSeen ? Math.max(parseInt(currentLastSeen, 10), maxTime) : maxTime;
      localStorage.setItem("lastSeenTrialTimestamp", newTime.toString());
    }
    setShowPopup(false);
  };

  useEffect(() => {
    // Fetch recent trial users
    const q = query(collection(firestore, "trial_users"), orderBy("createdAt", "desc"), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      const lastSeenStr = localStorage.getItem("lastSeenTrialTimestamp");
      const lastSeenTime = lastSeenStr ? parseInt(lastSeenStr, 10) : 0;
      
      // Filter for only users created AFTER the last seen timestamp
      const newUsers = usersList.filter(u => {
        const time = u.createdAt?.toDate ? u.createdAt.toDate().getTime() : (u.createdAt ? new Date(u.createdAt).getTime() : 0);
        return time > lastSeenTime;
      });

      if (newUsers.length > 0) {
        setRecentTrials(newUsers);
        setShowPopup(true);
      }
    }, (error) => {
      console.error("Error fetching recent trials:", error);
    });

    const allUsersQ = query(collection(firestore, "users"));
    const unsubAll = onSnapshot(allUsersQ, (snapshot) => {
      let total = 0;
      let activeSubs = 0;
      let trialsCount = 0;
      
      const monthCounts: Record<string, number> = {};
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = d.toLocaleString('default', { month: 'short' });
        monthCounts[monthKey] = 0;
      }

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        total++;
        if (data.subscriptionExpiresAt) activeSubs++;
        if (data.trialExpiresAt) trialsCount++;
        
        if (data.createdAt) {
          try {
            const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            const monthKey = date.toLocaleString('default', { month: 'short' });
            if (monthCounts[monthKey] !== undefined) {
              monthCounts[monthKey]++;
            }
          } catch (e) {}
        }
      });
      
      setStats({ total, activeSubs, trials: trialsCount });
      
      const chartData = Object.keys(monthCounts).map(key => ({
        name: key,
        users: monthCounts[key]
      }));
      setGrowthData(chartData);
    });

    return () => {
      unsub();
      unsubAll();
    };
  }, []);

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Super Admin Dashboard
          </h1>
          <p className="text-sm font-medium text-stone-500">
            Overview of the system and your clients.
          </p>
        </div>
        <Link 
          href="/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          View Website
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Total Clients</p>
              <h2 className="text-2xl font-extrabold text-stone-900">{stats.total}</h2>
            </div>
          </div>
          <Link href="/superadmin/clients/subscription" className="text-sm font-bold text-amber-600 hover:text-amber-700 mt-2">
            View All Clients &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Active Subs</p>
              <h2 className="text-2xl font-extrabold text-stone-900">{stats.activeSubs}</h2>
            </div>
          </div>
          <Link href="/superadmin/clients/subscription" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 mt-2">
            Manage Subscriptions &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Trial Accounts</p>
              <h2 className="text-2xl font-extrabold text-stone-900">{stats.trials}</h2>
            </div>
          </div>
          <Link href="/superadmin/clients/trial" className="text-sm font-bold text-blue-600 hover:text-blue-700 mt-2">
            View Trials &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">System Health</p>
              <h2 className="text-xl font-extrabold text-stone-900 mt-1">Operational</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
        <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-500" />
          Client Growth (Last 6 Months)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growthData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} />
              <Tooltip 
                cursor={{ fill: '#f5f5f4' }} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              />
              <Bar dataKey="users" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trial Users Notification Popup */}
      {showPopup && recentTrials.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-extrabold text-stone-900">Recent Trial Registrations</h2>
              </div>
              <button 
                onClick={handleClosePopup}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {recentTrials.map((user) => (
                  <div key={user.id} className="p-4 rounded-2xl border border-stone-100 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-stone-900">{user.businessName || "Unknown Business"}</h3>
                      <p className="text-sm text-stone-500 mt-1">{user.ownerName || "Unknown Owner"} • {user.phone}</p>
                      {user.city && <p className="text-xs text-stone-400 mt-1">{user.city}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Trial
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex justify-end">
              <Link
                href="/superadmin/clients/trial"
                onClick={handleClosePopup}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                View All Trial Users
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
