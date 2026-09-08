"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { Loader2, MessageSquare, Calendar, Building2, Phone, User, Eye, X } from "lucide-react";

export default function ContactMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [viewMessageModal, setViewMessageModal] = useState<any | null>(null);

  useEffect(() => {
    const messagesRef = ref(db, "website/contactMessages");
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.createdAt - a.createdAt);
        setMessages(msgs);
      } else {
        setMessages([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleViewMessage = async (msg: any) => {
    setViewMessageModal(msg);
    if (!msg.isViewed) {
      try {
        const msgRef = ref(db, `website/contactMessages/${msg.id}`);
        await update(msgRef, { isViewed: true });
      } catch (error) {
        console.error("Failed to mark message as viewed", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col w-full">
      <div className="flex-1 transition-all duration-300">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-amber-500" />
            Contact Messages
          </h1>
          <p className="text-stone-500 mt-1">Inquiries submitted by website visitors</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-4">Sr No</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact Number</th>
                  <th className="px-6 py-4">Business</th>
                  <th className="px-6 py-4 max-w-[200px]">Message</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-stone-500">
                      No messages received yet.
                    </td>
                  </tr>
                ) : (
                  messages.map((msg, index) => (
                    <tr key={msg.id} className={`hover:bg-stone-50/50 transition-colors group ${!msg.isViewed ? "bg-amber-50/30" : ""}`}>
                      <td className="px-6 py-4 align-top text-stone-400 font-medium">
                        {messages.length - index}
                      </td>
                      <td className="px-6 py-4 align-top whitespace-nowrap">
                        <div className={`flex items-center gap-1.5 ${!msg.isViewed ? "text-stone-900 font-bold" : "text-stone-600 font-medium"}`}>
                          <Calendar className={`w-3.5 h-3.5 ${!msg.isViewed ? "text-amber-500" : "text-stone-400"}`} />
                          {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </div>
                        <div className="text-xs text-stone-400 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-stone-400" />
                          <span className={`text-stone-900 ${!msg.isViewed ? "font-bold" : "font-semibold"}`}>{msg.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2 text-stone-500">
                          <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{msg.mobile}</span>
                          {msg.mobile && (
                            <a
                              href={`https://wa.me/${msg.mobile.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 p-1 bg-green-50 text-green-600 hover:bg-green-100 rounded-md transition-colors shrink-0"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-stone-400" />
                          <span className="font-medium text-stone-700">{msg.businessName || "-"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top max-w-[200px]">
                        <div className="text-stone-500 text-sm truncate">
                          {msg.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-center">
                        {msg.isViewed ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-widest border border-stone-200">
                            Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest border border-amber-200 shadow-sm">
                            New
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <button
                          onClick={() => handleViewMessage(msg)}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200 bg-amber-50"
                          title="View Message"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Message Modal Overlay */}
      {viewMessageModal && (
        <div 
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          onClick={() => setViewMessageModal(null)}
        >
          {/* Modal Content */}
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                Message Details
              </h2>
              <button 
                onClick={() => setViewMessageModal(null)}
                className="p-2 rounded-lg text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Sender</p>
                  <p className="font-semibold text-stone-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-500" /> {viewMessageModal.name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Contact</p>
                  <p className="font-semibold text-stone-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-500" /> 
                    <span>{viewMessageModal.mobile}</span>
                    {viewMessageModal.mobile && (
                      <a
                        href={`https://wa.me/${viewMessageModal.mobile.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Business</p>
                  <p className="font-semibold text-stone-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-500" /> {viewMessageModal.businessName || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Date Sent</p>
                  <p className="font-semibold text-stone-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" /> 
                    {new Date(viewMessageModal.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Message</p>
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-stone-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {viewMessageModal.message}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end">
              <button
                onClick={() => setViewMessageModal(null)}
                className="px-6 py-2 rounded-xl font-bold text-sm bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
