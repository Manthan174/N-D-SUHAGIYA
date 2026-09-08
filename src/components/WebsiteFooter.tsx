"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gem, ChevronRight, MapPin, Phone, Mail } from "lucide-react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

export default function WebsiteFooter() {
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [webContent, setWebContent] = useState({
    footerDesc: "Premium cloud-based Jewellery billing software built for precision, speed, and trust."
  });

  useEffect(() => {
    const unsub1 = onValue(ref(db, "users/admin/settings/companyProfile"), s => {
      if (s.exists()) setAdminProfile(s.val());
    });
    const unsub2 = onValue(ref(db, "website/homepage"), s => {
      if (s.exists()) setWebContent(p => ({ ...p, ...s.val() }));
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  return (
    <footer style={{ background: "#0A0800", borderTop: "1px solid rgba(201,168,76,.1)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#C9A84C,#9A7230)" }}>
                <Gem size={17} className="text-white" />
              </div>
              <span className="font-black text-lg text-white tracking-tight">
                N D <span className="text-[#C9A84C]">SUHAGIYA</span>
              </span>
            </div>
            <p className="text-white/30 text-sm leading-relaxed max-w-xs">{webContent.footerDesc}</p>
            <div className="flex items-center gap-2.5 mt-6">
              {[
                { 
                  href: adminProfile?.instagramUrl || "#", 
                  icon: <svg key="ig" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg> 
                },
                { 
                  href: adminProfile?.facebookUrl || "#", 
                  icon: <svg key="fb" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg> 
                },
                { 
                  href: adminProfile?.twitterUrl || "#", 
                  icon: <svg key="tw" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg> 
                },
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white/25 hover:text-amber-400 transition-colors" 
                  style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="text-white font-bold text-sm uppercase tracking-widest mb-6">Our Services</p>
            <ul className="space-y-3">
              {["Jewellery Billing Software", "Party Ledger Management", "Fine & Silver Tracking", "Wholesale & Retail Support", "Inventory Management"].map(s => (
                <li key={s}>
                  <Link href="/#features" className="text-white/30 hover:text-amber-400 text-sm transition-colors flex items-center gap-2">
                    <ChevronRight size={11} style={{ color: "rgba(201,168,76,.4)" }} /> {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-bold text-sm uppercase tracking-widest mb-6">Contact</p>
            <ul className="space-y-4">
              {[
                { Icon: MapPin, val: adminProfile?.address || "A-602 Corona Heights, Nikol Gam Road, Ahmedabad", href: "https://maps.google.com" },
                { Icon: Phone, val: adminProfile?.contactNumber || "+91 98254 49310", href: `tel:${adminProfile?.contactNumber || "+919825449310"}` },
                { Icon: Mail, val: adminProfile?.email || "ndsuhagiya@gmail.com", href: `mailto:${adminProfile?.email || "ndsuhagiya@gmail.com"}` },
              ].map(({ Icon, val, href }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Icon size={13} className="mt-0.5 shrink-0" style={{ color: "#9A7230" }} />
                  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-white/30 hover:text-amber-400 text-sm transition-colors leading-relaxed">{val}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,.04)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-white/20 text-xs">&copy; {new Date().getFullYear()} N D Suhagiya. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <Link href="/privacy-policy" className="text-white/20 hover:text-amber-400 text-xs transition-colors">Privacy Policy</Link>
              <span className="text-white/10 text-xs">|</span>
              <Link href="/terms-of-service" className="text-white/20 hover:text-amber-400 text-xs transition-colors">Terms of Service</Link>
            </div>
          </div>
          <p className="text-white/15 text-xs flex items-center gap-1 mt-3 sm:mt-0">Made with <span className="text-amber-600">♦</span> for Jewellery Businesses across India</p>
        </div>
      </div>
    </footer>
  );
}
