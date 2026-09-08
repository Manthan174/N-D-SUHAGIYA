"use client";

import Link from "next/link";
import { Gem, ArrowLeft, Loader2, Eye, EyeOff, AlertCircle, Shield, Star, CheckCircle2, Zap } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence } from "firebase/auth";

/* ── Floating particle ── */
function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="particle" style={style} />;
}

/* ── Left panel brand showcase ── */
function BrandPanel() {
  const stats = [
    { value: "500+", label: "Businesses" },
    { value: "50K+", label: "Bills Made" },
    { value: "99%", label: "Uptime" },
  ];
  const features = [
    "Jewellery Billing & Party Ledger",
    "Real-time Gold & Silver Rates",
    "PDF Bill Generation",
    "Outstanding Payment Tracking",
  ];

  return (
    <div
      className="hidden lg:flex flex-col justify-between h-full px-12 xl:px-16 py-12 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, #100E09 0%, #1C1200 40%, #100E09 75%, #0A0800 100%)",
      }}
    >
      {/* Background orbs */}
      <div
        className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(201,168,76,.18) 0%, transparent 65%)" }}
      />
      <div
        className="absolute bottom-[-10%] left-[-8%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(201,168,76,.10) 0%, transparent 65%)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none spin-slow"
        style={{ border: "1px solid rgba(201,168,76,.06)" }}
      />

      {/* Particles */}
      {([
        { width: 3, height: 3, left: "18%", bottom: "28%", animationDuration: "8s", animationDelay: "0s" },
        { width: 4, height: 4, left: "72%", bottom: "15%", animationDuration: "11s", animationDelay: "2s" },
        { width: 2, height: 2, left: "55%", bottom: "45%", animationDuration: "9s", animationDelay: "4s" },
        { width: 3, height: 3, left: "35%", bottom: "60%", animationDuration: "13s", animationDelay: "1s" },
      ] as React.CSSProperties[]).map((p, i) => (
        <Particle key={i} style={p} />
      ))}

      {/* Brand logo */}
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #C9A84C, #9A7230)", boxShadow: "0 4px 16px rgba(201,168,76,.4)" }}
          >
            <Gem size={20} className="text-white" />
          </div>
          <div>
            <p className="font-black text-lg tracking-tight text-white" style={{ fontFamily: "'Inter',sans-serif", letterSpacing: "-.01em" }}>
              N D{" "}
              <span style={{ background: "linear-gradient(135deg,#C9A84C,#E8C96A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                SUHAGIYA
              </span>
            </p>
            <p className="text-[9px] font-bold tracking-[.16em] uppercase" style={{ color: "rgba(201,168,76,.6)" }}>
              Jewellery Management
            </p>
          </div>
        </Link>
      </div>

      {/* Main copy */}
      <div className="relative z-10 space-y-8">
        <div>
          <div className="eyebrow-pill inline-flex mb-5">
            <Gem size={10} style={{ color: "#C9A84C" }} />
            Premium Billing Software
          </div>
          <h2
            className="font-display text-white leading-[1.1] mb-4"
            style={{ fontSize: "clamp(1.85rem, 2.6vw, 2.5rem)", letterSpacing: "-.02em" }}
          >
            Welcome back to your{" "}
            <span className="gold-text-light italic">Jewellery empire</span>
          </h2>
          <p className="leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,.5)", fontSize: "0.93rem", lineHeight: 1.75 }}>
            Sign in to manage billing, inventory, outstanding payments, and business analytics — all from one powerful dashboard.
          </p>
        </div>

        {/* Feature list */}
        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <CheckCircle2 size={14} style={{ color: "#C9A84C", flexShrink: 0 }} />
              <span style={{ color: "rgba(255,255,255,.6)", fontSize: ".875rem", fontWeight: 500 }}>{f}</span>
            </li>
          ))}
        </ul>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="rounded-2xl p-4 text-center"
              style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(201,168,76,.18)", backdropFilter: "blur(8px)" }}
            >
              <p
                className="font-black text-xl mb-1"
                style={{ background: "linear-gradient(135deg,#C9A84C,#E8C96A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontFamily: "'Inter',sans-serif" }}
              >
                {value}
              </p>
              <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".7rem", fontWeight: 600, letterSpacing: ".05em" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom trust */}
      <div className="relative z-10 flex items-center gap-2">
        <Shield size={13} style={{ color: "rgba(201,168,76,.5)" }} />
        <p style={{ color: "rgba(255,255,255,.3)", fontSize: ".75rem", fontWeight: 500 }}>
          256-bit SSL secured · Firebase protected · Privacy first
        </p>
      </div>
    </div>
  );
}

