"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { superAdminFirestore as firestore } from "@/lib/firebase";
import { doc, getDoc, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Loader2, ArrowLeft, Store, Settings, User, Box } from "lucide-react";
import { LanguageProvider } from "@/lib/LanguageContext";

// Import user dashboard components
import DashboardPage from "@/app/dashboard/page";
import BillingPage from "@/app/dashboard/billing/page";
import PartiesPage from "@/app/dashboard/parties/page";
import PartiesCollectPage from "@/app/dashboard/parties/collect/page";
import TrashPage from "@/app/dashboard/trash/page";
import SettingsPage from "@/app/dashboard/settings/page";
import StockPage from "@/app/dashboard/stock/page";

import { DASHBOARD_MODULES } from "@/lib/dashboardModules";


function SuperAdminViewUserContent() {
  const params = useParams();
  const userId = params?.userId as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  
  const [activeModuleId, setActiveModuleId] = useState<string>("");
  const [activeSubModuleId, setActiveSubModuleId] = useState<string>("");

  useEffect(() => {
    if (!userId) return;

    // Enable impersonation context
    sessionStorage.setItem("impersonated_user_id", userId);

    // Listen to user document in real-time
    const unsubscribeUser = onSnapshot(doc(firestore, "users", userId), (snapshot) => {
      if (snapshot.exists()) {
        setUserDoc({ id: snapshot.id, ...snapshot.data() });
      } else {
        // Try trial users
        onSnapshot(doc(firestore, "trial_users", userId), (trialSnap) => {
          if (trialSnap.exists()) {
            setUserDoc({ id: trialSnap.id, ...trialSnap.data() });
          } else {
            console.error("User not found");
          }
        });
      }
    });

    // Listen to modules
    const mQ = query(collection(firestore, "superadmin_modules"), orderBy("createdAt", "asc"));
    const unsubscribeModules = onSnapshot(mQ, (snapshot) => {
      const mods = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setModules([...DASHBOARD_MODULES, ...mods]);
      setLoading(false);
    }, (err) => {
      console.error(err);
      const fallbackMQ = query(collection(firestore, "superadmin_modules"));
      onSnapshot(fallbackMQ, (snap) => {
        const mods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setModules([...DASHBOARD_MODULES, ...mods]);
        setLoading(false);
      });
    });

    return () => {
      // Disable impersonation context on unmount
      sessionStorage.removeItem("impersonated_user_id");
      unsubscribeModules();
      unsubscribeUser();
    };
  }, [userId]);

  // Set default active module once data is loaded
  useEffect(() => {
    if (!loading && userDoc && modules.length > 0 && !activeModuleId) {
      const perms = userDoc.permissions || {};
      const firstActiveMod = modules.find(m => perms[m.id] !== false);
      if (firstActiveMod) {
        setActiveModuleId(firstActiveMod.id);
        
        if (firstActiveMod.subItems && firstActiveMod.subItems.length > 0) {
           const firstActiveSub = firstActiveMod.subItems.find((s: any) => perms[s.id] !== false);
           if (firstActiveSub) {
             setActiveSubModuleId(firstActiveSub.id);
           }
        }
      } else {
        setActiveModuleId("dashboard");
      }
    }
  }, [loading, userDoc, modules, activeModuleId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!userDoc) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
        <p className="text-stone-500 mb-4">User not found.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  const perms = userDoc.permissions || {};
  const activeTopModules = modules.filter(m => perms[m.id] !== false);

  const currentModule = modules.find(m => m.id === activeModuleId);
  const activeSubModules = currentModule?.subItems ? currentModule.subItems.filter((s: any) => perms[s.id] !== false) : [];

  const handleModuleClick = (mod: any) => {
    setActiveModuleId(mod.id);
    if (mod.subItems && mod.subItems.length > 0) {
      const firstActiveSub = mod.subItems.find((s: any) => perms[s.id] !== false);
      setActiveSubModuleId(firstActiveSub ? firstActiveSub.id : "");
    } else {
      setActiveSubModuleId("");
    }
  };

  const renderComponent = () => {
    if (activeModuleId === "dashboard") return <DashboardPage />;
    if (activeModuleId === "billing") return <BillingPage />;
    if (activeModuleId === "parties") {
      if (activeSubModuleId === "parties_list") return <PartiesPage />;
      if (activeSubModuleId === "parties_collect") return <PartiesCollectPage />;
      return <PartiesPage />;
    }
    if (activeModuleId === "trash") return <TrashPage />;
    if (activeModuleId === "settings") return <SettingsPage />;
    if (activeModuleId === "stock") return <StockPage />;
    
    return (
      <div className="p-8 text-center text-stone-500 bg-white rounded-2xl border border-stone-200">
        <p>This custom module component is not natively available in View mode.</p>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors text-stone-500 border border-stone-200"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-3 tracking-tight">
              <User className="w-6 h-6 text-amber-500" />
              Viewing: {userDoc.shopName || userDoc.name || "User"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">Live Impersonation Mode</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Level Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {activeTopModules.length === 0 && (
          <p className="text-sm text-stone-500 italic p-2">This user has no active module permissions.</p>
        )}
        {activeTopModules.map(mod => (
          <button
            key={mod.id}
            onClick={() => handleModuleClick(mod)}
            className={`px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-2 ${
              activeModuleId === mod.id 
                ? "bg-stone-900 text-white shadow-md transform -translate-y-0.5 border border-stone-800"
                : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 hover:border-stone-300 hover:text-stone-900"
            }`}
          >
            {mod.icon ? <mod.icon className="w-4 h-4" /> : <Box className="w-4 h-4" />}
            {mod.name}
          </button>
        ))}
      </div>

      {/* Second Level Tabs (if any) */}
      {activeSubModules.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {activeSubModules.map((sub: any) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubModuleId(sub.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5 ${
                activeSubModuleId === sub.id 
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
              }`}
            >
              {sub.icon && <sub.icon className="w-3.5 h-3.5" />}
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Render Component Container */}
      <div className="bg-stone-50/50 rounded-2xl min-h-[500px]">
        <LanguageProvider>
          {renderComponent()}
        </LanguageProvider>
      </div>
    </div>
  );
}

export default function SuperAdminViewUser() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>}>
      <SuperAdminViewUserContent />
    </Suspense>
  );
}
