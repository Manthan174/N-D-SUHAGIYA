"use client";

import Link from "next/link";
import WebsiteFooter from "@/components/WebsiteFooter";
import WebsiteNavbar from "@/components/WebsiteNavbar";

export default function PrivacyPolicyPage() {
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
          Privacy <span className="gold-text">Policy</span>
        </h1>
        <p className="text-white/40 font-medium">Last updated: June 24, 2026</p>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        <div className="rounded-3xl p-8 sm:p-12 shadow-[0_60px_120px_rgba(201,168,76,.05)]" style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(201,168,76,.15)" }}>

          <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:tracking-tight prose-a:text-[#C9A84C] hover:prose-a:text-[#E8C96A]">
            
            <p className="text-lg text-white/70 leading-relaxed mb-8">
              At <strong className="text-white">N D Suhagiya</strong>, we are committed to protecting the privacy and security of your personal and business information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our Jewellery Billing and Ledger Management Software.
            </p>

            <h2 className="text-2xl mt-12 mb-4 text-white">1. Information We Collect</h2>
            <p className="text-white/60">We may collect information about you in a variety of ways. The information we may collect includes:</p>
            <ul className="list-disc pl-6 space-y-2 text-white/60 mb-6 mt-2">
              <li><strong className="text-white">Personal Data:</strong> Personally identifiable information, such as your name, email address, mobile number, and business details (e.g., Shop Name, Address) that you provide to us when registering for the software.</li>
              <li><strong className="text-white">Business Data:</strong> Information related to your daily business operations, including party ledgers, billing history, outstanding amounts, and fine silver tracking, inputted by you into the software.</li>
              <li><strong className="text-white">Usage Data:</strong> Technical information automatically collected when you access the platform, such as your IP address, browser type, device information, and interaction timestamps.</li>
            </ul>

            <h2 className="text-2xl mt-12 mb-4 text-white">2. How We Use Your Information</h2>
            <p className="text-white/60">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the software to:</p>
            <ul className="list-disc pl-6 space-y-2 text-white/60 mb-6 mt-2">
              <li>Create and manage your business account.</li>
              <li>Process your transactions and manage party ledgers securely.</li>
              <li>Provide customer support and respond to your inquiries.</li>
              <li>Send you administrative information, such as subscription reminders, software updates, and security alerts.</li>
              <li>Analyze usage trends to improve user experience and software features.</li>
              <li>Prevent fraudulent transactions and protect against unauthorized access.</li>
            </ul>

            <h2 className="text-2xl mt-12 mb-4 text-white">3. Data Security and Isolation</h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              We prioritize the security of your business data. Our software utilizes advanced database architectures to ensure that your business ledgers, party details, and billing history are strictly isolated from other users. We implement standard administrative, technical, and physical security measures to help protect your personal information. However, please be aware that no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>

            <h2 className="text-2xl mt-12 mb-4 text-white">4. Sharing of Your Information</h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              We do not sell, trade, or rent your personal or business data to third parties. We may share information we have collected about you in certain situations, such as:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/60 mb-6 mt-2">
              <li><strong className="text-white">By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
              <li><strong className="text-white">Service Providers:</strong> We may share your information with third parties that perform services for us, such as cloud hosting (Firebase), data analysis, email delivery, and customer service assistance.</li>
            </ul>

            <h2 className="text-2xl mt-12 mb-4 text-white">5. Your Data Rights</h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              You have full control over the data you input into the N D Suhagiya software. You can review, update, or delete your account and business data at any time through your dashboard settings. If you wish to permanently terminate your account and wipe your data from our servers, you may contact our administrative team.
            </p>

            <h2 className="text-2xl mt-12 mb-4 text-white">6. Changes to This Privacy Policy</h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-2xl mt-12 mb-4 text-white">7. Contact Us</h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              If you have questions or comments about this Privacy Policy, please contact us at:
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
