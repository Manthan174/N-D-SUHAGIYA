"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Box, Trash2, ShieldCheck, CheckCircle2, ListPlus, ChevronDown, ChevronRight, X } from "lucide-react";
import { superAdminFirestore } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

export default function ModulesManagerPage() {
  const [moduleName, setModuleName] = useState("");
  const [iconName, setIconName] = useState("Box");
  const [loading, setLoading] = useState(false);
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [subModuleName, setSubModuleName] = useState("");
  const [addingSubModuleTo, setAddingSubModuleTo] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  const fetchModules = async () => {
    try {
      const q = query(collection(superAdminFirestore, "superadmin_modules"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setModulesList(list);
    } catch (err) {
      console.error(err);
      // Fallback if index doesn't exist
      try {
        const snap = await getDocs(collection(superAdminFirestore, "superadmin_modules"));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setModulesList(list);
      } catch (err2) {
        console.error(err2);
      }
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!moduleName.trim()) {
      setError("Module name is required");
      setLoading(false);
      return;
    }

    try {
      // 1. Call API to generate physical files
      const res = await fetch("/api/superadmin/create-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleName: moduleName.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate module files");
      }

      // 2. Save to Firestore
      await addDoc(collection(superAdminFirestore, "superadmin_modules"), {
        name: moduleName.trim(),
        slug: data.slug,
        icon: iconName,
        subItems: [],
        createdAt: serverTimestamp()
      });

      setSuccess(`Module "${moduleName}" created successfully! Folder: /superadmin/${data.slug}`);
      setModuleName("");
      fetchModules();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubModule = async (moduleId: string) => {
    if (!subModuleName.trim()) return;
    setSubLoading(true);
    
    try {
      const mod = modulesList.find(m => m.id === moduleId);
      const subItems = mod.subItems || [];
      const newSubId = subModuleName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
      
      const newSubItem = {
        id: `${mod.slug}_${newSubId}`,
        name: subModuleName.trim(),
        slug: newSubId
      };
      
      await updateDoc(doc(superAdminFirestore, "superadmin_modules", moduleId), {
        subItems: [...subItems, newSubItem]
      });
      
      setSubModuleName("");
      setAddingSubModuleTo(null);
      fetchModules();
    } catch (err) {
      console.error(err);
      alert("Failed to add sub-module");
    } finally {
      setSubLoading(false);
    }
  };

  const handleDeleteSubModule = async (moduleId: string, subId: string) => {
    if (!confirm("Remove this sub-module?")) return;
    
    try {
      const mod = modulesList.find(m => m.id === moduleId);
      const subItems = mod.subItems.filter((s: any) => s.id !== subId);
      
      await updateDoc(doc(superAdminFirestore, "superadmin_modules", moduleId), {
        subItems
      });
      
      fetchModules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Remove this module from the sidebar? Note: You will need to manually delete the physical folder.")) return;
    try {
      await deleteDoc(doc(superAdminFirestore, "superadmin_modules", id));
      fetchModules();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-amber-500" />
          Module Generator
        </h1>
        <p className="text-sm font-medium text-stone-500">
          Dynamically generate physical Next.js folders and register them in your sidebar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200">
            <h2 className="text-lg font-bold text-stone-900 mb-6">Create New Module</h2>
            
            <form onSubmit={handleCreateModule} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium border border-emerald-100 flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Module Name</label>
                <input
                  type="text"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  placeholder="e.g. Analytics"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Icon Name (Lucide)</label>
                <input
                  type="text"
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                  placeholder="e.g. Box, Activity, Users"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-bold transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                    Generate Module
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-stone-100 bg-stone-50/50">
              <h2 className="text-lg font-bold text-stone-900">Generated Modules ({modulesList.length})</h2>
            </div>
            
            <div className="divide-y divide-stone-100">
              {modulesList.length === 0 ? (
                <div className="p-8 text-center text-stone-500 text-sm font-medium">
                  No custom modules generated yet.
                </div>
              ) : (
                modulesList.map((mod) => (
                  <div key={mod.id} className="flex flex-col border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors">
                    <div className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <button 
                          onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                          className="p-1 text-stone-400 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50"
                        >
                          {expandedModule === mod.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                        <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/50 shrink-0">
                          <Box className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-900">{mod.name}</h3>
                          <p className="text-xs font-medium text-stone-500 font-mono mt-0.5">/superadmin/{mod.slug}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAddingSubModuleTo(mod.id)}
                          className="p-2 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Add Sub-module"
                        >
                          <ListPlus className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(mod.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from sidebar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-modules Area */}
                    {expandedModule === mod.id && (
                      <div className="px-6 pb-6 pt-0 pl-16">
                        <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-3">
                          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Sub-modules</h4>
                          
                          {addingSubModuleTo === mod.id && (
                            <div className="flex items-center gap-2 mb-3">
                              <input
                                type="text"
                                value={subModuleName}
                                onChange={(e) => setSubModuleName(e.target.value)}
                                placeholder="Sub-module name..."
                                className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                autoFocus
                              />
                              <button
                                onClick={() => handleAddSubModule(mod.id)}
                                disabled={subLoading}
                                className="px-4 py-2 bg-amber-500 text-white font-bold rounded-lg text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => setAddingSubModuleTo(null)}
                                className="p-2 text-stone-400 hover:text-stone-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {(!mod.subItems || mod.subItems.length === 0) && addingSubModuleTo !== mod.id ? (
                            <div className="text-sm text-stone-500 py-2">No sub-modules added yet.</div>
                          ) : (
                            <div className="space-y-2">
                              {mod.subItems?.map((sub: any) => (
                                <div key={sub.id} className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg border border-stone-200">
                                  <div>
                                    <span className="font-semibold text-sm text-stone-800">{sub.name}</span>
                                    <span className="text-xs text-stone-400 font-mono ml-2">ID: {sub.id}</span>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteSubModule(mod.id, sub.id)}
                                    className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
