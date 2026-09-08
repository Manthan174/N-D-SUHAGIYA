"use client";

import { useState } from "react";
import { Loader2, X, User, Phone, Mail, Building2, Calendar, Save, Lock, Eye, EyeOff, FileText, CheckCircle2 } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface EditUserModalProps {
  user: any;
  collectionName: string;
  onClose: () => void;
  onSuccess: (updatedUser: any) => void;
}

export default function EditUserModal({ user, collectionName, onClose, onSuccess }: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    shopName: user.shopName || "",
    slug: user.slug || "",
    mobile: user.mobile || "",
    emailId: user.emailId || user.email || "",
    password: user.password || "",
    expiresAt: user.trialExpiresAt 
      ? new Date(user.trialExpiresAt).toISOString().split('T')[0] 
      : user.subscriptionExpiresAt 
        ? new Date(user.subscriptionExpiresAt).toISOString().split('T')[0] 
        : "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updates: any = {
        name: formData.name,
        shopName: formData.shopName,
        slug: formData.slug,
        mobile: formData.mobile,
        emailId: formData.emailId,
        password: formData.password,
      };

      if (formData.expiresAt) {
        if (collectionName === "trial_users") {
          updates.trialExpiresAt = new Date(formData.expiresAt).toISOString();
        } else {
          updates.subscriptionExpiresAt = new Date(formData.expiresAt).toISOString();
        }
      }

      // Update in specific collection
      const collectionRef = doc(firestore, collectionName, user.id);
      await updateDoc(collectionRef, updates);

      // Update in main users collection
      const userRef = doc(firestore, "users", user.id);
      await updateDoc(userRef, updates).catch(e => console.log("Main user doc might not exist", e));

      onSuccess({ ...user, ...updates });
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl md:max-w-2xl lg:max-w-4xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/80">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            Edit User Details
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-stone-400" />
              Shop Name
            </label>
            <input
              type="text"
              name="shopName"
              required
              value={formData.shopName}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-stone-900 font-medium"
              placeholder="Enter shop name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-400" />
                Owner Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-stone-900 font-medium"
                placeholder="Enter owner name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                Slug (URL Path)
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-stone-900 font-medium"
                placeholder="e.g. shreeji-jewellers"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                Mobile
              </label>
              <input
                type="tel"
                name="mobile"
                required
                value={formData.mobile}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-stone-900 font-medium"
                placeholder="Mobile number"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                Expiry Date
              </label>
              <input
                type="date"
                name="expiresAt"
                required
                value={formData.expiresAt}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-stone-900 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                Email ID
              </label>
              <input
                type="email"
                name="emailId"
                required
                value={formData.emailId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-stone-900 font-medium"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-stone-400" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-stone-900 font-medium pr-10"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 mt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-amber-500" />
              Terms & Conditions
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Agreed to Terms:</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                {user.termsAccepted ? "Accepted" : "Implicit (Completed signup)"}
              </span>
            </div>
            {user.termsAcceptedAt && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500">Accepted At:</span>
                <span className="font-semibold text-stone-800">
                  {new Date(user.termsAcceptedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-stone-500 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
