"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, get, set } from "firebase/database";
import { Loader2, Save, Building2, Phone, Mail, MapPin } from "lucide-react";

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    companyName: "N D SUHAGIYA",
    contactNumber: "+91 98254 49310",
    email: "ndsuhagiya@gmail.com",
    address: "A-602 Corona Heights, Near Amar Jawan Circle, Nikol Gam Road, Ahmedabad",
    instagramUrl: "",
    facebookUrl: "",
    twitterUrl: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = ref(db, `users/admin/settings/companyProfile`);
        const snapshot = await get(settingsRef);
        
        if (snapshot.exists()) {
          setFormData((prev) => ({
            ...prev,
            ...snapshot.val()
          }));
        }
      } catch (error) {
        console.error("Error fetching system settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const settingsRef = ref(db, `users/admin/settings/companyProfile`);
      await set(settingsRef, formData);
      setMessage({ type: "success", text: "System settings published successfully! Changes will now appear on the website." });
      setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: error.message || "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
        <p className="text-sm font-medium text-stone-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl relative">
      <div className="sticky -top-4 sm:-top-6 lg:-top-8 z-10 bg-stone-50/95 backdrop-blur-md pt-4 sm:pt-6 lg:pt-8 pb-4 mb-2 border-b border-stone-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            System Settings
          </h1>
          <p className="text-sm font-medium text-stone-500">
            Update the global company information that appears on the website's footer and contact sections.
          </p>
        </div>
        <button
          type="submit"
          form="settingsForm"
          disabled={saving}
          className="inline-flex shrink-0 items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 focus:ring-4 focus:ring-amber-500/20 transition-all shadow-md shadow-amber-600/20 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Publishing..." : "Publish Settings"}
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 overflow-hidden">
        {/* Form Header */}
        <div className="px-6 py-5 border-b border-stone-100 bg-stone-50/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Building2 size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Company Profile</h2>
            <p className="text-xs text-stone-500 font-medium">This information is public and visible to clients.</p>
          </div>
        </div>

        <form id="settingsForm" onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? '✨' : '⚠️'}
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div className="space-y-1.5">
              <label htmlFor="companyName" className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                <Building2 size={15} className="text-stone-400" />
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-colors"
                placeholder="N D SUHAGIYA"
              />
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label htmlFor="contactNumber" className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                <Phone size={15} className="text-stone-400" />
                Mobile Number
              </label>
              <input
                type="text"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-colors"
                placeholder="+91 98000 00000"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                <Mail size={15} className="text-stone-400" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-colors"
                placeholder="contact@company.com"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                <MapPin size={15} className="text-stone-400" />
                Office Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-colors resize-y"
                placeholder="Full office address..."
              />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-stone-100">
            <h3 className="text-sm font-bold text-stone-900 mb-4">Social Media Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Instagram URL */}
              <div className="space-y-1.5">
                <label htmlFor="instagramUrl" className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                  <svg className="w-[15px] h-[15px] text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                  Instagram URL
                </label>
                <input
                  type="url"
                  id="instagramUrl"
                  name="instagramUrl"
                  value={formData.instagramUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-colors"
                  placeholder="https://instagram.com/..."
                />
              </div>

              {/* Facebook URL */}
              <div className="space-y-1.5">
                <label htmlFor="facebookUrl" className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                  <svg className="w-[15px] h-[15px] text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                  Facebook URL
                </label>
                <input
                  type="url"
                  id="facebookUrl"
                  name="facebookUrl"
                  value={formData.facebookUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-colors"
                  placeholder="https://facebook.com/..."
                />
              </div>

              {/* Twitter URL */}
              <div className="space-y-1.5">
                <label htmlFor="twitterUrl" className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                  <svg className="w-[15px] h-[15px] text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                  Twitter URL
                </label>
                <input
                  type="url"
                  id="twitterUrl"
                  name="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-colors"
                  placeholder="https://twitter.com/..."
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
