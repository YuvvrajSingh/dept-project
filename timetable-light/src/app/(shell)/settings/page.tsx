"use client";

import { useState, useEffect } from "react";
import { timetableApi, academicYearApi } from "@/lib/api";
import { useAcademicYear } from "@/contexts/academic-year-context";
import type { AcademicYear } from "@/lib/types";

export default function SettingsPage() {
  const { refresh: refreshContext, selectedYear } = useAcademicYear();

  // Academic Year state
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [newStartYear, setNewStartYear] = useState("");
  const [creating, setCreating] = useState(false);
  const [cloneSourceId, setCloneSourceId] = useState<number | null>(null);
  const [cloneTargetId, setCloneTargetId] = useState<number | null>(null);
  const [cloning, setCloning] = useState(false);
  const [cloneResult, setCloneResult] = useState<string | null>(null);
  const [yearMsg, setYearMsg] = useState("");
  const [deleteAllConfirm, setDeleteAllConfirm] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteAllMsg, setDeleteAllMsg] = useState("");

  // Existing danger zone state
  const [typedConfirm, setTypedConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [factoryConfirm, setFactoryConfirm] = useState("");
  const [factoryLoading, setFactoryLoading] = useState(false);
  const [factorySuccessMsg, setFactorySuccessMsg] = useState("");

  useEffect(() => {
    loadYears();
  }, []);

  async function loadYears() {
    setYearsLoading(true);
    try {
      const y = await academicYearApi.list();
      setYears(y);
    } catch {
      setYears([]);
    } finally {
      setYearsLoading(false);
    }
  }

  async function handleCreateYear() {
    const start = parseInt(newStartYear);
    if (!start || start < 2015 || start > 2040) {
      setYearMsg("Enter a valid start year (2015-2040)");
      return;
    }
    setCreating(true);
    setYearMsg("");
    try {
      await academicYearApi.create({ startYear: start });
      setNewStartYear("");
      setYearMsg(`Created ${start}-${start + 1}`);
      await loadYears();
      refreshContext();
    } catch (e: any) {
      setYearMsg(e.message || "Error creating year");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(yearId: number, status: "DRAFT" | "ACTIVE" | "ARCHIVED") {
    try {
      if (status === "ACTIVE") {
        await academicYearApi.activate(yearId);
      } else {
        await academicYearApi.updateStatus(yearId, status);
      }
      await loadYears();
      refreshContext();
    } catch (e: any) {
      alert(e.message || "Error updating status");
    }
  }

  async function handleDeleteYear(yearId: number) {
    if (!confirm("Delete this academic year? This cannot be undone.")) return;
    try {
      await academicYearApi.delete(yearId);
      await loadYears();
      refreshContext();
    } catch (e: any) {
      alert(e.message || "Error deleting year");
    }
  }

  async function handleClone() {
    if (!cloneSourceId || !cloneTargetId) return;
    setCloning(true);
    setCloneResult(null);
    try {
      const result = await academicYearApi.clone(cloneSourceId, cloneTargetId);
      setCloneResult(result.message || "Clone completed successfully");
      await loadYears();
      refreshContext();
    } catch (e: any) {
      setCloneResult(e.message || "Clone failed");
    } finally {
      setCloning(false);
    }
  }

  const handleGlobalWipe = async () => {
    if (typedConfirm !== "DELETE") return;
    setLoading(true);
    setSuccessMsg("");
    try {
      await timetableApi.clearGlobalTimetable();
      setSuccessMsg("Department timetable successfully wiped clean.");
      setTypedConfirm("");
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
      setFactoryConfirm("");
    } catch (e: any) {
      alert("Failed to factory reset: " + e.message);
    } finally {
      setFactoryLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (deleteAllConfirm !== "DELETE ALL") return;
    setDeletingAll(true);
    setDeleteAllMsg("");
    try {
      const result = await academicYearApi.deleteAll();
      setDeleteAllMsg(`Deleted ${result.deleted} academic year(s) and all associated data.`);
      setDeleteAllConfirm("");
      await loadYears();
      refreshContext();
    } catch (e: any) {
      alert("Failed to delete: " + e.message);
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="flex gap-8 pt-4">
      <div className="flex-1 space-y-6 max-w-4xl">

        {/* ─── Academic Year Management ─── */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/10">
            <div>
              <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-indigo-500">calendar_month</span>
                Academic Year Management
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Create, activate, archive, and clone academic years.
              </p>
            </div>
          </div>

          {/* Create New Year */}
          <div className="p-5 rounded-lg bg-surface-container-low space-y-4 mb-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
              Create New Year
            </h4>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">
                  Start Year
                </label>
                <input
                  type="number"
                  value={newStartYear}
                  onChange={(e) => setNewStartYear(e.target.value)}
                  placeholder="e.g. 2026"
                  min="2015"
                  max="2040"
                  className="w-full bg-surface-container border-none rounded-lg px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>
              <button
                onClick={handleCreateYear}
                disabled={creating}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-secondary to-secondary-container text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
            {yearMsg && (
              <p className="text-xs font-bold text-secondary mt-1">{yearMsg}</p>
            )}
          </div>

          {/* Year List */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-3">
              All Academic Years
            </h4>
            {yearsLoading ? (
              <div className="flex items-center justify-center py-12 border-2 border-dashed border-outline-variant/20 rounded-xl">
                <p className="text-sm text-on-surface-variant animate-pulse">Loading...</p>
              </div>
            ) : years.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-outline-variant/20 rounded-xl">
                <span className="material-symbols-outlined text-3xl text-outline-variant/40 mb-3">event_busy</span>
                <p className="text-sm font-bold text-on-surface-variant">No academic years created yet.</p>
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-xl overflow-hidden">
                {years.map((year, i) => (
                  <div
                    key={year.id}
                    className={`flex items-center justify-between px-5 py-4 hover:bg-surface-container transition-colors group ${
                      i < years.length - 1 ? "border-b border-outline-variant/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface tracking-tight">{year.label}</span>
                        <span className="text-[10px] text-on-surface-variant">
                          {new Date(year.startDate).toLocaleDateString()} – {new Date(year.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      {year.status === "ACTIVE" && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold uppercase rounded tracking-wider">
                          Active
                        </span>
                      )}
                      {year.status === "DRAFT" && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase rounded tracking-wider">
                          Draft
                        </span>
                      )}
                      {year.status === "ARCHIVED" && (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold uppercase rounded tracking-wider">
                          Archived
                        </span>
                      )}
                      {year.isActive && (
                        <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {year.status === "DRAFT" && (
                        <button
                          onClick={() => handleStatusChange(year.id, "ACTIVE")}
                          title="Set as Active"
                          className="p-2 text-on-surface-variant hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">play_arrow</span>
                        </button>
                      )}
                      {year.status === "ACTIVE" && (
                        <button
                          onClick={() => handleStatusChange(year.id, "ARCHIVED")}
                          title="Archive"
                          className="p-2 text-on-surface-variant hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">archive</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteYear(year.id)}
                        title="Delete"
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clone */}
          <div className="p-5 rounded-lg bg-surface-container-low space-y-4 mt-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-indigo-500">content_copy</span>
              Clone Timetable Between Years
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Deep copy class sections, subject assignments, timetable entries, and lab groups from one year to another.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">Source Year</label>
                <select
                  value={cloneSourceId ?? ""}
                  onChange={(e) => setCloneSourceId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-surface-container border-none rounded-lg px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  <option value="">Select source...</option>
                  {years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
                </select>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/40 mb-2">arrow_forward</span>
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">Target Year</label>
                <select
                  value={cloneTargetId ?? ""}
                  onChange={(e) => setCloneTargetId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-surface-container border-none rounded-lg px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  <option value="">Select target...</option>
                  {years.filter(y => y.status === "DRAFT").map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
                </select>
              </div>
              <button
                onClick={handleClone}
                disabled={cloning || !cloneSourceId || !cloneTargetId}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-secondary to-secondary-container text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                {cloning ? "Cloning..." : "Clone"}
              </button>
            </div>
            {cloneResult && (
              <div className="mt-3 p-3 bg-teal-50 border-emerald-500/30 border rounded-lg flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600 text-sm">check</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Clone Complete</div>
                  <div className="text-[11px] text-emerald-600/80 font-medium">{cloneResult}</div>
                </div>
              </div>
            )}
          </div>

          {/* Delete All Academic Years */}
          <div className="p-5 rounded-lg border-2 border-destructive/20 bg-destructive/5 space-y-4 relative overflow-hidden mt-6">
            <div className="absolute top-0 left-0 w-2 h-full bg-destructive"></div>
            <div>
              <h4 className="font-bold text-destructive flex items-center gap-2 text-[12px] uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">warning</span>
                Delete All Academic Years
              </h4>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed font-medium">
                This action is <strong className="text-destructive font-extrabold uppercase">irreversible</strong>.
                It will permanently delete <b>EVERY academic year</b> along with all class sections, subject assignments,
                timetable entries, and lab groups associated with them.
              </p>
            </div>
            <div className="bg-white/50 p-4 rounded border border-destructive/10 space-y-3">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">
                Type <span className="text-destructive font-black select-all">DELETE ALL</span> below to confirm:
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={deleteAllConfirm}
                  onChange={e => setDeleteAllConfirm(e.target.value)}
                  placeholder="DELETE ALL"
                  className="bg-white border-2 border-outline-variant/20 rounded-lg px-4 py-2 font-bold w-48 text-sm outline-none focus:border-destructive transition-colors focus:ring-4 focus:ring-destructive/10"
                />
                <button
                  disabled={deleteAllConfirm !== "DELETE ALL" || deletingAll}
                  onClick={handleDeleteAll}
                  className="h-10.5 px-6 bg-red-500 text-black font-bold text-[11px] uppercase tracking-widest rounded-lg hover:opacity-90 disabled:opacity-40 disabled:bg-red-500 disabled:text-on-surface-variant transition-all flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">
                    {deletingAll ? "sync" : "delete_forever"}
                  </span>
                  {deletingAll ? "DELETING..." : "DELETE ALL YEARS"}
                </button>
              </div>
            </div>
            {deleteAllMsg && (
              <div className="mt-4 p-3 bg-teal-50 border-emerald-500/30 border rounded-lg flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600 text-sm">check</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Success</div>
                  <div className="text-[11px] text-emerald-600/80 font-medium font-mono">{deleteAllMsg}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Global Timetable Management ─── */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/10">
            <div>
              <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-indigo-500">public</span>
                Global Timetable Management
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Manage high-level operations for the entire department&apos;s scheduling data.
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

        {/* ─── Master Data Management ─── */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/10">
            <div>
              <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-indigo-500">database</span>
                Master Data Management
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Manage base entity infrastructure representing the organization&apos;s resources.
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
                This action is <strong className="text-destructive font-extrabold uppercase">catastrophic &amp; irreversible</strong>. 
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
