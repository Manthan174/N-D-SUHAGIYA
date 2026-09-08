"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Eye, EyeOff, ShieldCheck, Lock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { superAdminAuth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function SuperAdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (email !== "ndsuhagiyasuper@gmail.com") {
        setError("Unauthorized: This account does not have super admin privileges.");
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(superAdminAuth, email, password);
      sessionStorage.setItem("superadmin_session", "true");
      router.push("/superadmin");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full relative overflow-hidden bg-[#0a0a0a]">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] left-[40%] w-[30%] h-[30%] rounded-full bg-emerald-500/5 blur-[80px]"></div>
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSI+PC9jaXJjbGU+Cjwvc3ZnPg==')] opacity-30"></div>
      </div>

      <div className="p-6 lg:p-8 relative z-10 flex justify-between items-center w-full">
        <Link 
          href="/" 
          className="group inline-flex items-center gap-2 text-sm font-medium text-stone-400 hover:text-white transition-all duration-300"
        >
          <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
        <div className="w-full max-w-md">
          {/* Glassmorphic Card */}
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8 sm:p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            
            {/* Subtle inner top highlight */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-amber-500 blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 rounded-full"></div>
                <div className="h-16 w-16 bg-gradient-to-br from-stone-800 to-stone-900 border border-white/10 rounded-2xl flex items-center justify-center relative shadow-lg">
                  <ShieldCheck className="h-8 w-8 text-amber-500" />
                </div>
              </div>
              <h2 className="text-center text-3xl font-black text-white tracking-tight mb-2">
                Super Admin
              </h2>
              <p className="text-center text-sm text-stone-400 font-medium tracking-wide">
                Secure Portal Access
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="p-4 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl border border-red-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <div className="h-5 w-5 text-stone-500 group-focus-within/input:text-amber-500 transition-colors">@</div>
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 sm:text-sm shadow-inner"
                    placeholder="Admin Email Address"
                  />
                </div>

                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-stone-500 group-focus-within/input:text-amber-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-11 pr-12 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 sm:text-sm shadow-inner"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-500 hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full flex justify-center items-center py-3.5 px-4 overflow-hidden rounded-xl group/btn focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 group-hover/btn:scale-[1.02] transition-transform duration-300"></div>
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>

                  <div className="relative flex items-center gap-2 text-sm font-bold text-white tracking-wide shadow-sm">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      "Access Portal"
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
