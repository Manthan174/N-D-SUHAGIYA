"use client";

import Link from "next/link";
import WebsiteFooter from "@/components/WebsiteFooter";
import WebsiteNavbar from "@/components/WebsiteNavbar";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen font-ui bg-[#0A0800]">
      {/* NAVBAR */}
      <WebsiteNavbar />


      {/* Content Hero */}
      <div className="pt-32 pb-16 text-center border-b" style={{ borderColor: "rgba(201,168,76,.15)", background: "linear-gradient(180deg, rgba(201,168,76,.03) 0%, transparent 100%)" }}>
        <span className="eyebrow-pill inline-flex mb-5" style={{ color: "rgba(201,168,76,.7)", borderColor: "rgba(201,168,76,.2)", background: "rgba(201,168,76,.08)" }}>
          Legal & Compliance
        </span>
        <h1 className="font-display text-4xl sm:text-6xl font-bold text-white mb-4" style={{ letterSpacing: "-.02em" }}>
          Terms of <span className="gold-text">Service</span>
        </h1>
        <p className="text-white/40 font-medium">Last updated: June 24, 2026</p>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        <div className="rounded-3xl p-8 sm:p-12 shadow-[0_60px_120px_rgba(201,168,76,.05)]" style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(201,168,76,.15)" }}>

          <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:tracking-tight prose-a:text-[#C9A84C] hover:prose-a:text-[#E8C96A]">
            
            <p className="text-lg text-white/70 leading-relaxed mb-8">
              Welcome to <strong className="text-white">N D Suhagiya</strong>. By accessing or using our Jewellery Billing Software and related services, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>

            <h2 className="text-2xl mt-12 mb-4 text-white">1. Acceptance of Terms</h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              By registering for an account, accessing the dashboard, or utilizing our services in any manner, you acknowledge that you have read, understood, and agree to be legally bound by these terms. If you do not agree, you must discontinue your use of the software immediately.
            </p>

            <h2 className="text-2xl mt-12 mb-4 text-white">2. Service Usage and Licensing</h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              We grant you a non-exclusive, non-transferable, revocable license to access and use the N D Suhagiya software strictly for your internal business operations. You agree not to reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our platform.
            </p>

            <h2 className="text-2xl mt-12 mb-4 text-white">3. User Responsibilities</h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>

            <h2 className="text-2xl mt-12 mb-4 text-white">4. Payment and Subscriptions</h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis (Billing Cycle). At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless you cancel it or N D Suhagiya cancels it. Failure to pay may result in immediate suspension of access to the platform.
            </p>

            <h2 className="text-2xl mt-12 mb-4 text-white">5. Limitation of Liability</h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              In no event shall N D Suhagiya, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>

            <h2 className="text-2xl mt-12 mb-4 text-white">6. Contact Information</h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="p-6 rounded-xl border border-white/10 mb-8" style={{ background: "rgba(255,255,255,.02)" }}>
              <p className="font-bold text-white">N D Suhagiya</p>
              <p className="text-white/50 mt-1">A-602 Corona Heights, Nikol Gam Road</p>
              <p className="text-white/50">Ahmedabad, Gujarat</p>
              <p className="text-white/50 mt-2"><strong className="text-white/70">Phone:</strong> +91 98254 49310</p>
              <p className="text-white/50"><strong className="text-white/70">Email:</strong> ndsuhagiya@gmail.com</p>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <WebsiteFooter />
    </div>
  );
}
