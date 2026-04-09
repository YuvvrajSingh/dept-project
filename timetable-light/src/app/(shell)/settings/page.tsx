"use client";

import { useState } from "react";
import { timetableApi } from "@/lib/api";

export default function SettingsPage() {
  const [typedConfirm, setTypedConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [factoryConfirm, setFactoryConfirm] = useState("");
  const [factoryLoading, setFactoryLoading] = useState(false);
  const [factorySuccessMsg, setFactorySuccessMsg] = useState("");

  const handleGlobalWipe = async () => {
    if (typedConfirm !== "DELETE") return;
    
    setLoading(true);
    setSuccessMsg("");
    
    try {
      await timetableApi.clearGlobalTimetable();
      setSuccessMsg("Department timetable successfully wiped clean.");
      setTypedConfirm(""); // reset
    } catch (e: any) {
      alert("Failed to clear globally: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFactoryReset = async () => {
    if (factoryConfirm !== "FACTORY RESET") return;
    
    setFactoryLoading(true);
    setFactorySuccessMsg("");
    
    try {
      await timetableApi.factoryReset();
      setFactorySuccessMsg("Master data successfully wiped. Systems returned to factory defaults.");
      setFactoryConfirm(""); // reset
    } catch (e: any) {
      alert("Failed to factory reset: " + e.message);
    } finally {
      setFactoryLoading(false);
    }
  };

  return (
    <div className="flex gap-8 pt-4">
      {/* Main Settings Column */}
      <div className="flex-1 space-y-6 max-w-4xl">
        
        {/* Global Timetable Management */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/10">
            <div>
              <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-indigo-500">public</span>
                Global Timetable Management
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Manage high-level operations for the entire department's scheduling data.
              </p>
            </div>
          </div>
          
          <div className="p-5 rounded-lg border-2 border-destructive/20 bg-destructive/5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-destructive"></div>
            
            <div>
              <h4 className="font-bold text-destructive flex items-center gap-2 text-[12px] uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">warning</span>
                Danger Zone: Wipe Department Database
              </h4>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed font-medium">
                This action is <strong className="text-destructive font-extrabold uppercase">irreversible</strong>. 
                It will permanently delete <b>EVERY single scheduled slot</b>, across every class, every section, and every year.
                It brings the database back to a completely blank slate.
              </p>
            </div>
            
            <div className="bg-white/50 p-4 rounded border border-destructive/10 space-y-3">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">
                Type <span className="text-destructive font-black select-all">DELETE</span> below to confirm this action:
              </label>
              
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={typedConfirm}
                  onChange={e => setTypedConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="bg-white border-2 border-outline-variant/20 rounded-lg px-4 py-2 font-bold w-48 text-sm outline-none focus:border-destructive transition-colors focus:ring-4 focus:ring-destructive/10"
                />
                
                <button
                  disabled={typedConfirm !== "DELETE" || loading}
                  onClick={handleGlobalWipe}
                  className="h-10.5 px-6 bg-red-500 text-black font-bold text-[11px] uppercase tracking-widest rounded-lg hover:opacity-90 disabled:opacity-40 disabled:bg-red-500 disabled:text-on-surface-variant transition-all flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">
                    {loading ? "sync" : "delete_forever"}
                  </span>
                  {loading ? "WIPING..." : "ERASE EVERYTHING"}
                </button>
              </div>
            </div>

            {successMsg && (
              <div className="mt-4 p-3 bg-teal-50 border-emerald-500/30 border rounded-lg flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600 text-sm">check</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Success</div>
                  <div className="text-[11px] text-emerald-600/80 font-medium font-mono">{successMsg}</div>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Master Data Management */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/10">
            <div>
              <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-indigo-500">database</span>
                Master Data Management
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Manage base entity infrastructure representing the organization's resources.
              </p>
            </div>
          </div>
          
          <div className="p-5 rounded-lg border-2 border-destructive/20 bg-destructive/5 space-y-4 relative overflow-hidden mt-6">
            <div className="absolute top-0 left-0 w-2 h-full bg-destructive"></div>
            
            <div>
              <h4 className="font-bold text-destructive flex items-center gap-2 text-[12px] uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">skull</span>
                Danger Zone: Wipe Master Data (Factory Reset)
              </h4>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed font-medium">
                This action is <strong className="text-destructive font-extrabold uppercase">catastrophic & irreversible</strong>. 
                It will permanently delete <b>EVERY single Teacher, Subject, Class, Room, and Lab</b> alongside all their linkages and the entire Timetable.
                It brings the ENTIRE system back to an empty factory state.
              </p>
            </div>
            
            <div className="bg-white/50 p-4 rounded border border-destructive/10 space-y-3">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">
                Type <span className="text-destructive font-black select-all">FACTORY RESET</span> below to confirm this action:
              </label>
              
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={factoryConfirm}
                  onChange={e => setFactoryConfirm(e.target.value)}
                  placeholder="FACTORY RESET"
                  className="bg-white border-2 border-outline-variant/20 rounded-lg px-4 py-2 font-bold w-48 text-sm outline-none focus:border-destructive transition-colors focus:ring-4 focus:ring-destructive/10"
                />
                
                <button
                  disabled={factoryConfirm !== "FACTORY RESET" || factoryLoading}
                  onClick={handleFactoryReset}
                  className="h-10.5 px-6 bg-red-500 text-black font-bold text-[11px] uppercase tracking-widest rounded-lg hover:opacity-90 disabled:opacity-40 disabled:bg-red-500 disabled:text-on-surface-variant transition-all flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">
                    {factoryLoading ? "sync" : "delete_forever"}
                  </span>
                  {factoryLoading ? "WIPING..." : "FACTORY RESET"}
                </button>
              </div>
            </div>

            {factorySuccessMsg && (
              <div className="mt-4 p-3 bg-teal-50 border-emerald-500/30 border rounded-lg flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600 text-sm">check</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Success</div>
                  <div className="text-[11px] text-emerald-600/80 font-medium font-mono">{factorySuccessMsg}</div>
                </div>
              </div>
            )}
            
          </div>
        </div>
        
      </div>
    </div>
  );
}
