"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, get, set } from "firebase/database";
import { Loader2, Save, Type, LayoutTemplate, MessageSquare, ListTodo, FileText } from "lucide-react";

export default function HomeSetupPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    heroTitleRegular: "Jewellery Business Management",
    heroTitleHighlighted: "Simplified",
    heroSubtitle: "Your trusted partner in premium Jewellery management. We offer an exclusive software solution for billing, party management, and fine tracking, crafted with elegance and precision.",
    featuresTitle: "Everything you need to run your business",
    featuresSubtitle: "Comprehensive tools designed specifically for wholesale and retail Jewellery.",
    contactTitle: "Get in Touch",
    contactSubtitle: "Have questions about our software? Contact us directly or fill out the form, and we'll get back to you promptly.",
    footerDescription: "Premium Jewellery management software tailored for precision, speed, and elegance."
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const contentRef = ref(db, `website/homepage`);
        const snapshot = await get(contentRef);
        
        if (snapshot.exists()) {
          setFormData((prev) => ({
            ...prev,
            ...snapshot.val()
          }));
        }
      } catch (error) {
        console.error("Error fetching website content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
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
      const contentRef = ref(db, `website/homepage`);
      await set(contentRef, formData);
      setMessage({ type: "success", text: "Home page content saved successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error: any) {
      console.error("Error saving content:", error);
      setMessage({ type: "error", text: "Failed to save content. Please try again." });
    } finally {
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
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Home Page Setup</h1>
            <p className="mt-2 text-sm text-stone-500 max-w-2xl">
              Manage the dynamic text displayed on your main landing page.
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
              Save Changes
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium border flex items-center shadow-sm ${
              message.type === 'success' 
                ? 'bg-green-50/50 text-green-700 border-green-200/60' 
                : 'bg-red-50/50 text-red-700 border-red-200/60'
            }`}>
              {message.text}
            </div>
          )}

          {/* Section 1: Hero Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-amber-600" />
                Hero Section
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                The main headline and subtitle visitors see first when they open your website.
              </p>
            </div>
            
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8 space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="heroTitleRegular" className="block text-sm font-semibold text-stone-900 mb-2">
                    Hero Title (Regular Text)
                  </label>
                  <input
                    type="text"
                    id="heroTitleRegular"
                    name="heroTitleRegular"
                    value={formData.heroTitleRegular}
                    onChange={handleChange}
                    required
                    className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="heroTitleHighlighted" className="block text-sm font-semibold text-stone-900 mb-2">
                    Hero Title (Highlighted)
                  </label>
                  <input
                    type="text"
                    id="heroTitleHighlighted"
                    name="heroTitleHighlighted"
                    value={formData.heroTitleHighlighted}
                    onChange={handleChange}
                    required
                    className="block w-full px-4 py-3 sm:text-sm border border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-amber-700 font-bold bg-amber-50/50 hover:bg-amber-50 transition-all"
                  />
                  <p className="mt-1 text-xs text-stone-500">This part will be styled with the primary amber color.</p>
                </div>
              </div>

              <div>
                <label htmlFor="heroSubtitle" className="block text-sm font-semibold text-stone-900 mb-2">
                  Hero Subtitle
                </label>
                <textarea
                  id="heroSubtitle"
                  name="heroSubtitle"
                  rows={3}
                  value={formData.heroSubtitle}
                  onChange={handleChange}
                  required
                  className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all resize-none"
                />
              </div>

            </div>
          </div>

          <div className="w-full h-px bg-stone-200/60"></div>

          {/* Section 2: Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-amber-600" />
                Features Area
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                The heading and short description right above the 4 feature cards.
              </p>
            </div>
            
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8 space-y-6">
              <div>
                <label htmlFor="featuresTitle" className="block text-sm font-semibold text-stone-900 mb-2">
                  Features Section Title
                </label>
                <input
                  type="text"
                  id="featuresTitle"
                  name="featuresTitle"
                  value={formData.featuresTitle}
                  onChange={handleChange}
                  required
                  className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all"
                />
              </div>

              <div>
                <label htmlFor="featuresSubtitle" className="block text-sm font-semibold text-stone-900 mb-2">
                  Features Section Subtitle
                </label>
                <textarea
                  id="featuresSubtitle"
                  name="featuresSubtitle"
                  rows={2}
                  value={formData.featuresSubtitle}
                  onChange={handleChange}
                  required
                  className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-stone-200/60"></div>

          {/* Section 3: Contact & Footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                Contact & Footer
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Text for the "Get in Touch" area and the bottom footer description.
              </p>
            </div>
            
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8 space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label htmlFor="contactTitle" className="block text-sm font-semibold text-stone-900 mb-2">
                    Contact Section Title
                  </label>
                  <input
                    type="text"
                    id="contactTitle"
                    name="contactTitle"
                    value={formData.contactTitle}
                    onChange={handleChange}
                    required
                    className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="contactSubtitle" className="block text-sm font-semibold text-stone-900 mb-2">
                    Contact Section Subtitle
                  </label>
                  <textarea
                    id="contactSubtitle"
                    name="contactSubtitle"
                    rows={2}
                    value={formData.contactSubtitle}
                    onChange={handleChange}
                    required
                    className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="w-full h-px bg-stone-100 my-4"></div>

              <div>
                <label htmlFor="footerDescription" className="block text-sm font-semibold text-stone-900 mb-2">
                  Footer Description
                </label>
                <textarea
                  id="footerDescription"
                  name="footerDescription"
                  rows={2}
                  value={formData.footerDescription}
                  onChange={handleChange}
                  required
                  className="block w-full px-4 py-3 sm:text-sm border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-amber-500 text-stone-900 bg-stone-50/50 hover:bg-stone-50 transition-all resize-none"
                />
              </div>

            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
