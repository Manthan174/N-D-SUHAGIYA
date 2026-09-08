"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Gem, ArrowLeft, Loader2, LogOut, Users, ChevronDown, ChevronRight, LayoutDashboard, CreditCard, Paintbrush, Menu, X, Clock, Settings, Box, Plus, Globe, LayoutTemplate, Shield, Mail, ChevronUp, MessageSquare, Bell, Calendar, Search, BarChart, Layers, Trash2 } from "lucide-react";
import { superAdminAuth, superAdminFirestore, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { ref, onValue, update } from "firebase/database";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>("Client");

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
  const [customModules, setCustomModules] = useState<any[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
  // Notifications
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(superAdminAuth, (user) => {
      if (user && user.email === "ndsuhagiyasuper@gmail.com") {
        sessionStorage.setItem("superadmin_session", "true");
        setLoading(false);
      } else if (pathname !== "/superadmin/login") {
        if (user) {
          signOut(superAdminAuth);
        }
        sessionStorage.removeItem("superadmin_session");
        router.push("/superadmin/login");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  useEffect(() => {
    const q = query(collection(superAdminFirestore, "superadmin_modules"), orderBy("createdAt", "asc"));
    const unsubscribeModules = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomModules(list);
    }, (err) => {
      console.error(err);
      const q2 = query(collection(superAdminFirestore, "superadmin_modules"));
      onSnapshot(q2, (snap2) => {
        const list2 = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomModules(list2);
      });
    });

    return () => unsubscribeModules();
  }, []);

  useEffect(() => {
    // Fetch latest contact messages for notifications
    const messagesRef = ref(db, "website/contactMessages");
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.createdAt - a.createdAt).slice(0, 5); // top 5
        setContactMessages(msgs);
      } else {
        setContactMessages([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      sessionStorage.removeItem("superadmin_session");
      sessionStorage.removeItem("impersonated_user_id");
      sessionStorage.removeItem("impersonated_user_email");
      await signOut(superAdminAuth);
      router.push("/superadmin/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleNotificationClick = async (msg: any) => {
    setNotificationsOpen(false);
    if (!msg.isViewed) {
      try {
        const msgRef = ref(db, `website/contactMessages/${msg.id}`);
        await update(msgRef, { isViewed: true });
      } catch (error) {
        console.error("Failed to mark notification as viewed", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
        <p className="text-sm font-medium text-stone-500">Authenticating...</p>
      </div>
    );
  }

  const navigation = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      href: "/superadmin/dashboard"
    },
    {
      name: 'Analytics',
      icon: BarChart,
      href: "/superadmin/analytics"
    },
    {
      name: 'Collection',
      icon: Layers,
      href: "/superadmin/collection"
    },
    {
      name: 'Client',
      icon: Users,
      subItems: [
        { name: 'Subscription', href: "/superadmin/clients/subscription", icon: CreditCard },
        { name: 'Trial', href: "/superadmin/clients/trial", icon: Clock },
        { name: 'White Label', href: "/superadmin/clients/whitelabel", icon: Paintbrush }
      ]
    },
    {
      name: 'System Modules',
      icon: Settings,
      subItems: [
        { name: 'System Trash', href: "/superadmin/trash", icon: Trash2 },
        { name: 'Module Generator', href: "/superadmin/modules", icon: Plus },
        ...customModules.map(mod => ({
          name: mod.name,
          href: `/superadmin/${mod.slug}`,
          icon: Box
        }))
      ]
    },
    {
      name: 'Website Manager',
      icon: Globe,
      subItems: [
        { name: 'Home Page Setup', href: "/superadmin/website/home", icon: LayoutTemplate },
        { name: 'Contact Us', href: "/superadmin/contact", icon: MessageSquare },
        { name: 'Footer', href: "/superadmin/website/footer", icon: Box }
      ]
    }
  ];

  const toggleMenu = (name: string) => {
    setExpandedMenu(prev => {
      if (prev === name) return null;
      return name;
    });
  };

  const handleNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // For the login page, render without sidebar and top navbar
  if (pathname === "/superadmin/login") {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    );
  }

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
        <div className={`h-16 flex items-center shrink-0 border-b border-stone-200 ${sidebarOpen ? "justify-between px-4 lg:px-6" : "justify-center px-2"}`}>
          {sidebarOpen ? (
            <>
              <Link href="/superadmin" className="flex items-center gap-3 flex-1 overflow-hidden">
                <div className="h-8 w-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shadow-inner shrink-0">
                  <Gem className="h-5 w-5" />
                </div>
                <span className="text-lg font-extrabold text-stone-900 tracking-tight truncate">
                  N D Suhagiya
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
              const isParentActive = item.href ? pathname === item.href : false;
              const isAnySubActive = item.subItems?.some(sub => pathname === sub.href) || false;
              const isActive = isParentActive || isAnySubActive;
              const isExpanded = expandedMenu === item.name || (expandedMenu === null && isAnySubActive);
              const targetHref = item.href || (item.subItems && item.subItems[0]?.href) || "/superadmin";

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
                        <item.icon className={`h-5 w-5 ${isActive ? "text-amber-600" : "text-stone-400"}`} />
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                        ? "bg-amber-50 text-amber-700"
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                        }`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? "text-amber-600" : "text-stone-400"}`} />
                      {item.name}
                    </Link>
                  )}

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
                            <sub.icon className={`h-4 w-4 ${isSubActive ? "text-amber-600" : "text-stone-400"}`} />
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

        <div className={`p-4 border-t border-stone-200 shrink-0 ${sidebarOpen ? "" : "flex flex-col items-center gap-2"}`}>
          {sidebarOpen ? (
            <>
              <Link
                href="/dashboard"
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors mb-1"
              >
                <LayoutDashboard className="h-5 w-5 text-stone-400" />
                Back to Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5 text-red-500" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                title="Back to Dashboard"
                className="flex items-center justify-center h-10 w-10 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <LayoutDashboard className="h-5 w-5 text-stone-500" />
              </Link>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="flex items-center justify-center h-10 w-10 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5 text-red-500" />
              </button>
            </>
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
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-stone-900 hidden sm:block">Control Panel</span>
                  <Link href="/superadmin" className="flex lg:hidden items-center gap-2 shrink-0">
                    <div className="h-7 w-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shadow-inner shrink-0">
                      <Gem className="h-4 w-4" />
                    </div>
                    <span className="text-base font-extrabold text-stone-900 tracking-tight truncate">
                      N D Suhagiya
                    </span>
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Date Display */}
                <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-stone-500 bg-stone-100/80 px-3 py-1.5 rounded-full border border-stone-200">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {/* Notification badge dot */}
                    {contactMessages.filter(m => !m.isViewed).length > 0 && (
                      <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500 border border-white"></span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-stone-100 py-2 z-50 transform origin-top-right transition-all">
                      <div className="px-4 py-2 border-b border-stone-100 flex justify-between items-center">
                        <span className="text-sm font-bold text-stone-900">Notifications</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                          {contactMessages.filter(m => !m.isViewed).length} New
                        </span>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {contactMessages.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-stone-500">
                            No new notifications
                          </div>
                        ) : (
                          contactMessages.map((msg) => (
                            <Link 
                              key={msg.id} 
                              href="/superadmin/contact"
                              onClick={() => handleNotificationClick(msg)}
                              className={`block px-4 py-3 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0 ${msg.isViewed ? 'opacity-60 bg-stone-50/50' : 'bg-white'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className={`text-sm ${!msg.isViewed ? 'font-bold text-stone-900' : 'font-semibold text-stone-600'}`}>{msg.name}</p>
                                  <p className={`text-xs truncate max-w-[200px] mt-0.5 ${!msg.isViewed ? 'font-medium text-stone-600' : 'text-stone-500'}`}>{msg.message}</p>
                                </div>
                                {!msg.isViewed && (
                                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5"></div>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-400 mt-2 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                })}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-2 border-t border-stone-100 text-center">
                        <Link 
                          href="/superadmin/contact" 
                          onClick={() => setNotificationsOpen(false)}
                          className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                        >
                          View All Messages
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(prev => !prev)}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all duration-200 hover:bg-stone-100 group"
                    aria-label="Profile menu"
                  >
                    <div className="hidden sm:block text-right">
                      <p className="text-xs font-bold text-stone-800 leading-none">N D Suhagiya</p>
                      <p className="text-[10px] font-medium text-stone-400 mt-0.5">Super Admin</p>
                    </div>
                    <div className="relative">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-amber-200 group-hover:border-amber-400 transition-colors">
                        ND
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white"></span>
                    </div>
                    <ChevronDown className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-200 hidden sm:block ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown panel */}
                  {profileOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-stone-100 z-50 overflow-hidden"
                      style={{ boxShadow: "0 20px 60px rgba(0,0,0,.12), 0 4px 16px rgba(0,0,0,.06)" }}
                    >
                      {/* Profile header */}
                      <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,#100E09 0%,#1C1200 100%)" }}>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-white text-base shadow-lg flex-shrink-0">
                            ND
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-white text-sm truncate">N D Suhagiya</p>
                            <p className="text-xs font-medium truncate mt-0.5" style={{ color: "rgba(201,168,76,.8)" }}>ndsuhagiyasuper@gmail.com</p>
                            <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.25)" }}>
                              <Shield size={9} style={{ color: "#C9A84C" }} />
                              <span style={{ color: "#C9A84C", fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>Super Admin</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info rows */}
                      <div className="px-4 py-3 space-y-2 border-b border-stone-100">
                        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-stone-50">
                          <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <Mail size={14} className="text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Email</p>
                            <p className="text-xs font-semibold text-stone-800 truncate">ndsuhagiyasuper@gmail.com</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-stone-50">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block"></span>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Status</p>
                            <p className="text-xs font-semibold text-emerald-600">Active · Full Access</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="px-4 py-3 space-y-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors w-full"
                        >
                          <LayoutDashboard size={15} className="text-stone-400" />
                          Back to Dashboard
                        </Link>
                        <button
                          onClick={() => { setProfileOpen(false); handleSignOut(); }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors w-full"
                        >
                          <LogOut size={15} className="text-red-400" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
