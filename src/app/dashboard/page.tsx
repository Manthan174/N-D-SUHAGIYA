"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { auth, db } from "@/lib/firebase";
import { ref, get, onValue } from "firebase/database";
import { subscribeToParties, subscribeToBills, subscribeToCollections, subscribeToFinances, subscribeToManufacturerPayments, getTargetUserId } from "@/lib/db";
import {
  Loader2, CheckCircle2, ShoppingCart, ShieldCheck, Mail, Phone, Fingerprint,
  Gem, ArrowRight, CreditCard, Users, Wallet, Clock, Settings, TrendingUp,
  TrendingDown, ArrowUpRight, ArrowDownRight, BarChart3, PieChart,
  CalendarDays, Sparkles, IndianRupee, Receipt, Scale
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Area, AreaChart, Legend
} from "recharts";

function DashboardContent() {
  const { t } = useLanguage();
  const [userData, setUserData] = useState<any>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [toastMessage, setToastMessage] = useState("");

  const [stats, setStats] = useState({
    totalAmount: 0,
    collectedAmount: 0,
    outstandingAmount: 0,
    totalFine: 0,
    collectedFine: 0,
    outstandingFine: 0,
  });

  const [financeStats, setFinanceStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    profit: 0,
    totalFineIncome: 0,
    totalFineExpense: 0,
    fineProfit: 0,
    recentTransactions: [] as any[],
  });

  const [rawFinanceData, setRawFinanceData] = useState<any[]>([]);

  useEffect(() => {
    const msg = searchParams.get("toast");
    if (msg) {
      setToastMessage(msg);
      const timer = setTimeout(() => setToastMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    let partiesList: any[] = [];
    let billHistory: any[] = [];
    let collectedHistory: any[] = [];

    const calculateStats = () => {
      let totalAmt = 0;
      let totalSilver = 0;

      // Add previous amounts from parties
      partiesList.forEach((party: any) => {
        totalAmt += parseFloat(party.previousAmount || "0");
        totalSilver += parseFloat(party.previousFine || "0");
      });

      // Add bill amounts
      billHistory.forEach((bill: any) => {
        const bAmt = bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.lbramt) || 0), 0) || 0;
        const bFine = bill.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.silver) || 0), 0) || 0;
        totalAmt += bAmt;
        totalSilver += bFine;
      });

      let collectedAmt = 0;
      let collectedSilver = 0;

      collectedHistory.forEach((coll: any) => {
        collectedAmt += parseFloat(coll.amount || "0");
        collectedSilver += parseFloat(coll.silverKg || "0");
      });

      setStats({
        totalAmount: totalAmt,
        collectedAmount: collectedAmt,
        outstandingAmount: totalAmt - collectedAmt,
        totalFine: totalSilver,
        collectedFine: collectedSilver,
        outstandingFine: totalSilver - collectedSilver
      });
    };

    let financeData: any[] = [];
    let collectionData: any[] = [];
    let manufacturerPaymentData: any[] = [];

    const combineFinanceAndSetStats = () => {
      const combined = [...financeData, ...collectionData, ...manufacturerPaymentData];
      
      const income = combined.filter(f => f.type === "income").reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const expense = combined.filter(f => f.type === "expense").reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      
      const fineIncome = combined.filter(f => f.type === "income").reduce((acc, curr) => acc + (parseFloat(curr.fineAmount) || 0), 0);
      const fineExpense = combined.filter(f => f.type === "expense").reduce((acc, curr) => acc + (parseFloat(curr.fineAmount) || 0), 0);

      const sorted = [...combined].sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      
      setFinanceStats({
        totalIncome: income,
        totalExpense: expense,
        profit: income - expense,
        totalFineIncome: fineIncome,
        totalFineExpense: fineExpense,
        fineProfit: fineIncome - fineExpense,
        recentTransactions: sorted.slice(0, 5),
      });
      setRawFinanceData(combined);
    };

    const unsubParties = subscribeToParties((data) => { partiesList = data; calculateStats(); });
    const unsubBills = subscribeToBills((data) => { billHistory = data; calculateStats(); });
    const unsubColls = subscribeToCollections((data) => { 
      collectedHistory = data; 
      calculateStats(); 
      // Also map for finance
      collectionData = data.map((c: any) => ({
        id: c.id,
        type: "income",
        date: c.date,
        name: `Collection: ${c.partyName}`,
        amount: parseFloat(c.amount) || 0,
        fineAmount: parseFloat(c.silverKg) || 0,
        createdAt: c.createdAt || c.date,
      }));
      combineFinanceAndSetStats();
    });

    const unsubFinance = subscribeToFinances((data) => {
      financeData = data.map(f => ({ ...f, fineAmount: parseFloat(f.fineAmount) || 0 }));
      combineFinanceAndSetStats();
    });

    const unsubPayments = subscribeToManufacturerPayments((data) => {
      manufacturerPaymentData = data.map((p: any) => ({
        id: p.id,
        type: "expense",
        date: p.date,
        name: `Payment: ${p.manufacturerName}`,
        amount: parseFloat(p.amount) || 0,
        fineAmount: parseFloat(p.silverKg) || 0,
        createdAt: p.createdAt || p.date,
      }));
      combineFinanceAndSetStats();
    });

    const fetchUserData = async () => {
      const targetUid = getTargetUserId();
      if (targetUid) {
        try {
          const { firestore } = await import("@/lib/firebase");
          const { doc, getDoc } = await import("firebase/firestore");
          const userDoc = await getDoc(doc(firestore, "users", targetUid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else if (targetUid === "admin" || auth.currentUser?.email === "ndsuhagiyasuper@gmail.com") {
             // Fallback for N D Suhagiya
             setUserData({
               name: "N D Suhagiya",
               shopName: "N D SUHAGIYA"
             });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }

        // Fetch Realtime DB Company Profile for dynamic settings like marquee
        const profileRef = ref(db, `users/${targetUid}/settings/companyProfile`);
        onValue(profileRef, (snapshot) => {
          if (snapshot.exists()) {
            setCompanyProfile(snapshot.val());
          }
        });
      }
      setLoading(false);
    };

    fetchUserData();

    return () => {
      unsubParties();
      unsubBills();
      unsubColls();
      unsubFinance();
      unsubPayments();
    };
  }, []);

  // Compute month-wise chart data (must be before early return to follow Rules of Hooks)
  const monthlyChartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap: Record<string, { income: number; expense: number }> = {};

    // Initialize all 12 months for current year
    const year = new Date().getFullYear();
    monthNames.forEach((m, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      monthMap[key] = { income: 0, expense: 0 };
    });

    rawFinanceData.forEach((item) => {
      const dateStr = item.date || item.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) {
        monthMap[key] = { income: 0, expense: 0 };
      }
      const amt = parseFloat(item.amount) || 0;
      if (item.type === 'income') {
        monthMap[key].income += amt;
      } else if (item.type === 'expense') {
        monthMap[key].expense += amt;
      }
    });

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const [y, m] = key.split('-');
        return {
          month: monthNames[parseInt(m) - 1],
          fullMonth: `${monthNames[parseInt(m) - 1]} ${y}`,
          income: Math.round(val.income * 100) / 100,
          expense: Math.round(val.expense * 100) / 100,
          profit: Math.round((val.income - val.expense) * 100) / 100,
        };
      });
  }, [rawFinanceData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const profitIsPositive = financeStats.profit >= 0;
  const fineProfitIsPositive = financeStats.fineProfit >= 0;
  const currentDate = new Date();
  const greeting = currentDate.getHours() < 12 ? "Good Morning" : currentDate.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-xl border border-stone-200 rounded-xl p-3 sm:p-4 shadow-xl shadow-stone-900/10">
          <p className="text-xs font-bold text-stone-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-[11px] font-semibold text-stone-500 capitalize">{entry.dataKey}:</span>
              <span className="text-[11px] font-bold text-stone-900">₹{Number(entry.value).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-7 lg:space-y-8 relative">
      {toastMessage && (
        <div className="fixed top-16 sm:top-20 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 bg-stone-900 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-xl text-sm sm:text-base font-medium animate-in fade-in slide-in-from-top-4 duration-300 max-w-[90vw]">
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Trial User Marquee */}
      {userData?.trialExpiresAt && (
        <div className="bg-amber-100 border border-amber-200 text-amber-800 py-2 rounded-xl flex items-center overflow-hidden relative shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-amber-100 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-amber-100 to-transparent z-10 pointer-events-none"></div>
          <div className="w-full flex overflow-hidden">
            <div key={companyProfile?.marqueeText || "default"} className="animate-marquee flex flex-row items-center w-max hover:[animation-play-state:paused] cursor-default">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-sm font-semibold tracking-wide flex items-center gap-2 px-12 whitespace-nowrap flex-shrink-0">
                  <span className="text-amber-600">✨</span> 
                  {companyProfile?.marqueeText || "Did you know? You can change your company name, add a custom logo, update your mobile number, address, and email! Just go to Settings, update your details, click Save Changes, and it will reflect across your entire dashboard instantly!"} 
                  <span className="text-amber-600">✨</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO WELCOME SECTION                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl" style={{ background: "linear-gradient(135deg, #1a1207 0%, #2d1f0e 35%, #3d2a14 60%, #1a1207 100%)" }}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-48 sm:w-80 h-48 sm:h-80 rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #d4a853 0%, transparent 70%)" }}></div>
          <div className="absolute -bottom-32 -left-16 w-64 sm:w-96 h-64 sm:h-96 rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #d4a853 0%, transparent 70%)" }}></div>
          <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.02]" style={{ background: "radial-gradient(circle, #fef3c7 0%, transparent 60%)" }}></div>
          {/* Golden grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(212, 168, 83, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 168, 83, 0.3) 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
        </div>

        <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-10">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50"></div>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">{greeting}</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-1 sm:mb-2">
                Welcome, <span style={{ background: "linear-gradient(135deg, #f6d365 0%, #d4a853 50%, #fda085 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{userData?.name || (userData?.shopName ? userData.shopName.split(" ")[0] : "N D Suhagiya")}</span>
              </h1>
              <p className="text-stone-400 text-xs sm:text-sm md:text-base font-medium max-w-xl">
                Here's your business overview for <span className="text-stone-300">{userData?.shopName || "Your Company"}</span> today.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {userData?.trialExpiresAt && (
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-rose-500/30 bg-rose-500/10 backdrop-blur-sm">
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-rose-400 mb-0.5">Trial Expires</div>
                  <div className="text-xs sm:text-sm font-bold text-rose-300">
                    {new Date(userData.trialExpiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* INCOME / EXPENSE / PROFIT-LOSS SECTION                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-6 sm:h-7 w-1 rounded-full" style={{ background: "linear-gradient(180deg, #d4a853, #b8860b)" }}></div>
            <h2 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight">Financial Overview</h2>
          </div>
          <Link href="/dashboard/finance" className="text-[10px] sm:text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group/all">
            View All <ArrowRight className="w-3 h-3 group-hover/all:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {/* Income Card */}
          <Link href="/dashboard/finance" className="relative group overflow-hidden rounded-xl border border-emerald-100/80 bg-white hover:bg-emerald-50/30 px-3.5 sm:px-4 py-3 sm:py-3.5 shadow-sm hover:shadow-md hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-400 cursor-pointer block">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500" style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}></div>
            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
            <div className="relative flex items-center gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300 shrink-0">
                <ArrowDownRight className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-400">Total Income</p>
                  <div className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200/50">
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-emerald-600">Income</span>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight leading-none">₹{Number(financeStats.totalIncome.toFixed(2)).toLocaleString('en-IN')}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
            </div>
          </Link>

          {/* Expense Card */}
          <Link href="/dashboard/finance" className="relative group overflow-hidden rounded-xl border border-rose-100/80 bg-white hover:bg-rose-50/30 px-3.5 sm:px-4 py-3 sm:py-3.5 shadow-sm hover:shadow-md hover:shadow-rose-500/5 hover:-translate-y-0.5 transition-all duration-400 cursor-pointer block">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500" style={{ background: "radial-gradient(circle, #ef4444 0%, transparent 70%)" }}></div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-400 via-rose-500 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
            <div className="relative flex items-center gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform duration-300 shrink-0">
                <ArrowUpRight className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-400">Total Expense</p>
                  <div className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200/50">
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-rose-600">Expense</span>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight leading-none">₹{Number(financeStats.totalExpense.toFixed(2)).toLocaleString('en-IN')}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
            </div>
          </Link>

          {/* Profit / Loss Card */}
          <Link href="/dashboard/finance" className="relative group overflow-hidden rounded-xl border px-3.5 sm:px-4 py-3 sm:py-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-400 cursor-pointer block"
            style={{
              borderColor: profitIsPositive ? "rgb(191 219 254 / 0.5)" : "rgb(254 202 202 / 0.5)",
              background: "white"
            }}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500" style={{ background: `radial-gradient(circle, ${profitIsPositive ? '#3b82f6' : '#ef4444'} 0%, transparent 70%)` }}></div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: profitIsPositive ? "linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6)" : "linear-gradient(to right, #f97316, #ef4444, #dc2626)" }}></div>
            <div className="relative flex items-center gap-3">
              <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 shrink-0 ${profitIsPositive ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20' : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20'}`}>
                {profitIsPositive ? <TrendingUp className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" /> : <TrendingDown className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-400">Net {profitIsPositive ? 'Profit' : 'Loss'}</p>
                  <div className={`px-1.5 py-0.5 rounded border ${profitIsPositive ? 'bg-blue-50 border-blue-200/50' : 'bg-orange-50 border-orange-200/50'}`}>
                    <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest ${profitIsPositive ? 'text-blue-600' : 'text-orange-600'}`}>
                      {profitIsPositive ? 'Profit' : 'Loss'}
                    </span>
                  </div>
                </div>
                <p className={`text-lg sm:text-xl font-extrabold tracking-tight leading-none ${profitIsPositive ? 'text-stone-900' : 'text-rose-700'}`}>
                  {profitIsPositive ? '' : '-'}₹{Number(Math.abs(financeStats.profit).toFixed(2)).toLocaleString('en-IN')}
                </p>
              </div>
              <ArrowRight className={`w-3.5 h-3.5 text-stone-300 group-hover:translate-x-0.5 transition-all duration-300 shrink-0 ${profitIsPositive ? 'group-hover:text-blue-500' : 'group-hover:text-orange-500'}`} />
            </div>
          </Link>
        </div>

        {/* Fine Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-2.5 sm:mt-3">
          {/* Fine Income Card */}
          <Link href="/dashboard/finance" className="relative group overflow-hidden rounded-xl border border-emerald-100/80 bg-white hover:bg-emerald-50/30 px-3.5 sm:px-4 py-3 sm:py-3.5 shadow-sm hover:shadow-md hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-400 cursor-pointer block">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500" style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}></div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
            <div className="relative flex items-center gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300 shrink-0">
                <ArrowDownRight className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-400">Fine Income</p>
                  <div className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200/50">
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-emerald-600">Income</span>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight leading-none">{Number(financeStats.totalFineIncome.toFixed(3))}g</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
            </div>
          </Link>

          {/* Fine Expense Card */}
          <Link href="/dashboard/finance" className="relative group overflow-hidden rounded-xl border border-rose-100/80 bg-white hover:bg-rose-50/30 px-3.5 sm:px-4 py-3 sm:py-3.5 shadow-sm hover:shadow-md hover:shadow-rose-500/5 hover:-translate-y-0.5 transition-all duration-400 cursor-pointer block">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500" style={{ background: "radial-gradient(circle, #ef4444 0%, transparent 70%)" }}></div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-400 via-rose-500 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
            <div className="relative flex items-center gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform duration-300 shrink-0">
                <ArrowUpRight className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-400">Fine Expense</p>
                  <div className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200/50">
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-rose-600">Expense</span>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight leading-none">{Number(financeStats.totalFineExpense.toFixed(3))}g</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
            </div>
          </Link>

          {/* Fine Profit / Loss Card */}
          <Link href="/dashboard/finance" className="relative group overflow-hidden rounded-xl border px-3.5 sm:px-4 py-3 sm:py-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-400 cursor-pointer block"
            style={{
              borderColor: fineProfitIsPositive ? "rgb(191 219 254 / 0.5)" : "rgb(254 202 202 / 0.5)",
              background: "white"
            }}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500" style={{ background: `radial-gradient(circle, ${fineProfitIsPositive ? '#3b82f6' : '#ef4444'} 0%, transparent 70%)` }}></div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: fineProfitIsPositive ? "linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6)" : "linear-gradient(to right, #f97316, #ef4444, #dc2626)" }}></div>
            <div className="relative flex items-center gap-3">
              <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 shrink-0 ${fineProfitIsPositive ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20' : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20'}`}>
                {fineProfitIsPositive ? <TrendingUp className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" /> : <TrendingDown className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-400">Fine Balance</p>
                  <div className={`px-1.5 py-0.5 rounded border ${fineProfitIsPositive ? 'bg-blue-50 border-blue-200/50' : 'bg-orange-50 border-orange-200/50'}`}>
                    <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest ${fineProfitIsPositive ? 'text-blue-600' : 'text-orange-600'}`}>
                      {fineProfitIsPositive ? 'Profit' : 'Loss'}
                    </span>
                  </div>
                </div>
                <p className={`text-lg sm:text-xl font-extrabold tracking-tight leading-none ${fineProfitIsPositive ? 'text-stone-900' : 'text-rose-700'}`}>
                  {fineProfitIsPositive ? '' : '-'}{Number(Math.abs(financeStats.fineProfit).toFixed(3))}g
                </p>
              </div>
              <ArrowRight className={`w-3.5 h-3.5 text-stone-300 group-hover:translate-x-0.5 transition-all duration-300 shrink-0 ${fineProfitIsPositive ? 'group-hover:text-blue-500' : 'group-hover:text-orange-500'}`} />
            </div>
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* INCOME & EXPENSE TREND CHART                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-6 sm:h-8 w-1 rounded-full" style={{ background: "linear-gradient(180deg, #d4a853, #b8860b)" }}></div>
            <h2 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">Income & Expense Trend</h2>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] sm:text-xs font-semibold text-stone-500">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500"></div>
              <span className="text-[10px] sm:text-xs font-semibold text-stone-500">Expense</span>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-stone-200/60 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
          {/* Background decorative grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>
          <div className="relative" style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="#e7e5e4" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#a8a29e' }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#a8a29e' }}
                  tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`}
                  dx={-5}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#incomeGradient)"
                  dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 3, className: 'drop-shadow-lg' }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fill="url(#expenseGradient)"
                  dot={{ r: 4, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 3, className: 'drop-shadow-lg' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Monthly summary strip */}
          <div className="mt-4 sm:mt-5 pt-4 border-t border-stone-100 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-stone-400 mb-0.5">Peak Income</p>
              <p className="text-sm sm:text-base font-extrabold text-emerald-600">
                ₹{Number(Math.max(...monthlyChartData.map(d => d.income))).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-400 font-medium">
                {monthlyChartData.find(d => d.income === Math.max(...monthlyChartData.map(x => x.income)))?.month || '-'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-stone-400 mb-0.5">Peak Expense</p>
              <p className="text-sm sm:text-base font-extrabold text-rose-600">
                ₹{Number(Math.max(...monthlyChartData.map(d => d.expense))).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-400 font-medium">
                {monthlyChartData.find(d => d.expense === Math.max(...monthlyChartData.map(x => x.expense)))?.month || '-'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-stone-400 mb-0.5">Best Profit</p>
              <p className="text-sm sm:text-base font-extrabold text-blue-600">
                ₹{Number(Math.max(...monthlyChartData.map(d => d.profit))).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-400 font-medium">
                {monthlyChartData.find(d => d.profit === Math.max(...monthlyChartData.map(x => x.profit)))?.month || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* QUICK LINKS SECTION                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="h-6 sm:h-8 w-1 rounded-full" style={{ background: "linear-gradient(180deg, #d4a853, #b8860b)" }}></div>
          <h2 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
          {userData?.permissions?.["billing"] !== false && (
            <Link href="/dashboard/billing/create" className="group relative overflow-hidden bg-white p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-amber-200/70 transition-all duration-300 flex flex-col items-center text-center gap-3 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/0 to-amber-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/80 flex items-center justify-center text-amber-600 group-hover:shadow-md group-hover:shadow-amber-200/50 transition-all duration-300">
                <CreditCard className="h-6 w-6" />
              </div>
              <p className="relative text-[11px] sm:text-xs md:text-sm font-bold text-stone-900">Create Bill</p>
            </Link>
          )}
          
          {userData?.permissions?.["parties_list"] !== false && userData?.permissions?.["parties"] !== false && (
            <Link href="/dashboard/parties" className="group relative overflow-hidden bg-white p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-blue-200/70 transition-all duration-300 flex flex-col items-center text-center gap-3 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/80 flex items-center justify-center text-blue-600 group-hover:shadow-md group-hover:shadow-blue-200/50 transition-all duration-300">
                <Users className="h-6 w-6" />
              </div>
              <p className="relative text-[11px] sm:text-xs md:text-sm font-bold text-stone-900">Party List</p>
            </Link>
          )}

          {userData?.permissions?.["parties_collect"] !== false && userData?.permissions?.["parties"] !== false && (
            <Link href="/dashboard/parties/collect" className="group relative overflow-hidden bg-white p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-emerald-200/70 transition-all duration-300 flex flex-col items-center text-center gap-3 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 flex items-center justify-center text-emerald-600 group-hover:shadow-md group-hover:shadow-emerald-200/50 transition-all duration-300">
                <Wallet className="h-6 w-6" />
              </div>
              <p className="relative text-[11px] sm:text-xs md:text-sm font-bold text-stone-900">Collect Amount</p>
            </Link>
          )}

          <Link href="/dashboard/session" className="group relative overflow-hidden bg-white p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-indigo-200/70 transition-all duration-300 flex flex-col items-center text-center gap-3 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/80 flex items-center justify-center text-indigo-600 group-hover:shadow-md group-hover:shadow-indigo-200/50 transition-all duration-300">
              <Clock className="h-6 w-6" />
            </div>
            <p className="relative text-[11px] sm:text-xs md:text-sm font-bold text-stone-900">View Session</p>
          </Link>

          {userData?.permissions?.["settings"] !== false && (
            <Link href="/dashboard/settings" className="group relative overflow-hidden bg-white p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-300/70 transition-all duration-300 flex flex-col items-center text-center gap-3 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-stone-50/0 to-stone-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200/80 flex items-center justify-center text-stone-600 group-hover:shadow-md group-hover:shadow-stone-300/50 transition-all duration-300">
                <Settings className="h-6 w-6" />
              </div>
              <p className="relative text-[11px] sm:text-xs md:text-sm font-bold text-stone-900">Settings</p>
            </Link>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* BUSINESS STATS SECTION (Amount & Fine)                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="h-6 sm:h-8 w-1 rounded-full" style={{ background: "linear-gradient(180deg, #d4a853, #b8860b)" }}></div>
          <h2 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">Business Analytics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
          {/* Amount Analytics Card */}
          <div className="rounded-xl sm:rounded-2xl border border-stone-200/60 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm shadow-amber-500/20">
                <IndianRupee className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Amount Summary</h3>
                <p className="text-xs text-stone-400 font-medium">Billing & Collections</p>
              </div>
            </div>
            <div className="space-y-4">
              {/* Total */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl bg-amber-50/50 border border-amber-100/60">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md sm:rounded-lg bg-amber-100 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-stone-700">Total Amount</span>
                </div>
                <span className="text-sm sm:text-base md:text-lg font-extrabold text-stone-900">₹{Number(stats.totalAmount.toFixed(2)).toLocaleString('en-IN')}</span>
              </div>
              {/* Collected */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl bg-emerald-50/50 border border-emerald-100/60">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md sm:rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-stone-700">Collected</span>
                </div>
                <span className="text-sm sm:text-base md:text-lg font-extrabold text-emerald-700">₹{Number(stats.collectedAmount.toFixed(2)).toLocaleString('en-IN')}</span>
              </div>
              {/* Outstanding */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl bg-rose-50/50 border border-rose-100/60">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md sm:rounded-lg bg-rose-100 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-stone-700">Outstanding</span>
                </div>
                <span className="text-sm sm:text-base md:text-lg font-extrabold text-rose-700">₹{Number(stats.outstandingAmount.toFixed(2)).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Fine Analytics Card */}
          <div className="rounded-xl sm:rounded-2xl border border-stone-200/60 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm shadow-indigo-500/20">
                <Gem className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Fine (Silver) Summary</h3>
                <p className="text-xs text-stone-400 font-medium">Gold & Silver Tracking</p>
              </div>
            </div>
            <div className="space-y-4">
              {/* Total Fine */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl bg-indigo-50/50 border border-indigo-100/60">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md sm:rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Gem className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-stone-700">Total Fine</span>
                </div>
                <span className="text-sm sm:text-base md:text-lg font-extrabold text-stone-900">{Number(stats.totalFine.toFixed(3)).toString()} g</span>
              </div>
              {/* Collected Fine */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl bg-teal-50/50 border border-teal-100/60">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md sm:rounded-lg bg-teal-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-stone-700">Collected Fine</span>
                </div>
                <span className="text-sm sm:text-base md:text-lg font-extrabold text-teal-700">{Number(stats.collectedFine.toFixed(3)).toString()} g</span>
              </div>
              {/* Outstanding Fine */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl bg-orange-50/50 border border-orange-100/60">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md sm:rounded-lg bg-orange-100 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-stone-700">Outstanding Fine</span>
                </div>
                <span className="text-sm sm:text-base md:text-lg font-extrabold text-orange-700">{Number(stats.outstandingFine.toFixed(3)).toString()} g</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* RECENT TRANSACTIONS                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {financeStats.recentTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-6 sm:h-8 w-1 rounded-full" style={{ background: "linear-gradient(180deg, #d4a853, #b8860b)" }}></div>
              <h2 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">Recent Transactions</h2>
            </div>
            <Link href="/dashboard/finance" className="text-[11px] sm:text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group">
              View All <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
            <div className="divide-y divide-stone-100">
              {financeStats.recentTransactions.map((txn, i) => (
                <div key={txn.id || i} className="flex items-center justify-between px-3.5 sm:px-5 md:px-6 py-3 sm:py-4 hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 min-w-0">
                    <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                      txn.type === 'income'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-rose-50 text-rose-500'
                    }`}>
                      {txn.type === 'income' ? <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-stone-900 truncate">{txn.name}</p>
                      <p className="text-[10px] sm:text-xs text-stone-400 font-medium truncate">{txn.date} · {txn.invoiceNo || 'No invoice'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-xs sm:text-sm font-extrabold ${txn.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {txn.type === 'income' ? '+' : '-'}₹{(txn.amount || 0).toFixed(2)}
                    </p>
                    <p className="text-[10px] sm:text-[11px] font-medium text-stone-400 capitalize">{txn.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
