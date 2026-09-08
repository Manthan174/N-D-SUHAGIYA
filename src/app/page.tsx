"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, push, set } from "firebase/database";
import {
  Gem, ShieldCheck, Users, TrendingUp, MapPin, Phone, Mail,
  Star, Check, X, ChevronRight, BarChart2, Bell, Zap, ArrowRight,
  CheckCircle2, Building2, Receipt, Layers, FileText, Package,
  CreditCard, Play, Lock, Clock, Home as HomeIcon, LayoutGrid, MessageSquare, User
} from "lucide-react";
import WebsiteFooter from "@/components/WebsiteFooter";
import WebsiteNavbar from "@/components/WebsiteNavbar";

/* ─── Scroll reveal ───────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll(".reveal,.reveal-l,.reveal-r");
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
  }, []);
}

/* ─── Animated counter ────────────────────────────── */
function useCounter(target: number, dur = 1800, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let t0: number | null = null;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, dur, active]);
  return val;
}

/* ─── Floating particles ─────────────────────────── */
function Particles({ count = 18 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);
  const itemsRef = useRef<any[]>([]);

  useEffect(() => {
    itemsRef.current = Array.from({ length: count }, () => ({
      left: `${Math.random() * 100}%`,
      bottom: `${Math.random() * 5}%`,
      w: Math.random() * 3 + 2,
      dur: `${Math.random() * 7 + 7}s`,
      delay: `${Math.random() * 6}s`,
      dx: `${(Math.random() - .5) * 90}px`,
    }));
    setMounted(true);
  }, [count]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {itemsRef.current.map((p, i) => (
        <div key={i} className="particle" style={{
          left: p.left, bottom: p.bottom,
          width: p.w, height: p.w,
          animationDuration: p.dur, animationDelay: p.delay,
          ["--dx" as any]: p.dx,
        }} />
      ))}
    </div>
  );
}

