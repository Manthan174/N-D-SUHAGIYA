"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import {
  Gem,
  LayoutDashboard,
  CreditCard,
  Trash2,
  Settings,
  LogOut,
  Menu,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  Clock,
  Plus,
  Users,
  ShieldAlert,
  Search,
  Package,
  Wallet,
  Briefcase,
  Factory,
  Receipt
} from "lucide-react";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";



function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<string | null>(null);
  const [impersonatedUserEmail, setImpersonatedUserEmail] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState(() => {
    if (typeof window !== "undefined") {
      const cachedName = sessionStorage.getItem("cached_shop_name");
      if (cachedName) return { name: cachedName, logoUrl: "" };
    }
    return { name: "Your Company", logoUrl: "" };
  });

  useEffect(() => {
    let unsubscribeSettings: () => void;
    let unsubscribePermissions: () => void;

    // Load global settings as a fallback or for admin
    const loadGlobalSettings = (userId: string = 'admin') => {
      const settingsRef = ref(db, `users/${userId}/settings/companyProfile`);
      return onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setCompanyData(prev => {
            const newName = (data.companyName && prev.name === "Your Company") ? data.companyName : prev.name;
            if (typeof window !== "undefined" && newName !== "Your Company") {
              sessionStorage.setItem("cached_shop_name", newName);
            }
            return {
              name: newName,
              logoUrl: data.logoUrl || ""
            };
          });
        }
      });
    };

    if (typeof window !== "undefined" && sessionStorage.getItem("superadmin_session") === "true") {
      const impersonated = sessionStorage.getItem("impersonated_user_id");
      const impersonatedEmail = sessionStorage.getItem("impersonated_user_email");
      if (impersonated) {
        setImpersonatedUser(impersonated);
        setImpersonatedUserEmail(impersonatedEmail || impersonated);
        setUser({ email: "ndsuhagiyasuper@gmail.com", uid: "admin" } as User);

        // Listen to the impersonated user's permissions in real-time
        const fetchImpersonatedPermissions = async () => {
          try {
            const { firestore } = await import("@/lib/firebase");
            const { doc, onSnapshot } = await import("firebase/firestore");
            unsubscribePermissions = onSnapshot(doc(firestore, "users", impersonated), (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.shopName) {
                  setCompanyData(prev => ({ ...prev, name: data.shopName }));
                }
                if (data.permissions) {
                  setUserPermissions(data.permissions);
                } else {
                  setUserPermissions({});
                }
              }
            });
          } catch (err) {
            console.error("Error setting up impersonated permissions:", err);
          }
        };
        fetchImpersonatedPermissions();

        unsubscribeSettings = loadGlobalSettings(impersonated);
        setLoading(false);
      } else {
        setUser({ email: "ndsuhagiyasuper@gmail.com", uid: "admin" } as User);
        unsubscribeSettings = loadGlobalSettings('admin');
        setLoading(false);
      }
      return () => {
        if (unsubscribeSettings) unsubscribeSettings();
        if (unsubscribePermissions) unsubscribePermissions();
      };
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
      } else {
        setUser(currentUser);

        // Fetch/Listen to specific user data from Firestore in real-time
        try {
          const { firestore } = await import("@/lib/firebase");
          const { doc, onSnapshot } = await import("firebase/firestore");
          unsubscribePermissions = onSnapshot(doc(firestore, "users", currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.shopName) {
                const shopName = data.shopName;
                setCompanyData(prev => ({ ...prev, name: shopName }));
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("cached_shop_name", shopName);
                }
              } else {
                unsubscribeSettings = loadGlobalSettings(currentUser.uid);
              }
              if (data.permissions) {
                setUserPermissions(data.permissions);
              } else {
                setUserPermissions({});
              }
            } else {
              unsubscribeSettings = loadGlobalSettings(currentUser.uid);
            }
          });
        } catch (err) {
          console.error("Error setting up permissions listener:", err);
          unsubscribeSettings = loadGlobalSettings(currentUser.uid);
        }

        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribePermissions) unsubscribePermissions();
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [router]);

  // Reset expanded menu when navigating to a new page so the active module auto-expands
  useEffect(() => {
    setExpandedMenu(null);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      if (typeof window !== "undefined") {
        if (sessionStorage.getItem("superadmin_session") === "true") {
          sessionStorage.removeItem("superadmin_session");
          sessionStorage.removeItem("impersonated_user_id");
          sessionStorage.removeItem("impersonated_user_email");
          await signOut(auth);
          router.push("/superadmin/login");
          return;
        }
      }
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleStopImpersonating = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("impersonated_user_id");
      sessionStorage.removeItem("impersonated_user_email");
      window.location.href = '/superadmin';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
        <p className="text-sm font-medium text-stone-500">Loading your workspace...</p>
      </div>
    );
  }

  const baseNavigation = [
    { name: t('Dashboard'), href: "/dashboard", icon: LayoutDashboard, moduleId: "dashboard" },
    {
      name: t('Billing'),
      icon: CreditCard,
      href: "/dashboard/billing/create",
      moduleId: "billing"
    },
    {
      name: t('Stock') || 'Stock',
      icon: Package,
      href: "/dashboard/stock",
      moduleId: "stock"
    },
    {
      name: 'Party',
      icon: Users,
      moduleId: "parties",
      subItems: [
        { name: 'Party List', href: "/dashboard/parties", icon: Users },
        { name: 'Collect Amount', href: "/dashboard/parties/collect", icon: CreditCard }
      ]
    },
    {
      name: 'Employees',
      icon: Briefcase,
      href: "/dashboard/employees",
      moduleId: "employees"
    },
    {
      name: t('FinanceAccount') || 'Finance & Account',
      icon: Wallet,
      href: "/dashboard/finance",
      moduleId: "finance"
    },
    {
      name: t('Manufacturer') || 'Manufacturer',
      icon: Factory,
      moduleId: "manufacturers",
      subItems: [
        { name: 'Manufacturer List', href: "/dashboard/manufacturers", icon: Factory },
        { name: 'Pay Amount', href: "/dashboard/manufacturers/pay", icon: CreditCard },
        { name: 'Add Bill', href: "/dashboard/manufacturers/add-bill", icon: Receipt }
      ]
    },
    { name: t('Session') || 'Session', href: "/dashboard/session", icon: Clock, moduleId: "session" },
    { name: t('Trash'), href: "/dashboard/trash", icon: Trash2, moduleId: "trash" },
    { name: t('Settings'), href: "/dashboard/settings", icon: Settings, moduleId: "settings" },
  ];

  const navigation = baseNavigation.filter(item => {
    // If impersonating, respect the userPermissions of the impersonated user
    if (impersonatedUser) {
      if (item.moduleId && userPermissions && userPermissions[item.moduleId] === false) return false;
      return true;
    }
    // If no permissions set (legacy user) or user is admin, show everything
    if (!userPermissions || user?.uid === 'admin') return true;
    if (item.moduleId && userPermissions[item.moduleId] === false) return false;
    return true;
  });

  // Add Super Admin Panel for admins
  if (user?.uid === 'admin') {
    navigation.push({ name: 'Control Panel', href: "/superadmin", icon: ShieldAlert as any, moduleId: 'control_panel' });
  }

  const toggleMenu = (name: string) => {
    setExpandedMenu(prev => {
      const isCurrentlyActive = navigation.find(n => n.name === name)?.subItems?.some(sub => pathname === sub.href);
      if (prev === name || (prev === null && isCurrentlyActive)) {
        return "CLOSED";
      }
      return name;
    });
  };

  const handleNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen bg-stone-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-stone-200 transition-all duration-300 ease-in-out shrink-0 flex flex-col ${
          sidebarOpen
            ? "w-64 translate-x-0"
            : "-translate-x-full lg:translate-x-0 lg:w-16"
        }`}
      >
        {/* Company Branding */}
        <div className={`h-16 flex items-center shrink-0 border-b border-stone-200 ${sidebarOpen ? "justify-between px-4 lg:px-6" : "justify-center px-2"}`}>
          {sidebarOpen ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden flex-1">
                {companyData.logoUrl ? (
                  <img
                    src={companyData.logoUrl}
                    alt={companyData.name}
                    className="h-8 w-8 object-contain rounded-md shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).outerHTML = '<div class="h-8 w-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shadow-inner shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gem"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13"/><path d="M13 3l3 6-4 13"/></svg></div>';
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shadow-inner shrink-0">
                    <Gem className="h-5 w-5" />
                  </div>
                )}
                <span className="text-xl font-extrabold text-stone-900 tracking-tight truncate">
                  {companyData.name}
                </span>
              </Link>

              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 -mr-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                title="Collapse sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors flex items-center justify-center"
              title="Expand sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className={`flex-1 py-6 overflow-y-auto ${sidebarOpen ? "px-4" : "px-2"}`}>
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              // Exact match for the parent route, or exact match for any sub-item
              const isParentActive = item.href ? pathname === item.href : false;
              const isAnySubActive = item.subItems?.some(sub => pathname === sub.href) || false;
              const isActive = isParentActive || isAnySubActive;
              const isExpanded = expandedMenu === item.name || (expandedMenu === null && isAnySubActive);
              const targetHref = item.href || (item.subItems && item.subItems[0]?.href) || "/dashboard";

              if (!sidebarOpen) {
                // Mini Icon Mode when sidebar is collapsed
                return (
                  <Link
                    key={item.name}
                    href={targetHref}
                    onClick={handleNavClick}
                    title={item.name}
                    className={`flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                );
              }

              return (
                <div key={item.name} className="space-y-1">
                  {item.subItems ? (
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                        ? "bg-amber-50 text-amber-700"
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`h-5 w-5 ${isActive ? "text-amber-600" : "text-stone-400"
                            }`}
                        />
                        {item.name}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-stone-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-stone-400" />
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.href!}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                        ? "bg-amber-50 text-amber-700"
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                        }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${isActive ? "text-amber-600" : "text-stone-400"
                          }`}
                      />
                      {item.name}
                    </Link>
                  )}

                  {/* Render SubItems if they exist and are expanded */}
                  {item.subItems && isExpanded && (
                    <div className="pl-11 space-y-1 pb-1 pt-1">
                      {item.subItems.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={handleNavClick}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isSubActive
                              ? "text-amber-700 bg-amber-50/50 font-semibold"
                              : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                              }`}
                          >
                            {sub.icon && (
                              <sub.icon
                                className={`h-4 w-4 ${isSubActive ? "text-amber-600" : "text-stone-400"
                                  }`}
                              />
                            )}
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className={`p-4 border-t border-stone-200 shrink-0 ${sidebarOpen ? "" : "flex justify-center"}`}>
          {sidebarOpen ? (
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5 text-red-500" />
              {t('SignOut')}
            </button>
          ) : (
            <button
              onClick={handleSignOut}
              title={t('SignOut') || "Sign Out"}
              className="flex items-center justify-center h-10 w-10 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5 text-red-500" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Wrapper */}
      <div className={`flex-1 flex flex-col overflow-hidden w-full transition-[padding] duration-300 ease-in-out ${
        sidebarOpen ? "lg:pl-64" : "lg:pl-16"
      }`}>
        {/* Top Navbar */}
        <header className="bg-white border-b border-stone-200 shrink-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 -ml-2 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors flex items-center justify-center"
                  title="Expand sidebar"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <Link href="/dashboard" className="flex lg:hidden items-center gap-2 shrink-0">
                  {companyData.logoUrl ? (
                    <img src={companyData.logoUrl} alt={companyData.name} className="h-7 w-7 object-contain rounded-md shrink-0" />
                  ) : (
                    <div className="h-7 w-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shadow-inner shrink-0">
                      <Gem className="h-4 w-4" />
                    </div>
                  )}
                  <span className="text-base font-extrabold text-stone-900 tracking-tight truncate max-w-[130px] sm:max-w-xs">
                    {companyData.name}
                  </span>
                </Link>

              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-4 mr-2 border-r border-stone-200 pr-4">
                  <span className="text-sm font-medium text-stone-600">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button className="px-3 py-1.5 text-xs font-bold tracking-wider text-amber-700 bg-amber-100 rounded-md border border-amber-200 hover:bg-amber-200 transition-colors">
                    {t('Session')}
                  </button>
                </div>

                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors p-2 rounded-md hover:bg-stone-100"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:block">{t('SignOut')}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          {impersonatedUser && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-blue-800">
                <ShieldAlert className="h-5 w-5" />
                <div>
                  <p className="text-sm font-bold">Viewing as another user</p>
                  <p className="text-xs opacity-80">You are currently viewing data for user: {impersonatedUserEmail}</p>
                </div>
              </div>
              <button
                onClick={handleStopImpersonating}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Stop Viewing
              </button>
            </div>
          )}
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </LanguageProvider>
  );
}
