"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Gem, ChevronRight, ArrowRight } from "lucide-react";

const NAV_LINKS = [
  ["Features", "/#features"],
  ["How It Works", "/#how-it-works"],
  ["Testimonials", "/#testimonials"],
  ["Contact", "/#contact"]
];

export default function WebsiteNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Check initial scroll position
    setScrolled(window.scrollY > 10);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
        scrolled ? "translate-y-0 opacity-100" : ""
      }`}
      style={{
        background: scrolled ? "rgba(254,251,242,0.92)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(201,168,76,.15)" : "1px solid transparent",
        boxShadow: scrolled ? "0 10px 40px rgba(201,168,76,.12), 0 4px 12px rgba(0,0,0,.04)" : "none",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between gap-2 min-w-0 transition-all duration-300 ${scrolled ? "h-11 sm:h-12" : "h-14 sm:h-16"}`}>
          
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 no-underline group shrink-0 min-w-0">
            <div
              className={`rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shrink-0 transition-all duration-300 ${scrolled ? "w-7 h-7 sm:w-8 sm:h-8" : "w-8 h-8 sm:w-9 sm:h-9"}`}
              style={{ background: "linear-gradient(135deg,#C9A84C,#9A7230)", boxShadow: "0 3px 10px rgba(201,168,76,.38)" }}
            >
              <Gem size={scrolled ? 13 : 16} className="text-white transition-all duration-300" />
            </div>
            <div className="leading-none min-w-0">
              <p
                className="hidden xs:block sm:block font-black tracking-tight truncate transition-all duration-500"
                style={{ fontFamily: "'Inter',sans-serif", color: scrolled ? "#1C1409" : "rgba(255,255,255,0.95)", letterSpacing: "-.01em", fontSize: scrolled ? ".8rem" : ".9rem" }}
              >
                N D <span style={{ background: "linear-gradient(135deg,#F5D06A,#C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>SUHAGIYA</span>
              </p>
              <p
                className="font-black text-sm tracking-tight block sm:hidden transition-all duration-500"
                style={{ fontFamily: "'Inter',sans-serif", color: scrolled ? "#1C1409" : "rgba(255,255,255,0.95)" }}
              >
                N D <span style={{ background: "linear-gradient(135deg,#F5D06A,#C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>SUHAGIYA</span>
              </p>
              <p
                className={`text-[8px] font-bold tracking-[.14em] uppercase hidden sm:block transition-all duration-500 ${scrolled ? "opacity-0 max-h-0 overflow-hidden" : "opacity-100 max-h-4"}`}
                style={{ color: scrolled ? "#9A7230" : "rgba(201,168,76,0.75)" }}
              >
                Jewellery Management
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_LINKS.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap"
                style={{ color: scrolled ? "#5c3d00" : "rgba(255,255,255,0.82)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#C9A84C"; e.currentTarget.style.background = scrolled ? "rgba(201,168,76,.08)" : "rgba(255,255,255,.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = scrolled ? "#5c3d00" : "rgba(255,255,255,0.82)"; e.currentTarget.style.background = "transparent"; }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href="/login"
              className={`inline-flex items-center font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all duration-300 rounded-xl ${scrolled ? "btn-outline px-2.5 py-1.5 sm:px-3" : "px-2.5 py-1.5 sm:px-4 sm:py-2 border"}`}
              style={scrolled ? {} : { color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(4px)" }}
            >
              Login
            </Link>
            <Link
              href="/register?trial=true"
              className={`btn-primary inline-flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all duration-300 ${scrolled ? "px-2.5 py-1.5 sm:px-4 sm:py-2" : "px-2.5 py-1.5 sm:px-5 sm:py-2.5"}`}
            >
              <span className="hidden sm:inline">Free Trial</span>
              <span className="sm:hidden">Trial</span>
              <ArrowRight size={12} className="hidden sm:inline" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="lg:hidden relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-all duration-300 shrink-0 ml-0.5"
              style={{
                background: mobileMenuOpen ? "rgba(201,168,76,.18)" : scrolled ? "rgba(201,168,76,.08)" : "rgba(255,255,255,.12)",
                border: scrolled ? "1px solid rgba(201,168,76,.25)" : "1px solid rgba(255,255,255,.25)"
              }}
            >
              <span className={`block w-3.5 sm:w-4 h-[2px] rounded transition-all absolute ${mobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'}`} style={{ background: scrolled ? "#9A7230" : "#fff" }} />
              <span className={`block w-3.5 sm:w-4 h-[2px] rounded transition-all absolute ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} style={{ background: scrolled ? "#9A7230" : "#fff" }} />
              <span className={`block w-3.5 sm:w-4 h-[2px] rounded transition-all absolute ${mobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'}`} style={{ background: scrolled ? "#9A7230" : "#fff" }} />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div 
            className="lg:hidden absolute left-0 right-0 top-full mt-2 mx-3 pb-3 pt-2 px-3 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300" 
            style={{ 
              background: "linear-gradient(145deg, #100E09 0%, #1C1200 40%, #100E09 100%)",
              border: "1px solid rgba(201,168,76,.2)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(201,168,76,0.1)"
            }}
          >
            <div className="space-y-1 relative z-10">
              {NAV_LINKS.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold transition-colors text-white hover:bg-white/10"
                  style={{ fontFamily: "'Inter',sans-serif", letterSpacing: "0.01em" }}
                >
                  <ChevronRight size={14} style={{ color: "#C9A84C" }} />
                  {label}
                </Link>
              ))}
              <div className="pt-4 pb-2 flex gap-3 px-1 mt-1">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 inline-flex items-center justify-center px-4 py-3 text-sm font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors rounded-xl backdrop-blur-sm shadow-inner">
                  Login
                </Link>
                <Link href="/register?trial=true" onClick={() => setMobileMenuOpen(false)} className="btn-primary flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-bold rounded-xl shadow-[0_4px_15px_rgba(201,168,76,0.3)]">
                  Free Trial <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            
            {/* Subtle glow effects inside menu */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#C9A84C] opacity-[0.06] blur-3xl rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#C9A84C] opacity-[0.06] blur-3xl rounded-full pointer-events-none"></div>
          </div>
        )}
      </div>
    </header>
  );
}
