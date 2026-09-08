import Link from "next/link";
import { Home } from "lucide-react";
import WebsiteNavbar from "@/components/WebsiteNavbar";
import WebsiteFooter from "@/components/WebsiteFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col font-ui bg-white overflow-x-hidden">
      <WebsiteNavbar />
      
      <div className="flex-grow flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32 section-cream relative overflow-hidden" style={{ minHeight: "calc(100vh - 64px - 300px)" }}>
        {/* Orbital rings for aesthetic */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full spin-slow pointer-events-none" style={{ border: "1px solid rgba(201,168,76,.06)" }} />
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-8" style={{ background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)" }}>
            <span className="text-4xl font-bold" style={{ color: "#C9A84C" }}>404</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: "#1C1409", letterSpacing: "-.02em" }}>
            Page Not Found
          </h1>
          
          <p className="text-stone-500 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            The page you are looking for doesn't exist, has been removed, or is temporarily unavailable. Let's get you back to the website.
          </p>
          
          <Link href="/" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base font-bold justify-center rounded-full transition-all hover:scale-[1.02]">
            <Home size={18} />
            Back to Website
          </Link>
        </div>
      </div>

      <WebsiteFooter />
    </div>
  );
}