/* ── Main Login Page ── */
export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      const { firestore } = await import("@/lib/firebase");
      const { collection, query, where, getDocs, doc, updateDoc, getDoc } = await import("firebase/firestore");

      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("superadmin_session");
        sessionStorage.removeItem("impersonated_user_id");
        sessionStorage.removeItem("impersonated_user_email");
      }
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();

        // Log login history
        try {
          const { addDoc, collection } = await import("firebase/firestore");
          await addDoc(collection(firestore, "login_history"), {
            userId: user.uid,
            email: user.email,
            name: data.companyName || data.name || data.ownerName || "Unknown",
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          console.error("Failed to log login history", e);
        }

        if (data.isActive === false) {
          await auth.signOut();
          setShowDeactivatedModal(true);
          setLoading(false);
          return;
        }
        if (data.trialExpiresAt) {
          const expiryDate = new Date(data.trialExpiresAt);
          if (new Date() > expiryDate) {
            await auth.signOut();
            setShowExpiredModal(true);
            setLoading(false);
            return;
          }
        }
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (name: string) =>
    `w-full px-4 py-3 sm:py-3.5 rounded-xl text-sm font-medium outline-none transition-all duration-200 bg-stone-50 border ${focused === name
      ? "border-amber-400 bg-white shadow-sm"
      : "border-stone-200 hover:border-stone-300"
    } text-stone-900 placeholder-stone-400`;

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row overflow-hidden" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* Left brand panel */}
      <div className="lg:w-[52%] xl:w-[55%] lg:h-full">
        <BrandPanel />
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:h-full overflow-y-auto flex flex-col" style={{ background: "#FEFCF7" }}>

        {/* Mobile top bar */}
        <div
          className="lg:hidden flex items-center justify-between px-5 py-4 border-b"
          style={{ background: "linear-gradient(135deg,#100E09,#1C1200)", borderColor: "rgba(201,168,76,.2)" }}
        >
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#C9A84C,#9A7230)" }}>
              <Gem size={15} className="text-white" />
            </div>
            <div>
              <p className="font-black text-sm text-white" style={{ letterSpacing: "-.01em" }}>
                N D <span style={{ color: "#C9A84C" }}>SUHAGIYA</span>
              </p>
              <p className="text-[8px] font-bold tracking-[.12em] uppercase" style={{ color: "rgba(201,168,76,.6)" }}>Jewellery Management</p>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(201,168,76,.1)", color: "rgba(201,168,76,.9)", border: "1px solid rgba(201,168,76,.2)" }}
          >
            <ArrowLeft size={12} /> Home
          </Link>
        </div>

        {/* Desktop back button */}
        <div className="hidden lg:flex px-8 xl:px-12 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 px-4 py-2 rounded-full"
            style={{ color: "#9A7230", background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.18)" }}
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 lg:px-8 xl:px-12 py-8 lg:py-4">
          <div className="w-full max-w-md">

            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full" style={{ background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)" }}>
                <Star size={11} style={{ color: "#C9A84C" }} />
                <span className="text-xs font-bold tracking-[.12em] uppercase" style={{ color: "#9A7230" }}>Secure Login</span>
              </div>
              <h1
                className="font-black mb-2.5"
                style={{ fontFamily: "'Inter',sans-serif", fontSize: "clamp(1.65rem,4vw,2.1rem)", color: "#1C1409", letterSpacing: "-.02em", lineHeight: 1.15 }}
              >
                Sign in to your
                <br />
                <span style={{ background: "linear-gradient(135deg,#C9A84C,#9A7230)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  dashboard
                </span>
              </h1>
              <p className="text-sm font-medium" style={{ color: "#78716c" }}>
                Don&apos;t have an account?{" "}
                <Link href="/register?trial=true" className="font-bold transition-colors" style={{ color: "#C9A84C" }}>
                  Create one free →
                </Link>
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-3 p-4 rounded-xl mb-5 text-sm font-medium"
                style={{ background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)", color: "#dc2626" }}
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email-address" className="block text-xs font-bold mb-2 tracking-wide uppercase" style={{ color: "#5c3d00" }}>
                  Email Address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={inputCls("email")}
                  placeholder="you@example.com"
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-xs font-bold tracking-wide uppercase" style={{ color: "#5c3d00" }}>
                    Password
                  </label>
                  <a href="#" className="text-xs font-semibold transition-colors" style={{ color: "#C9A84C" }}>
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className={inputCls("password") + " pr-12"}
                    placeholder="••••••••••"
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
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2.5 py-3.5 sm:py-4 font-bold rounded-xl mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontSize: ".9rem" }}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                ) : (
                  <><Zap size={15} /> Sign in to Dashboard</>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs font-medium" style={{ color: "#a8a29e" }}>
              By signing in you agree to our{" "}
              <a href="#" className="underline underline-offset-2" style={{ color: "#C9A84C" }}>Terms</a>
              {" "}and{" "}
              <a href="#" className="underline underline-offset-2" style={{ color: "#C9A84C" }}>Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Mobile features strip */}
        <div className="lg:hidden px-5 py-5 border-t" style={{ borderColor: "rgba(201,168,76,.12)", background: "rgba(201,168,76,.03)" }}>
          <div className="grid grid-cols-2 gap-2.5">
            {["Jewellery Billing", "Party Ledger", "PDF Bills", "Analytics"].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle2 size={12} style={{ color: "#C9A84C", flexShrink: 0 }} />
                <span className="text-xs font-semibold" style={{ color: "#78716c" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trial Expired Modal */}
      {showExpiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(28,20,9,.6)", backdropFilter: "blur(8px)" }}>
          <div className="bg-white rounded-3xl p-7 sm:p-9 max-w-sm w-full shadow-2xl" style={{ border: "1px solid rgba(201,168,76,.2)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto" style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.15)" }}>
              <AlertCircle size={26} style={{ color: "#dc2626" }} />
            </div>
            <h3 className="text-xl font-black text-center mb-2" style={{ color: "#1C1409" }}>Trial Expired</h3>
            <p className="text-sm text-center mb-7" style={{ color: "#78716c", lineHeight: 1.65 }}>
              Your 7-day free trial has ended. Please upgrade your account to continue using the dashboard.
            </p>
            <button onClick={() => setShowExpiredModal(false)} className="btn-primary w-full py-3 text-sm font-bold rounded-xl">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Account Deactivated Modal */}
      {showDeactivatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(28,20,9,.6)", backdropFilter: "blur(8px)" }}>
          <div className="bg-white rounded-3xl p-7 sm:p-9 max-w-sm w-full shadow-2xl" style={{ border: "1px solid rgba(201,168,76,.2)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto" style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.15)" }}>
              <AlertCircle size={26} style={{ color: "#dc2626" }} />
            </div>
            <h3 className="text-xl font-black text-center mb-2" style={{ color: "#1C1409" }}>Session Expired</h3>
            <p className="text-sm text-center mb-7" style={{ color: "#78716c", lineHeight: 1.65 }}>
              Your session is expired and your account has been temporarily disabled. Please contact the company to restore access.
            </p>
            <button onClick={() => setShowDeactivatedModal(false)} className="btn-primary w-full py-3 text-sm font-bold rounded-xl">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