/* ─── Dashboard mock ─────────────────────────────── */
function DashMock() {
  return (
    <div className="relative w-full max-w-[480px] mx-auto select-none">
      {/* Main window */}
      <div className="rounded-2xl overflow-hidden" style={{
        background: "rgba(20,16,8,.88)",
        border: "1px solid rgba(201,168,76,.22)",
        boxShadow: "0 48px 96px rgba(0,0,0,.65), 0 0 0 1px rgba(201,168,76,.08), 0 24px 48px rgba(201,168,76,.12)",
        backdropFilter: "blur(20px)",
      }}>
        {/* Titlebar */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          <span className="ml-3 font-mono text-[10px] text-white/25 tracking-wider">N D Suhagiya · Dashboard</span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-semibold">LIVE</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Today's Sales", val: "₹2,84,500", color: "#10B981", Icon: TrendingUp },
              { label: "Gold Rate", val: "₹6,240/g", color: "#C9A84C", Icon: Gem },
              { label: "Outstanding", val: "₹18,500", color: "#3b82f6", Icon: Bell },
            ].map((s, i) => (
              <div key={i} className="d-card p-2.5 float" style={{ animationDelay: `${i * .35}s` }}>
                <div className="flex items-center gap-1 mb-1.5">
                  <s.Icon size={10} style={{ color: s.color }} />
                  <span className="text-white/35 text-[8px] font-semibold tracking-wide">{s.label}</span>
                </div>
                <p className="font-bold text-[11px]" style={{ color: s.color }}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="d-card p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/50 text-[10px] font-semibold font-ui">Weekly Sales</span>
              <span className="text-emerald-400 text-[9px] font-bold">↑ 24.5%</span>
            </div>
            <div className="flex items-end gap-[3px] h-10">
              {[35, 60, 45, 78, 62, 92, 55].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{
                  height: `${h}%`,
                  background: `linear-gradient(to top, #C9A84C, #E8C96A)`,
                  opacity: i === 5 ? 1 : .28 + i * .09,
                }} />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i} className="flex-1 text-center text-[8px] text-white/18 font-semibold">{d}</span>
              ))}
            </div>
          </div>

          {/* Ledger */}
          <div className="d-card p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/50 text-[10px] font-semibold font-ui">Party Ledger</span>
              <span className="text-[9px] font-semibold" style={{ color: "#C9A84C" }}>View All →</span>
            </div>
            {[
              { n: "Mehta Jewellers", a: "₹45,000", s: "Pending" },
              { n: "Shah Gold House", a: "₹82,500", s: "Paid" },
              { n: "Patel Diamonds", a: "₹12,000", s: "Pending" },
            ].map((r, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/[.04] last:border-0">
                <span className="text-white/60 text-[9px]">{r.n}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/75 text-[9px] font-bold">{r.a}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${r.s === "Paid" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>{r.s}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Silver / Collections row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="d-card p-2.5">
              <p className="text-white/35 text-[8px] mb-1 font-semibold">Silver Rate</p>
              <p className="text-white font-bold text-[11px]">₹78.50<span className="text-white/30 text-[8px] font-normal">/g</span></p>
            </div>
            <div className="d-card p-2.5">
              <p className="text-white/35 text-[8px] mb-1 font-semibold">Collections</p>
              <p className="text-emerald-400 font-bold text-[11px]">₹1,24,000</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge — Bill Generated */}
      <div className="absolute -left-10 top-24 float hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(20,16,8,.9)", border: "1px solid rgba(201,168,76,.22)", backdropFilter: "blur(12px)", boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>
        <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 size={13} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-white text-[10px] font-bold">Bill Generated</p>
          <p className="text-white/40 text-[8px]">Just now · #INV-4821</p>
        </div>
      </div>

      {/* Floating badge — Gold update */}
      <div className="absolute -right-10 bottom-28 float2 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(20,16,8,.9)", border: "1px solid rgba(201,168,76,.22)", backdropFilter: "blur(12px)", boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(201,168,76,.15)" }}>
          <Gem size={12} className="text-amber-400" />
        </div>
        <div>
          <p className="text-white text-[10px] font-bold">Gold Rate Updated</p>
          <p className="text-[9px] font-bold" style={{ color: "#C9A84C" }}>₹6,240/g  ↑ ₹80</p>
        </div>
      </div>

      {/* Floating badge — Payment */}
      <div className="absolute -right-6 top-16 float3 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(20,16,8,.9)", border: "1px solid rgba(201,168,76,.22)", backdropFilter: "blur(12px)", boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>
        <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center">
          <CreditCard size={12} className="text-blue-400" />
        </div>
        <div>
          <p className="text-white text-[10px] font-bold">Payment Collected</p>
          <p className="text-blue-400 text-[9px] font-bold">₹25,000 · Mehta</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Mobile Menu State ─────────────────────────── */
const NAV_LINKS = [["Features", "#features"], ["How It Works", "#how-it-works"], ["Testimonials", "#testimonials"], ["Contact", "#contact"]];

/* ─── MAIN PAGE ──────────────────────────────────── */
export default function Home() {
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [webContent, setWebContent] = useState({
    heroTitle1: "Smart Jewellery Billing",
    heroTitle2: "& Business Management",
    heroSub: "Manage Gold, Silver, Diamond billing, Party Accounts, Inventory, Outstanding Payments, and Real-Time Analytics — all from one powerful platform built for Indian Jewellery businesses.",
    featuresTitle: "Every Tool Your Jewellery Business Needs",
    featuresSub: "From billing to collections, everything is automated, fast, and accurate.",
    contactTitle: "Start a Conversation",
    contactSub: "Have questions? Reach out directly or fill the form — we respond within the hour.",
    footerDesc: "Premium cloud-based Jewellery billing software built for precision, speed, and trust."
  });
  const [statsOn, setStatsOn] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useReveal();

  const c1 = useCounter(500, 1800, statsOn);
  const c2 = useCounter(50000, 1800, statsOn);
  const c3 = useCounter(99, 1500, statsOn);

  useEffect(() => {
    const unsub1 = onValue(ref(db, "users/admin/settings/companyProfile"), s => { if (s.exists()) setAdminProfile(s.val()); });
    const unsub2 = onValue(ref(db, "website/homepage"), s => { if (s.exists()) setWebContent(p => ({ ...p, ...s.val() })); });
    return () => { unsub1(); unsub2(); };
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsOn(true); }, { threshold: .4 });
    if (statsRef.current) io.observe(statsRef.current);
    return () => io.disconnect();
  }, []);

  const features = [
    { Icon: Receipt, title: "Jewellery Billing", desc: "Generate precise bills with gold, silver & diamond fine calculations in seconds.", color: "#C9A84C" },
    { Icon: Users, title: "Party Management", desc: "Maintain complete customer & supplier ledgers with running balance history.", color: "#2563EB" },
    { Icon: BarChart2, title: "Outstanding Tracking", desc: "See every pending amount, party-wise, with aging and reminders built in.", color: "#10B981" },
    { Icon: Package, title: "Inventory Management", desc: "Track gold, silver, and diamond stock levels in real time.", color: "#C9A84C" },
    { Icon: CreditCard, title: "Collection Management", desc: "Record and reconcile cash, cheque, and metal fine payments easily.", color: "#2563EB" },
    { Icon: FileText, title: "PDF Bill Generation", desc: "Download and WhatsApp-share professional PDF bills with one click.", color: "#10B981" },
    { Icon: TrendingUp, title: "Live Gold & Silver Rates", desc: "Rates update automatically so every bill is always accurate.", color: "#C9A84C" },
    { Icon: BarChart2, title: "Reports & Analytics", desc: "Weekly, monthly, and party-wise business reports with visual insights.", color: "#2563EB" },
  ];

  const problems = ["Manual paper billing", "Losing track of outstanding amounts", "Inventory confusion", "Party ledger mistakes", "Chasing payments manually"];
  const solutions = ["One-click professional billing", "Auto ledger & outstanding management", "Real-time inventory tracking", "Outstanding payment reports", "Collection management dashboard", "Smart analytics & business insights"];

  const testimonials = [
    { name: "Rajesh Mehta", biz: "Mehta Gold Palace · Surat", review: "Billing is 10× faster and my outstanding tracking is perfect now. This software transformed my business.", rating: 5, initials: "RM" },
    { name: "Priya Shah", biz: "Shah Diamonds · Ahmedabad", review: "The party ledger and collection features save me hours every single day. Absolutely love it!", rating: 5, initials: "PS" },
    { name: "Vikram Patel", biz: "Patel Jewellers · Mumbai", review: "Professional, fast, reliable. The PDF billing and analytics dashboard is exactly what my wholesale business needed.", rating: 5, initials: "VP" },
  ];

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: "", mobile: "", businessName: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.mobile || !contactForm.message) return;
    
    try {
      setIsSubmitting(true);
      const messagesRef = ref(db, "website/contactMessages");
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, {
        ...contactForm,
        createdAt: Date.now()
      });
      alert("Message sent! We'll be in touch shortly.");
      setContactForm({ name: "", mobile: "", businessName: "", message: "" });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-ui bg-white overflow-x-hidden">

      {/* ════════════════════════════════════════
          NAVBAR — Fully Responsive
          ════════════════════════════════════════ */}
      <WebsiteNavbar />

      {/* ════════════════════════════════════════
          HERO
          ════════════════════════════════════════ */}
      <section className="hero-bg relative overflow-hidden" style={{ minHeight: "calc(100vh - 64px)" }}>
        <Particles />

        {/* Orbital rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full spin-slow pointer-events-none" style={{ border: "1px solid rgba(201,168,76,.06)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full spin-slow-r pointer-events-none" style={{ border: "1px solid rgba(201,168,76,.04)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

          {/* Left copy */}
          <div className="flex-1 text-center lg:text-left reveal-l">
            <div className="eyebrow-pill inline-flex mb-7">
              <Gem size={11} className="text-amber-600" />
              Premium Jewellery Billing Software
            </div>

            <h1 className="font-display text-white leading-[1.08] mb-6" style={{ fontSize: "clamp(2.4rem,5.5vw,4.2rem)", letterSpacing: "-.02em" }}>
              {webContent.heroTitle1}<br />
              <span className="gold-text-light italic">{webContent.heroTitle2}</span>
            </h1>

            <p className="text-white/55 leading-relaxed mb-9 max-w-xl mx-auto lg:mx-0" style={{ fontSize: "clamp(.95rem,1.3vw,1.1rem)", lineHeight: 1.75 }}>
              {webContent.heroSub}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Link href="/register?trial=true" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base w-full sm:w-auto justify-center">
                <Zap size={17} /> Start 7-Day Free Trial
              </Link>
              <button className="inline-flex items-center gap-3 px-7 py-4 rounded-full text-white/70 hover:text-white border border-white/10 hover:border-white/25 transition-all text-base font-semibold w-full sm:w-auto justify-center group">
                <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/18 flex items-center justify-center transition-colors">
                  <Play size={11} className="text-amber-400 ml-0.5" />
                </div>
                Watch Demo
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2">
              {["No Credit Card Required", "Setup in Minutes", "Trusted by 500+ Businesses"].map(t => (
                <span key={t} className="inline-flex items-center gap-1.5 text-white/45 text-sm font-medium">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right mockup */}
          <div className="flex-1 w-full max-w-lg reveal-r">
            <DashMock />
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent,#100E09)" }} />
      </section>

      {/* ════════════════════════════════════════
          TRUSTED LOGOS / MARQUEE
          ════════════════════════════════════════ */}
      <div className="section-dark2 py-10 border-y" style={{ borderColor: "rgba(201,168,76,.18)" }}>
        <p className="text-center text-xs font-bold tracking-[.2em] uppercase mb-6" style={{ color: "rgba(201,168,76,.45)" }}>Trusted by Jewellery businesses across India</p>
        <div className="overflow-hidden relative">
          <div className="marquee-track gap-16 flex items-center">
            {[...Array(2)].map((_, ri) =>
              ["Mehta Gold Palace", "Shah Diamonds", "Patel Jewellers", "Kumar Jewels", "Agarwal Fine Jewellery", "Jain Gold House", "Sharma Ornaments", "Bhatt Bullion"].map((name, i) => (
                <div key={`${ri}-${i}`} className="flex items-center gap-2.5 shrink-0">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,.12)" }}>
                    <Gem size={12} style={{ color: "#C9A84C" }} />
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap" style={{ color: "rgba(255,255,255,.35)" }}>{name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          STATS
          ════════════════════════════════════════ */}
      <section ref={statsRef} className="section-dark2 py-16" style={{ borderBottom: "1px solid rgba(201,168,76,.15)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: `${c1}+`, label: "Active Businesses", Icon: Building2, color: "#C9A84C" },
              { val: `${c2.toLocaleString()}+`, label: "Bills Generated", Icon: Receipt, color: "#10B981" },
              { val: `${c3}.9%`, label: "Uptime Guarantee", Icon: ShieldCheck, color: "#C9A84C" },
              { val: "24/7", label: "Customer Support", Icon: Clock, color: "#3b82f6" },
            ].map((s, i) => (
              <div key={i} className="reveal" style={{ transitionDelay: `${i * .1}s` }}>
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                  <s.Icon size={20} style={{ color: s.color }} />
                </div>
                <p className="font-display text-3xl font-bold text-white mb-1">{s.val}</p>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,.4)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          PROBLEM → SOLUTION
          ════════════════════════════════════════ */}
      <section id="how-it-works" className="section-cream py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <span className="eyebrow-pill inline-flex mb-5">The Problem & Our Solution</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: "#1C1409", letterSpacing: "-.02em" }}>
              Stop Struggling.<br /><span className="gold-text">Start Growing.</span>
            </h2>
            <div className="divider-gold" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Problems */}
            <div className="reveal-l d1 rounded-2xl p-8" style={{ background: "#FEF2F2", border: "1.5px solid #FECACA" }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-base">❌</div>
                <h3 className="font-bold text-red-700 text-lg">Before Our Software</h3>
              </div>
              <div className="space-y-3">
                {problems.map((p) => (
                  <div key={p} className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-red-100">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <X size={12} className="text-red-500" />
                    </div>
                    <span className="text-stone-700 font-medium text-sm">{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div className="reveal-r d2 rounded-2xl p-8" style={{ background: "linear-gradient(135deg,#1A1200,#241800)", border: "1.5px solid rgba(201,168,76,.25)" }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: "rgba(201,168,76,.15)" }}>✅</div>
                <h3 className="font-bold text-amber-400 text-lg">After Our Software</h3>
              </div>
              <div className="space-y-3">
                {solutions.map((s) => (
                  <div key={s} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.12)" }}>
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-emerald-400" />
                    </div>
                    <span className="text-white/80 font-medium text-sm">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES
          ════════════════════════════════════════ */}
      <section id="features" className="py-24 sm:py-32" style={{ background: "#FFFDF6", borderTop: "1px solid rgba(201,168,76,.1)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <span className="eyebrow-pill inline-flex mb-5">Powerful Features</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-3" style={{ color: "#1C1409", letterSpacing: "-.02em" }}>
              {webContent.featuresTitle}
            </h2>
            <p className="text-stone-500 text-lg max-w-2xl mx-auto">{webContent.featuresSub}</p>
            <div className="divider-gold" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div key={i} className={`f-card reveal d${(i % 6) + 1}`}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{
                  background: `linear-gradient(135deg,${f.color}20,${f.color}0A)`,
                  border: `1px solid ${f.color}28`
                }}>
                  <f.Icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="font-bold mb-2 text-sm" style={{ fontFamily: "'Inter',sans-serif", color: "#1C1409" }}>{f.title}</h3>
                <p className="text-stone-500 text-[13px] leading-relaxed">{f.desc}</p>
                <div className="flex items-center gap-1 mt-4 text-xs font-bold" style={{ color: f.color }}>
                  Learn more <ChevronRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          DASHBOARD PREVIEW (full width dark)
          ════════════════════════════════════════ */}
      <section className="section-dark py-24 sm:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <span className="eyebrow-pill inline-flex mb-5" style={{ color: "rgba(201,168,76,.7)", borderColor: "rgba(201,168,76,.2)", background: "rgba(201,168,76,.08)" }}>
              Live Dashboard
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3" style={{ letterSpacing: "-.02em" }}>
              Your Business at a<br /><span className="gold-text">Single Glance</span>
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">Everything you need — sales, rates, party ledger, outstanding, collections — in one clean screen.</p>
          </div>

          {/* Big dashboard shell */}
          <div className="reveal rounded-3xl overflow-hidden" style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(201,168,76,.15)", boxShadow: "0 60px 120px rgba(201,168,76,.07)" }}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,.05)", background: "rgba(255,255,255,.03)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,.15)" }}>
                  <Gem size={15} style={{ color: "#C9A84C" }} />
                </div>
                <span className="text-white font-semibold text-sm">N D Suhagiya · Control Panel</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-semibold">Live</span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Today's Sales", val: "₹2,84,500", sub: "+12% vs yesterday", color: "#C9A84C", Icon: TrendingUp },
                  { label: "Gold Rate", val: "₹6,240/g", sub: "22K · Updated live", color: "#E8C96A", Icon: Gem },
                  { label: "Silver Rate", val: "₹78.50/g", sub: "999 Purity", color: "#d4d4d4", Icon: Layers },
                  { label: "Outstanding", val: "₹18,500", sub: "3 parties pending", color: "#3b82f6", Icon: Bell },
                ].map((s, i) => (
                  <div key={i} className="d-card p-4 reveal" style={{ transitionDelay: `${i * .08}s` }}>
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-white/40 text-xs font-medium">{s.label}</p>
                      <s.Icon size={13} style={{ color: s.color }} />
                    </div>
                    <p className="font-display text-xl font-bold text-white mb-1">{s.val}</p>
                    <p className="text-[11px] font-semibold" style={{ color: s.color }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Chart + Parties */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3 d-card p-5">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-white/60 text-sm font-semibold">Weekly Sales Performance</span>
                    <span className="bg-emerald-500/15 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold">↑ 24.5%</span>
                  </div>
                  <div className="flex items-end gap-2 h-28">
                    {[30, 55, 40, 75, 65, 90, 50].map((h, i) => (
                      <div key={i} className="flex-1 rounded" style={{ height: `${h}%`, background: "linear-gradient(to top,#C9A84C,#E8C96A)", opacity: i === 5 ? 1 : .25 + i * .1 }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-3">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                      <span key={d} className="text-white/20 text-[10px] font-semibold flex-1 text-center">{d}</span>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 d-card p-5">
                  <p className="text-white/60 text-sm font-semibold mb-4">Party Outstanding</p>
                  {[
                    { n: "Mehta Gold", a: "₹45,000", pct: 75 },
                    { n: "Shah Diamonds", a: "₹28,000", pct: 45 },
                    { n: "Patel Jewels", a: "₹12,000", pct: 20 },
                  ].map((p, i) => (
                    <div key={i} className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-white/55 font-medium">{p.n}</span>
                        <span className="font-bold" style={{ color: "#C9A84C" }}>{p.a}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: "linear-gradient(90deg,#C9A84C,#E8C96A)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          WHY CHOOSE US
          ════════════════════════════════════════ */}
      <section className="py-24 sm:py-32" style={{ background: "linear-gradient(180deg,#FFFDF6 0%,#FDF8EE 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <span className="eyebrow-pill inline-flex mb-5">Why Choose Us</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold" style={{ color: "#1C1409", letterSpacing: "-.02em" }}>
              We're Simply <span className="gold-text">Better</span>
            </h2>
            <div className="divider-gold" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Others */}
            <div className="reveal-l d1 rounded-2xl overflow-hidden border-2 border-stone-200">
              <div className="bg-stone-100 px-6 py-4 border-b border-stone-200">
                <p className="text-stone-400 font-bold text-sm uppercase tracking-widest">Others</p>
              </div>
              <div className="p-6 space-y-3">
                {["Manual work & paper ledgers", "Slow billing process", "Limited or no reports", "No party management", "No inventory tracking", "No cloud backup"].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <X size={10} className="text-red-500" />
                    </div>
                    <span className="text-stone-400 line-through text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ours */}
            <div className="reveal-r d2 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#1A1200,#241800)", border: "2px solid rgba(201,168,76,.3)" }}>
              <div className="px-6 py-4 border-b" style={{ background: "rgba(201,168,76,.08)", borderColor: "rgba(201,168,76,.15)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-amber-400 font-bold text-sm uppercase tracking-widest">N D Suhagiya Software</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#C9A84C", color: "#1C1409" }}>RECOMMENDED</span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {["Automated digital billing process", "One-click professional billing", "Smart analytics & reports", "Complete party ledger management", "Real-time inventory tracking", "Secure cloud backup & sync"].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Check size={10} className="text-emerald-400" />
                    </div>
                    <span className="text-white/80 font-medium text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TESTIMONIALS
          ════════════════════════════════════════ */}
      <section id="testimonials" className="py-24 sm:py-32" style={{ background: "#FFFFFF", borderTop: "1px solid rgba(201,168,76,.1)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <span className="eyebrow-pill inline-flex mb-5">Testimonials</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-2" style={{ color: "#1C1409", letterSpacing: "-.02em" }}>
              Trusted by Jewellery<br /><span className="gold-text">Business Owners</span>
            </h2>
            <div className="divider-gold" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className={`t-card reveal d${i + 1}`}>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={15} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-stone-600 text-[15px] leading-relaxed italic mb-6">"{t.review}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-amber-100">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "linear-gradient(135deg,#C9A84C,#9A7230)" }}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#1C1409" }}>{t.name}</p>
                    <p className="text-xs font-medium" style={{ color: "#9A7230" }}>{t.biz}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA BANNER
          ════════════════════════════════════════ */}
      <section id="pricing" className="section-dark py-24 sm:py-32 overflow-hidden relative">
        <Particles count={14} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[700px] rounded-full" style={{ background: "radial-gradient(circle,rgba(201,168,76,.12) 0%,transparent 70%)" }} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center reveal">
          <span className="eyebrow-pill inline-flex mb-7" style={{ color: "rgba(201,168,76,.7)", borderColor: "rgba(201,168,76,.2)", background: "rgba(201,168,76,.08)" }}>
            Get Started Today
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4" style={{ letterSpacing: "-.02em" }}>
            Manage Your Jewellery Business<br /><span className="gold-text-light">Smarter, Starting Today</span>
          </h2>
          <p className="text-white/45 text-lg mb-9 max-w-xl mx-auto leading-relaxed">
            Get full access to every premium feature with a <strong className="text-white/70">FREE 7-Day Trial</strong>. No credit card, no setup cost.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {["No Setup Cost", "No Credit Card", "Instant Access", "Easy Registration"].map(b => (
              <div key={b} className="flex items-center gap-2 text-white/50 text-sm font-medium">
                <CheckCircle2 size={15} className="text-emerald-400" /> {b}
              </div>
            ))}
          </div>
          <Link href="/register?trial=true" className="btn-primary pulse-gold inline-flex items-center gap-3 px-10 py-5 text-lg font-bold">
            <Zap size={20} /> Start Free Trial Now <ArrowRight size={18} />
          </Link>
          <p className="text-white/25 text-sm mt-4">7-day trial · Cancel anytime · Zero cost</p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CONTACT
          ════════════════════════════════════════ */}
      <section id="contact" className="py-24 sm:py-32 section-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Info */}
            <div className="reveal-l">
              <span className="eyebrow-pill inline-flex mb-5">Get in Touch</span>
              <h2 className="font-display text-4xl font-bold mb-4" style={{ color: "#1C1409", letterSpacing: "-.02em" }}>
                {webContent.contactTitle}
              </h2>
              <p className="text-stone-500 text-lg leading-relaxed mb-10">{webContent.contactSub}</p>

              <div className="space-y-5">
                {[
                  { Icon: Gem, label: "Company", val: adminProfile?.companyName || "N D SUHAGIYA" },
                  { Icon: Phone, label: "Mobile", val: adminProfile?.contactNumber || "+91 98254 49310" },
                  { Icon: Mail, label: "Email", val: adminProfile?.email || "ndsuhagiya@gmail.com" },
                  { Icon: MapPin, label: "Address", val: adminProfile?.address || "A-602 Corona Heights, Near Amar Jawan Circle, Nikol Gam Road, Ahmedabad" },
                ].map(({ Icon, label, val }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)" }}>
                      <Icon size={17} style={{ color: "#9A7230" }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#9A7230" }}>{label}</p>
                      <p className="text-stone-800 font-semibold text-sm leading-relaxed whitespace-pre-wrap">{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="reveal-r d2">
              <div className="rounded-2xl p-8 sm:p-10" style={{ background: "linear-gradient(135deg,#1A1200,#241800)", border: "1px solid rgba(201,168,76,.22)", boxShadow: "0 24px 60px rgba(0,0,0,.35)" }}>
                <h3 className="font-display text-white text-2xl font-bold mb-1">Send a Message</h3>
                <p className="text-white/40 text-sm mb-7">We respond within the hour on business days.</p>
                <form className="space-y-4" onSubmit={handleContactSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wider">Your Name</label>
                      <input type="text" placeholder="Rajesh Mehta" required
                        value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none transition-all"
                        style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(201,168,76,.18)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wider">Mobile Number</label>
                      <input type="tel" placeholder="+91 00000 00000" required
                        value={contactForm.mobile} onChange={e => setContactForm({ ...contactForm, mobile: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none transition-all"
                        style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(201,168,76,.18)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wider">Business Name</label>
                    <input type="text" placeholder="Your Jewellery Shop"
                      value={contactForm.businessName} onChange={e => setContactForm({ ...contactForm, businessName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none"
                      style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(201,168,76,.18)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wider">Message</label>
                    <textarea rows={4} placeholder="How can we help your Jewellery business?" required
                      value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 text-sm resize-none focus:outline-none"
                      style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(201,168,76,.18)" }}
                    />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5 font-bold rounded-2xl text-base disabled:opacity-50">
                    {isSubmitting ? "Sending..." : "Send Message →"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
          ════════════════════════════════════════ */}
      <WebsiteFooter />
    </div>
  );
}
