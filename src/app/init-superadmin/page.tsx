"use client";

import { useState } from "react";
import { auth, firestore } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function InitSuperAdmin() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleCreateAdmin = async () => {
    setStatus("loading");
    setMessage("");

    try {
      // 1. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        "ndsuhagiyasuper@gmail.com",
        "ndsuhagiya@123"
      );
      const user = userCredential.user;

      // 2. Create the user document in Firestore
      const adminData = {
        firebaseId: user.uid,
        emailId: "ndsuhagiyasuper@gmail.com",
        name: "Super Admin",
        shopName: "N D SUHAGIYA SUPER",
        role: "superadmin",
        createdAt: serverTimestamp(),
        trialExpiresAt: null, // Unlimited
      };

      await setDoc(doc(firestore, "users", user.uid), adminData);

      setStatus("success");
      setMessage("Super Admin account created successfully! You can now log into the Super Admin portal.");
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      if (error.code === "auth/email-already-in-use") {
        setMessage("The Super Admin account already exists in Firebase!");
      } else {
        setMessage(error.message || "An error occurred while creating the account.");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-stone-200 text-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Create Super Admin</h1>
        <p className="text-sm text-stone-500 mb-8">
          Click the button below to automatically register the Super Admin credentials in your Firebase database.
        </p>

        {status === "idle" && (
          <button
            onClick={handleCreateAdmin}
            className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg transition-colors shadow-md"
          >
            Create Admin Account
          </button>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center text-amber-600 py-4">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="font-medium">Creating account...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-green-700 font-medium text-center mb-6">{message}</p>
            <Link
              href="/superadmin/login"
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors shadow-md block text-center"
            >
              Go to Super Admin Login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-red-700 font-medium text-center mb-6 text-sm">{message}</p>
            <button
              onClick={() => setStatus("idle")}
              className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="mt-8 text-left bg-stone-50 p-4 rounded-xl border border-stone-200 text-sm">
          <p className="font-semibold text-stone-700 mb-1">Credentials to be created:</p>
          <p className="text-stone-600"><strong>Email:</strong> ndsuhagiyasuper@gmail.com</p>
          <p className="text-stone-600"><strong>Password:</strong> ndsuhagiya@123</p>
        </div>
      </div>
    </div>
  );
}
