"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, firestore } from "@/lib/firebase";
import { ref, get, set } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, Save, Building2, Image as ImageIcon, Mail, Phone, MapPin, Globe } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageCode } from "@/lib/translations";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    companyName: "Your Company",
    logoUrl: "",
    contactNumber: "9825449310",
    address: "A-602 Corona Heights Near Amar Jawan Circle,\nNikol Gam Road, Ahmedabad",
    email: "ndsuhagiya@gmail.com",
    marqueeText: "✨ Did you know? You can change your company name, add a custom logo, update your mobile number, address, and email! Just go to Settings, update your details, click Save Changes, and it will reflect across your entire dashboard instantly! ✨",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userId = auth.currentUser?.uid || 'admin';
        const settingsRef = ref(db, `users/${userId}/settings/companyProfile`);
        const snapshot = await get(settingsRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          setFormData((prev) => ({
            ...prev,
            ...data
          }));
        } else if (userId !== 'admin') {
          // If no custom settings exist yet, try to load registration defaults from Firestore
          const userDoc = await getDoc(doc(firestore, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFormData((prev) => ({
              ...prev,
              companyName: userData.shopName || prev.companyName,
              contactNumber: userData.mobile || prev.contactNumber,
              email: userData.emailId || prev.email,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "contactNumber") {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    if (formData.contactNumber && formData.contactNumber.length !== 10) {
      setMessage({ type: "error", text: t("MustBe10Digits") });
      setSaving(false);
      return;
    }

    try {
      const userId = auth.currentUser?.uid || 'admin';
      const settingsRef = ref(db, `users/${userId}/settings/companyProfile`);
      await set(settingsRef, formData);
      setMessage({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 4000);
      setSaving(false);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings. Please try again." });
      setSaving(false);
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
    <div className="max-w-6xl mx-auto pb-12">
      <form onSubmit={handleSave} className="space-y-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">{t("CompanySettings")}</h1>
            <p className="mt-2 text-sm text-stone-500 max-w-2xl">
              {t("ManageCoreDetails")}
            </p>
          </div>
          <div className="shrink-0">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3 border border-transparent text-sm font-bold rounded-xl text-stone-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {t("SaveChanges")}
            </button>
          </div>
        </div>

        <div className="space-y-12">
        {message.text && (
          <div className={`p-4 rounded-xl text-sm font-medium border flex items-center shadow-sm ${
            message.type === 'success' 
              ? 'bg-green-50/50 text-green-700 border-green-200/60' 
              : 'bg-red-50/50 text-red-700 border-red-200/60'
          }`}>
            {message.text}
          </div>
        )}

        {/* Section 1: Branding */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-stone-900">{t("Branding")}</h2>
            <p className="mt-1 text-sm text-stone-500">
              {t("BrandingDesc")}
            </p>
          </div>
          
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8 space-y-6">
            
            {/* Logo URL */}
            <div>
              <label htmlFor="logoUrl" className="block text-sm font-semibold text-stone-900 mb-2">
                {t("CompanyLogo")}
              </label>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="shrink-0 h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center overflow-hidden relative group transition-all hover:border-amber-400">
                  {formData.logoUrl ? (
                    <img 
                      src={formData.logoUrl} 
                      alt="Logo Preview" 
                      className="h-full w-full object-contain p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                      }}
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-stone-300 mb-1" />
                  )}
                </div>

                <div className="flex-1 w-full relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none mt-0.5">
                    <ImageIcon className="h-5 w-5 text-stone-400" />
                  </div>
                  <input
                    type="url"
                    id="logoUrl"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/your-logo.png"
                    className="block w-full pl-11 pr-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all placeholder:text-stone-400"
                  />
                  <p className="mt-2.5 text-xs text-stone-500">
                    {t("CompanyLogoDesc")}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-stone-100 my-2"></div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-semibold text-stone-900 mb-2">
                {t("CompanyName")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="block w-full pl-11 pr-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all"
                />
              </div>
            </div>

            <div className="w-full h-px bg-stone-100 my-2"></div>

            {/* Marquee Text */}
            <div>
              <label htmlFor="marqueeText" className="block text-sm font-semibold text-stone-900 mb-2">
                Dashboard Marquee Text
              </label>
              <textarea
                id="marqueeText"
                name="marqueeText"
                rows={2}
                value={formData.marqueeText}
                onChange={handleChange}
                placeholder="Enter the scrolling text for your dashboard..."
                className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all resize-none"
              />
              <p className="mt-2 text-xs text-stone-500">
                This text will scroll at the top of your dashboard.
              </p>
            </div>

          </div>
        </div>

        <div className="w-full h-px bg-stone-200/60"></div>

        {/* Section 2: Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-stone-900">{t("ContactInfo")}</h2>
            <p className="mt-1 text-sm text-stone-500">
              {t("ContactInfoDesc")}
            </p>
          </div>
          
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8 space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-stone-900 mb-2">
                  {t("EmailAddress")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-stone-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="block w-full pl-11 pr-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-semibold text-stone-900 mb-2">
                  {t("ContactNumber")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-stone-400" />
                  </div>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="1234567890"
                    className="block w-full pl-11 pr-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all"
                  />
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  {t("MustBe10Digits")}
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-stone-100 my-2"></div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-stone-900 mb-2">
                {t("PhysicalAddress")}
              </label>
              <div className="relative">
                <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none">
                  <MapPin className="h-5 w-5 text-stone-400" />
                </div>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Jewellery Lane&#10;Suite 100&#10;New York, NY 10001"
                  className="block w-full pl-11 pr-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all resize-none"
                />
              </div>
            </div>

          </div>
        </div>
        </div>
      </form>
    </div>
  );
}
