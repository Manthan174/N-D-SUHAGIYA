"use client";

import Link from "next/link";
import {
  Gem, ArrowLeft, Loader2, Eye, EyeOff, Shield,
  CheckCircle2, Zap, Store, Phone, Mail, Lock, User,
} from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

/* ── Floating particle ── */
function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="particle" style={style} />;
}

/* ── Left panel ── */
function BrandPanel({ isTrial }: { isTrial: boolean }) {
  const perks = [
    { icon: "⚡", title: "Instant Setup", desc: "Be live in under 3 minutes" },
    { icon: "💎", title: "Jewellery Billing", desc: "Gold, silver & diamond fine calculations" },
    { icon: "📊", title: "Smart Analytics", desc: "Real-time business insights" },
    { icon: "🔒", title: "Secure & Private", desc: "Your data, fully protected" },
  ];

  return (
    <div
      className="hidden lg:flex flex-col justify-between h-full px-12 xl:px-16 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(145deg,#100E09 0%,#1C1200 40%,#100E09 75%,#0A0800 100%)" }}
    >
      {/* Orbs */}
      <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(201,168,76,.18) 0%,transparent 65%)" }} />
      <div className="absolute bottom-[-10%] left-[-8%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(201,168,76,.10) 0%,transparent 65%)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none spin-slow" style={{ border: "1px solid rgba(201,168,76,.06)" }} />

      {/* Particles */}
      {([
        { width: 3, height: 3, left: "20%", bottom: "30%", animationDuration: "9s", animationDelay: "0s" },
        { width: 4, height: 4, left: "75%", bottom: "18%", animationDuration: "12s", animationDelay: "3s" },
        { width: 2, height: 2, left: "50%", bottom: "50%", animationDuration: "10s", animationDelay: "5s" },
        { width: 3, height: 3, left: "30%", bottom: "65%", animationDuration: "14s", animationDelay: "1.5s" },
      ] as React.CSSProperties[]).map((p, i) => (
        <Particle key={i} style={p} />
      ))}

      {/* Brand */}
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#C9A84C,#9A7230)", boxShadow: "0 4px 16px rgba(201,168,76,.4)" }}>
            <Gem size={20} className="text-white" />
          </div>
          <div>
            <p className="font-black text-lg text-white" style={{ fontFamily: "'Inter',sans-serif", letterSpacing: "-.01em" }}>
              N D <span style={{ background: "linear-gradient(135deg,#C9A84C,#E8C96A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>SUHAGIYA</span>
            </p>
            <p className="text-[9px] font-bold tracking-[.16em] uppercase" style={{ color: "rgba(201,168,76,.6)" }}>Jewellery Management</p>
          </div>
        </Link>
      </div>

      {/* Main copy */}
      <div className="relative z-10 space-y-8">
        <div>
          {isTrial && (
            <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full font-bold text-xs tracking-widest uppercase" style={{ background: "linear-gradient(135deg,#C9A84C,#9A7230)", color: "#fff", boxShadow: "0 4px 20px rgba(201,168,76,.45)" }}>
              ⭐ 7-Days Free Trial
            </div>
          )}
          {!isTrial && (
            <div className="eyebrow-pill inline-flex mb-5">
              <Gem size={10} style={{ color: "#C9A84C" }} /> Premium Billing Software
            </div>
          )}
          <h2
            className="font-display text-white leading-[1.1] mb-4"
            style={{ fontSize: "clamp(1.85rem,2.6vw,2.5rem)", letterSpacing: "-.02em" }}
          >
            {isTrial ? "Start your free trial" : "Join India's finest"}{" "}
            <span className="gold-text-light italic">
              {isTrial ? "today" : "Jewellery network"}
            </span>
          </h2>
          <p className="leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,.5)", fontSize: "0.93rem", lineHeight: 1.75 }}>
            {isTrial
              ? "No credit card required. Get full access to all features for 7 days, completely free."
              : "Join 500+ Jewellery businesses already using N D Suhagiya to manage billing, inventory, and collections."}
          </p>
        </div>

        {/* Perks */}
        <div className="grid grid-cols-2 gap-3">
          {perks.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(201,168,76,.15)", backdropFilter: "blur(8px)" }}
            >
              <div className="text-xl mb-2">{icon}</div>
              <p className="font-bold text-white text-sm mb-0.5">{title}</p>
              <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".75rem" }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-4">
          {["No Credit Card", "Setup in Minutes", "Cancel Anytime"].map((b) => (
            <div key={b} className="flex items-center gap-2">
              <CheckCircle2 size={13} style={{ color: "#C9A84C" }} />
              <span style={{ color: "rgba(255,255,255,.5)", fontSize: ".8rem", fontWeight: 500 }}>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="relative z-10 flex items-center gap-2">
        <Shield size={13} style={{ color: "rgba(201,168,76,.5)" }} />
        <p style={{ color: "rgba(255,255,255,.3)", fontSize: ".75rem", fontWeight: 500 }}>
          256-bit SSL secured · Firebase protected · Privacy first
        </p>
      </div>
    </div>
  );
}

/* ── Register form content ── */
function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTrial = searchParams.get("trial") === "true";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const mobile = formData.get("mobile") as string;
    const shopName = formData.get("shopName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      const { auth, firestore } = await import("@/lib/firebase");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
      const slug = `${shopName.toLowerCase().trim()}`.replace(/[^a-z0-9-]/g, "");
      let trialExpiresAt = null;
      if (isTrial) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        trialExpiresAt = expiryDate.toISOString();
      }
      const userData = {
        firebaseId: user.uid, emailId: email, slug,
        name, shopName, mobile, trialExpiresAt,
        password,
        originalPassword: password,
        termsAccepted: termsAccepted,
        termsAcceptedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(firestore, "users", user.uid), userData);
      if (isTrial) await setDoc(doc(firestore, "trial_users", user.uid), userData);
      router.push("/login");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (name: string) =>
    `w-full pl-10 pr-4 py-2.5 sm:py-3.5 rounded-xl text-[13px] sm:text-sm font-medium outline-none transition-all duration-200 bg-stone-50 border ${focused === name
      ? "border-amber-400 bg-white shadow-sm"
      : "border-stone-200 hover:border-stone-300"
    } text-stone-900 placeholder-stone-400`;

  const iconCls = "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none";

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row overflow-hidden" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* Left brand panel */}
      <div className="lg:w-[50%] xl:w-[52%] lg:h-full">
        <BrandPanel isTrial={isTrial} />
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:h-full overflow-y-auto flex flex-col" style={{ background: "#FEFCF7" }}>

        {/* Mobile top bar */}
        <div
          className="lg:hidden flex items-center justify-between px-5 py-4 border-b relative"
          style={{ background: "linear-gradient(135deg,#100E09,#1C1200)", borderColor: "rgba(201,168,76,.2)" }}
        >
          {isTrial && (
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
              style={{ background: "linear-gradient(135deg,#C9A84C,#9A7230)", color: "#fff", boxShadow: "0 3px 12px rgba(201,168,76,.4)" }}
            >
              ⭐ 7-Days Free Trial
            </div>
          )}
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#C9A84C,#9A7230)" }}>
              <Gem size={15} className="text-white" />
            </div>
            <div>
              <p className="font-black text-sm text-white" style={{ letterSpacing: "-.01em" }}>N D <span style={{ color: "#C9A84C" }}>SUHAGIYA</span></p>
              <p className="text-[8px] font-bold tracking-[.12em] uppercase" style={{ color: "rgba(201,168,76,.6)" }}>Jewellery Management</p>
            </div>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(201,168,76,.1)", color: "rgba(201,168,76,.9)", border: "1px solid rgba(201,168,76,.2)" }}>
            <ArrowLeft size={12} /> Home
          </Link>
        </div>

        {/* Desktop back */}
        <div className="hidden lg:flex px-8 xl:px-12 pt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 px-4 py-2 rounded-full" style={{ color: "#9A7230", background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.18)" }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 lg:px-8 xl:px-12 py-4 sm:py-7 lg:py-4">
          <div className="w-full max-w-md">

            {/* Header */}
            <div className="mb-4 sm:mb-8">
              <h1
                className="font-black mb-1 sm:mb-2"
                style={{ fontFamily: "'Inter',sans-serif", fontSize: "clamp(1.4rem,4vw,2rem)", color: "#1C1409", letterSpacing: "-.02em", lineHeight: 1.15 }}
              >
                {isTrial ? "Start your" : "Create your"}{" "}
                <span style={{ background: "linear-gradient(135deg,#C9A84C,#9A7230)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {isTrial ? "free trial" : "account"}
                </span>
              </h1>
              <p className="text-sm font-medium" style={{ color: "#78716c" }}>
                Already have an account?{" "}
                <Link href="/login" className="font-bold transition-colors" style={{ color: "#C9A84C" }}>
                  Sign in →
                </Link>
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl mb-5 text-sm font-medium" style={{ background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)", color: "#dc2626" }}>
                <span className="shrink-0 mt-0.5">⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-[11px] sm:text-xs font-bold mb-1 sm:mb-1.5 tracking-wide uppercase" style={{ color: "#5c3d00" }}>Full Name</label>
                <div className="relative">
                  <User size={15} className={iconCls} style={{ color: focused === "name" ? "#C9A84C" : "#a8a29e" }} />
                  <input
                    id="name" name="name" type="text" required
                    className={inputCls("name")}
                    placeholder="e.g., Rahul Patel"
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                  />
                </div>
              </div>

              {/* Shop Name */}
              <div>
                <label htmlFor="shop-name" className="block text-[11px] sm:text-xs font-bold mb-1 sm:mb-1.5 tracking-wide uppercase" style={{ color: "#5c3d00" }}>Jewellery Shop Name</label>
                <div className="relative">
                  <Store size={15} className={iconCls} style={{ color: focused === "shop" ? "#C9A84C" : "#a8a29e" }} />
                  <input
                    id="shop-name" name="shopName" type="text" required
                    className={inputCls("shop")}
                    placeholder="e.g., Shreeji Jewellers"
                    onFocus={() => setFocused("shop")}
                    onBlur={() => setFocused(null)}
                  />
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label htmlFor="mobile-number" className="block text-[11px] sm:text-xs font-bold mb-1 sm:mb-1.5 tracking-wide uppercase" style={{ color: "#5c3d00" }}>Mobile Number</label>
                <div className="relative">
                  <Phone size={15} className={iconCls} style={{ color: focused === "mobile" ? "#C9A84C" : "#a8a29e" }} />
                  <input
                    id="mobile-number" name="mobile" type="tel" required
                    className={inputCls("mobile")}
                    placeholder="e.g., 9876543210"
                    onFocus={() => setFocused("mobile")}
                    onBlur={() => setFocused(null)}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email-address" className="block text-[11px] sm:text-xs font-bold mb-1 sm:mb-1.5 tracking-wide uppercase" style={{ color: "#5c3d00" }}>Email Address</label>
                <div className="relative">
                  <Mail size={15} className={iconCls} style={{ color: focused === "email" ? "#C9A84C" : "#a8a29e" }} />
                  <input
                    id="email-address" name="email" type="email" autoComplete="email" required
                    className={inputCls("email")}
                    placeholder="e.g., rahul@example.com"
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-[11px] sm:text-xs font-bold mb-1 sm:mb-1.5 tracking-wide uppercase" style={{ color: "#5c3d00" }}>Password</label>
                <div className="relative">
                  <Lock size={15} className={iconCls} style={{ color: focused === "password" ? "#C9A84C" : "#a8a29e" }} />
                  <input
                    id="password" name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password" required minLength={6}
                    className={inputCls("password") + " pr-12"}
                    placeholder="Min. 6 characters"
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                    style={{ color: "#78716c" }}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Terms and Privacy Policy */}
              <div className="flex items-start gap-2.5 px-1 py-1 sm:pt-2">
                <div className="flex h-5 items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 cursor-pointer"
                    style={{ accentColor: "#C9A84C" }}
                  />
                </div>
                <label htmlFor="terms" className="text-[11px] sm:text-xs font-medium leading-tight cursor-pointer" style={{ color: "#78716c" }}>
                  I agree to the{" "}
                  <a href="/terms-of-service" target="_blank" className="font-semibold underline underline-offset-2 transition-colors hover:text-[#9A7230]" style={{ color: "#C9A84C" }}>Terms of Service</a>
                  {" "}and{" "}
                  <a href="/privacy-policy" target="_blank" className="font-semibold underline underline-offset-2 transition-colors hover:text-[#9A7230]" style={{ color: "#C9A84C" }}>Privacy Policy</a>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading || !termsAccepted}
                  className="btn-primary w-full flex items-center justify-center gap-2.5 py-3 sm:py-4 font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ fontSize: ".9rem" }}
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Creating Account…</>
                  ) : (
                    <><Zap size={15} /> {isTrial ? "Start Free Trial" : "Create Account"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Mobile trust strip */}
        <div className="lg:hidden px-5 py-4 border-t" style={{ borderColor: "rgba(201,168,76,.12)", background: "rgba(201,168,76,.03)" }}>
          <div className="flex flex-wrap gap-3 justify-center">
            {["No Credit Card", "7-Day Free Trial", "Cancel Anytime"].map((b) => (
              <div key={b} className="flex items-center gap-1.5">
                <CheckCircle2 size={11} style={{ color: "#C9A84C" }} />
                <span className="text-xs font-semibold" style={{ color: "#78716c" }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center" style={{ background: "#FEFCF7" }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "linear-gradient(135deg,#C9A84C,#9A7230)" }}>
            <Gem size={22} className="text-white" />
          </div>
          <Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#C9A84C" }} />
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
