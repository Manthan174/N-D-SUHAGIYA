"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { Clock, Send, AlertCircle, Building2, User, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { getTargetUserId } from "@/lib/db";

export default function SessionPage() {
  const { t } = useLanguage();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success">("idle");

  useEffect(() => {
    const fetchUserData = async () => {
      const targetUid = getTargetUserId();
      if (targetUid) {
        try {
          const { firestore } = await import("@/lib/firebase");
          const { doc, getDoc } = await import("firebase/firestore");
          const userDoc = await getDoc(doc(firestore, "users", targetUid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("submitting");
    
    try {
      const formData = new FormData(e.currentTarget);
      const { firestore } = await import("@/lib/firebase");
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      
      await addDoc(collection(firestore, "admin_messages"), {
        userId: auth.currentUser?.uid || "unknown",
        name: formData.get("name"),
        companyName: formData.get("company"),
        description: formData.get("description"),
        createdAt: serverTimestamp()
      });
      
      setFormStatus("success");
      setTimeout(() => setFormStatus("idle"), 4000);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
      setFormStatus("idle");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="border-b border-stone-200 pb-6">
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">{t("Session") || "Session Details"}</h1>
        <p className="mt-2 text-sm text-stone-500 max-w-2xl">
          View your session expiration details and contact the administrator.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Expiration Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Clock className="w-32 h-32 text-amber-600" />
            </div>
            <div className="flex justify-between items-start mb-6">
              <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100/50">
                <Clock className="w-7 h-7" />
              </div>
            </div>
            <div>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1.5">Session Expiration Date</p>
              {userData?.trialExpiresAt ? (
                <p className="text-2xl font-extrabold text-stone-900 tracking-tight">
                  {new Date(userData.trialExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              ) : (
                <p className="text-2xl font-extrabold text-stone-900 tracking-tight">Lifetime Access</p>
              )}
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
            <h4 className="flex items-center gap-2 font-bold text-amber-900 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Need Help?
            </h4>
            <p className="text-sm text-amber-800 leading-relaxed">
              If your session is about to expire, please reach out to the administrator using the form to upgrade your account and extend your access.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
            <div className="mb-8">
              <h2 className="text-xl font-extrabold text-stone-900 tracking-tight mb-2">Contact Admin</h2>
              <p className="text-sm text-stone-500">Send a direct message to the administrator regarding your session.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {formStatus === "success" && (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="font-semibold text-sm">Message sent successfully! The admin will get back to you soon.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-stone-900 mb-2">
                    Your Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      defaultValue={userData?.name || ""}
                      className="block w-full pl-11 pr-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-semibold text-stone-900 mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      required
                      defaultValue={userData?.shopName || ""}
                      className="block w-full pl-11 pr-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all"
                      placeholder="Your Shop Name"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-stone-900 mb-2">
                  Description
                </label>
                <div className="relative">
                  <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none">
                    <FileText className="h-5 w-5 text-stone-400" />
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    required
                    className="block w-full pl-11 pr-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all resize-none"
                    placeholder="Describe your request to extend the session..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formStatus === "submitting"}
                  className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-transparent text-sm font-bold rounded-xl text-stone-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                >
                  {formStatus === "submitting" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {formStatus === "submitting" ? "Sending..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
        
      </div>
    </div>
  );
}
