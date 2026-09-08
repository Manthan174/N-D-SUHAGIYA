"use client";

import { useState, useEffect } from "react";
import { superAdminFirestore as firestore } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, deleteField } from "firebase/firestore";
import { Loader2, Clock, Building2, Phone, Mail, Calendar, AlertCircle, Shield, X, Save, Eye, MessageSquare, Send, Edit, LayoutDashboard, TrendingUp, CreditCard, Box } from "lucide-react";
import Link from "next/link";
import UserStatsModal from "@/components/UserStatsModal";
import EditUserModal from "@/components/EditUserModal";
import { DASHBOARD_MODULES } from "@/lib/dashboardModules";


export default function TrialUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);
  
  // Permission Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [statsUser, setStatsUser] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [moveSubUser, setMoveSubUser] = useState<any | null>(null);
  const [subExpiryDate, setSubExpiryDate] = useState<string>("");
  const [movingSub, setMovingSub] = useState(false);

  useEffect(() => {
    // Fetch trial users from Firestore
    const q = query(collection(firestore, "trial_users"), orderBy("createdAt", "desc"));
    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching trial users:", error);
      const fallbackQ = query(collection(firestore, "trial_users"));
      onSnapshot(fallbackQ, (fallbackSnap) => {
        const list = fallbackSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(list);
        setLoading(false);
      }, (fallbackError) => {
        console.error("Error fetching users fallback:", fallbackError);
        setLoading(false);
      });
    });

    // Fetch available modules
    const mQ = query(collection(firestore, "superadmin_modules"), orderBy("createdAt", "asc"));
    const unsubscribeModules = onSnapshot(mQ, (snapshot) => {
      const mods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setModules(mods);
    }, (err) => {
      console.error(err);
      const fallbackMQ = query(collection(firestore, "superadmin_modules"));
      onSnapshot(fallbackMQ, (snap) => setModules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (fallbackErr) => {
        console.error("Error fetching modules fallback:", fallbackErr);
      });
    });

    return () => {
      unsubscribeUsers();
      unsubscribeModules();
    };
  }, []);

  const openPermissionSidebar = (user: any) => {
    setSelectedUser(user);
    setUserPermissions(user.permissions || {});
    setSidebarOpen(true);
  };

  const togglePermission = (moduleId: string) => {
    setUserPermissions(prev => {
      const currentVal = prev[moduleId] !== false;
      const newVal = !currentVal;
      return {
        ...prev,
        [moduleId]: newVal
      };
    });
  };

  const savePermissions = async () => {
    if (!selectedUser) return;
    setSavingPermissions(true);
    try {
      const userRef = doc(firestore, "trial_users", selectedUser.id);
      await updateDoc(userRef, {
        permissions: userPermissions
      });
      // Also update in users collection to keep in sync
      const mainUserRef = doc(firestore, "users", selectedUser.id);
      await updateDoc(mainUserRef, {
        permissions: userPermissions
      }).catch(e => console.log("User doc might not exist yet", e));
      
      setSelectedUser({ ...selectedUser, permissions: userPermissions });
      setSidebarOpen(false);
    } catch (error) {
      console.error("Error saving permissions:", error);
      alert("Failed to save permissions. Please try again.");
    } finally {
      setSavingPermissions(false);
    }
  };

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { superAdminFirestore: firestore } = await import("@/lib/firebase");
      const userRef = doc(firestore, "trial_users", userId);
      await updateDoc(userRef, { isActive: !currentStatus });
      
      const mainUserRef = doc(firestore, "users", userId);
      await updateDoc(mainUserRef, { isActive: !currentStatus }).catch(e => console.log("User doc might not exist yet", e));
    } catch (err) {
      console.error("Error updating user active status:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const handleBulkReminders = () => {
    // Find users whose trial expires in exactly 2 days
    const expiringUsers = users.filter(user => {
      if (!user.trialExpiresAt || !user.mobile) return false;
      const trialExpiresAt = new Date(user.trialExpiresAt);
      const today = new Date();
      // Calculate difference in days (ignoring time)
      const diffTime = trialExpiresAt.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays === 2;
    });

    if (expiringUsers.length === 0) {
      alert("No users found whose trial is expiring in exactly 2 days with a valid mobile number.");
      return;
    }

    if (!confirm(`Found ${expiringUsers.length} user(s) expiring in 2 days. This will generate and open a pre-filled WhatsApp chat for each user. Continue?`)) return;

    // Generate WhatsApp links
    expiringUsers.forEach((user, index) => {
      // Small delay between opens so the browser doesn't block them as aggressive popups
      setTimeout(() => {
        const companyName = "N D Suhagiya";
        const startDate = user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";
        const expiryDate = new Date(user.trialExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        
        const text = `Hello *${user.name || "Valued Customer"}*, 👋\n\nWe hope you are enjoying your experience with *${companyName}*!\n\nThis is a gentle reminder regarding your current trial subscription.\n\n📅 *Trial Started:* ${startDate}\n⏳ *Trial Expires:* ${expiryDate}\n\nYour trial will expire in exactly *2 Days*. To ensure uninterrupted access to all our premium features and maintain your business workflow smoothly, please upgrade your subscription before the expiry date.\n\nIf you need any assistance or have questions, feel free to reply to this message!\n\nBest regards,\n*The ${companyName} Team* 💎`;
        
        const encodedText = encodeURIComponent(text);
        const mobile = user.mobile.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${mobile}?text=${encodedText}`, '_blank');
      }, index * 800); // 800ms delay between opens
    });
  };
  const handleMoveToSubscriptionClick = (user: any) => {
    setMoveSubUser(user);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setSubExpiryDate(nextYear.toISOString().split('T')[0]);
  };

  const confirmMoveToSubscription = async () => {
    if (!moveSubUser || !subExpiryDate) return;
    setMovingSub(true);
    
    try {
      const userRef = doc(firestore, "users", moveSubUser.id);
      await updateDoc(userRef, {
        trialExpiresAt: deleteField(),
        subscriptionExpiresAt: new Date(subExpiryDate).toISOString()
      });
      
      const trialUserRef = doc(firestore, "trial_users", moveSubUser.id);
      await deleteDoc(trialUserRef);
      
      alert("User successfully moved to Subscription!");
      setMoveSubUser(null);
    } catch (err) {
      console.error("Error moving user to subscription:", err);
      alert("Failed to move user to subscription.");
    } finally {
      setMovingSub(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col w-full">
      <div className="flex-1 transition-all duration-300">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
              <Clock className="w-7 h-7 text-amber-500" />
              Trial Users
            </h1>
            <p className="text-stone-500 mt-1">Manage users currently on the 7-day free trial</p>
          </div>
          <button
            onClick={handleBulkReminders}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white hover:bg-[#20bd5a] font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Send className="w-4 h-4" />
            Send 2-Day Reminders
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-4">Business / User</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Registered On</th>
                  <th className="px-6 py-4">Trial Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                      No trial users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : null;
                    const trialExpiresAt = user.trialExpiresAt ? new Date(user.trialExpiresAt) : null;
                    const isExpired = trialExpiresAt ? trialExpiresAt < new Date() : false;
                    
                    return (
                      <tr key={user.id} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-stone-400" />
                            <span className="font-bold text-stone-900">{user.shopName || "Unknown Shop"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-stone-500 text-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                            {user.name || "Unknown Name"}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-2 mb-1 text-stone-700">
                            <Mail className="w-3.5 h-3.5 text-stone-400" />
                            {user.emailId || user.email || "-"}
                          </div>
                          <div className="flex items-center gap-2 text-stone-500 text-xs">
                            <Phone className="w-3.5 h-3.5 text-stone-400" />
                            {user.mobile || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          {createdAt ? (
                            <div className="flex items-center gap-1.5 text-stone-600 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-stone-400" />
                              {createdAt.toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric"
                              })}
                            </div>
                          ) : (
                            <span className="text-stone-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <button
                            onClick={() => toggleUserActive(user.id, user.isActive !== false)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              user.isActive !== false ? 'bg-emerald-500' : 'bg-stone-300'
                            }`}
                            title={user.isActive !== false ? "Disable User" : "Enable User"}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                user.isActive !== false ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <div className="mt-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${user.isActive !== false ? 'text-emerald-600' : 'text-stone-500'}`}>
                              {user.isActive !== false ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                          
                          {/* Keep the trial status below it */}
                          <div className="mt-2">
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                                Expired
                              </span>
                            ) : (
                              <span className="inline-flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 w-fit">
                                  Trial
                                </span>
                                {trialExpiresAt && (
                                  <span className="text-[9px] text-stone-400 font-medium">
                                    Ends: {trialExpiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-right space-x-2">
                          <Link
                            href={`/superadmin/view/${user.id}`}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors border border-transparent hover:border-amber-200"
                            title="View Dashboard (Impersonate)"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleMoveToSubscriptionClick(user)}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-200"
                            title="Move to Subscription"
                          >
                            <CreditCard className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setStatsUser(user)}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                            title="View Statistics"
                          >
                            <TrendingUp className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setEditUser(user)}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-stone-400 hover:text-purple-600 hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-200"
                            title="Edit User Details"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          {user.mobile && (
                            <a
                              href={`https://wa.me/${user.mobile.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-2 rounded-lg text-stone-400 hover:text-green-600 hover:bg-green-50 transition-colors border border-transparent hover:border-green-200"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-5 h-5" />
                            </a>
                          )}
                          <button
                            onClick={() => openPermissionSidebar(user)}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors border border-transparent hover:border-amber-200"
                            title="Manage Permissions"
                          >
                            <Shield className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile / Tablet Card View */}
        {users.length === 0 ? (
          <div className="lg:hidden p-8 text-center text-stone-500 bg-white rounded-xl border border-stone-200">
            No trial users found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {users.map((user) => {
              const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : null;
              const trialExpiresAt = user.trialExpiresAt ? new Date(user.trialExpiresAt) : null;
              const isExpired = trialExpiresAt ? trialExpiresAt < new Date() : false;
              const isActive = user.isActive !== false;

              return (
                <div key={user.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-stone-400" />
                          <h3 className="font-bold text-stone-900 text-base">{user.shopName || "Unknown Shop"}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-stone-500 text-xs mt-1">
                          <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                          <span>{user.name || "Unknown Name"}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => toggleUserActive(user.id, isActive)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isActive ? 'bg-emerald-500' : 'bg-stone-300'
                          }`}
                          title={isActive ? "Disable User" : "Enable User"}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-emerald-600' : 'text-stone-500'}`}>
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    {/* Trial Expiry info badge inside the card */}
                    <div className="mb-4">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                            Trial
                          </span>
                          {trialExpiresAt && (
                            <span className="text-[10px] text-stone-500 font-bold bg-stone-50 px-2 py-1 rounded-md border border-stone-100">
                              Ends: {trialExpiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-2 bg-stone-50/50 p-3.5 rounded-xl border border-stone-100 text-xs mb-5">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 font-medium">Email:</span>
                        <span className="text-stone-700 font-semibold truncate max-w-[180px]">{user.emailId || user.email || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 font-medium">Mobile:</span>
                        <a href={`tel:${user.mobile}`} className="text-amber-600 font-bold hover:underline">{user.mobile || "-"}</a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 font-medium">Registered:</span>
                        <span className="text-stone-700 font-semibold">
                          {createdAt ? createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 border-t border-stone-100 pt-4 mt-auto">
                    <Link
                      href={`/superadmin/view/${user.id}`}
                      className="flex flex-col items-center justify-center p-2 rounded-xl text-stone-500 hover:text-amber-600 hover:bg-amber-50 border border-stone-200/60 hover:border-amber-200 transition-all gap-1"
                      title="View Dashboard"
                    >
                      <Eye className="w-5 h-5" />
                      <span className="text-[9px] font-bold">View</span>
                    </Link>

                    <button
                      onClick={() => handleMoveToSubscriptionClick(user)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 border border-stone-200/60 hover:border-emerald-200 transition-all gap-1"
                      title="Move to Subscription"
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="text-[9px] font-bold">Move Sub</span>
                    </button>

                    <button
                      onClick={() => setStatsUser(user)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl text-stone-500 hover:text-blue-600 hover:bg-blue-50 border border-stone-200/60 hover:border-blue-200 transition-all gap-1"
                      title="View Statistics"
                    >
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-[9px] font-bold">Stats</span>
                    </button>

                    <button
                      onClick={() => setEditUser(user)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl text-stone-500 hover:text-purple-600 hover:bg-purple-50 border border-stone-200/60 hover:border-purple-200 transition-all gap-1"
                      title="Edit Details"
                    >
                      <Edit className="w-5 h-5" />
                      <span className="text-[9px] font-bold">Edit</span>
                    </button>

                    {user.mobile ? (
                      <a
                        href={`https://wa.me/${user.mobile.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-2 rounded-xl text-stone-500 hover:text-green-600 hover:bg-green-50 border border-stone-200/60 hover:border-green-200 transition-all gap-1"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Chat</span>
                      </a>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 rounded-xl text-stone-300 border border-stone-100 cursor-not-allowed gap-1">
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Chat</span>
                      </div>
                    )}

                    <button
                      onClick={() => openPermissionSidebar(user)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl text-stone-500 hover:text-amber-600 hover:bg-amber-50 border border-stone-200/60 hover:border-amber-200 transition-all gap-1"
                      title="Manage Permissions"
                    >
                      <Shield className="w-5 h-5" />
                      <span className="text-[9px] font-bold">Perms</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Permission Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Permission Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white border-l border-stone-200 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 bg-stone-50/50">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              Module Permissions
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-1 truncate max-w-[250px]">
              {selectedUser?.shopName || "User"}
            </p>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {[...DASHBOARD_MODULES, ...modules].length === 0 ? (
            <div className="text-center py-10 text-stone-400">
              No modules found. Please create modules first.
            </div>
          ) : (
            <div className="space-y-3">
              {[...DASHBOARD_MODULES, ...modules].map((mod) => {
                const isActive = userPermissions[mod.id] !== false;
                return (
                  <div key={mod.id} className="space-y-2">
                    <div 
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        isActive ? "bg-amber-50/50 border-amber-200" : "bg-white border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {mod.icon ? (
                          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                            <mod.icon className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                            <Box className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-stone-900">{mod.name}</p>
                          <p className="text-[11px] text-stone-500 mt-0.5 font-medium">{mod.slug || "System Module"}</p>
                        </div>
                      </div>
                      
                      {/* Custom Toggle */}
                      <button
                        onClick={() => togglePermission(mod.id)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isActive ? 'bg-amber-500' : 'bg-stone-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Sub-modules */}
                    {isActive && mod.subItems && mod.subItems.length > 0 && (
                      <div className="pl-6 space-y-2 relative before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-stone-200">
                        {mod.subItems.map((sub: any) => {
                          const isSubActive = userPermissions[sub.id] !== false;
                          return (
                            <div 
                              key={sub.id} 
                              className={`flex items-center justify-between p-3 rounded-lg border transition-colors relative before:absolute before:left-[-12px] before:top-1/2 before:w-3 before:h-px before:bg-stone-200 ${
                                isSubActive ? "bg-amber-50/30 border-amber-100" : "bg-white border-stone-100"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {sub.icon && <sub.icon className="w-4 h-4 text-stone-400" />}
                                <p className="text-xs font-semibold text-stone-700">{sub.name}</p>
                              </div>
                              <button
                                onClick={() => togglePermission(sub.id)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isSubActive ? 'bg-amber-400' : 'bg-stone-200'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    isSubActive ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-stone-100 bg-stone-50">
          <button
            onClick={savePermissions}
            disabled={savingPermissions}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #1C1409, #382812)" }}
          >
            {savingPermissions ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4 text-amber-500" />
            )}
            Save Permissions
          </button>
        </div>
      </div>

      {/* User Stats Modal */}
      {statsUser && (
        <UserStatsModal 
          userId={statsUser.id} 
          shopName={statsUser.shopName || statsUser.name || "Unknown Shop"} 
          onClose={() => setStatsUser(null)} 
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          collectionName="trial_users"
          onClose={() => setEditUser(null)}
          onSuccess={(updatedUser) => {
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            setEditUser(null);
          }}
        />
      )}
      {moveSubUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                Move to Subscription
              </h2>
              <button 
                onClick={() => setMoveSubUser(null)}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-stone-700 mb-1">User / Business</p>
                <p className="text-stone-600 bg-stone-50 px-3 py-2 rounded-lg border border-stone-100">{moveSubUser.shopName} ({moveSubUser.name})</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Subscription Expires On</label>
                <input 
                  type="date"
                  value={subExpiryDate}
                  onChange={(e) => setSubExpiryDate(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-stone-100 flex justify-end gap-3 bg-stone-50/50">
              <button
                onClick={() => setMoveSubUser(null)}
                className="px-4 py-2 text-sm font-bold text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-colors"
                disabled={movingSub}
              >
                Cancel
              </button>
              <button
                onClick={confirmMoveToSubscription}
                className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-2"
                disabled={movingSub || !subExpiryDate}
              >
                {movingSub && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
