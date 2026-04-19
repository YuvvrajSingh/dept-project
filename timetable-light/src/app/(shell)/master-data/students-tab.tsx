"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { studentApi, classApi, Student } from "@/lib/api";
import type { ClassSection } from "@/lib/types";
import { SkeletonTable } from "@/components/skeleton";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-types
// ─────────────────────────────────────────────────────────────────────────────
type DrawerMode = "create" | "edit" | "promote" | "demote" | "bulk";

interface StudentForm {
  rollNumber: string;
  name: string;
  email: string;
  batch: string;
  classSectionId: string;
}

const EMPTY_FORM: StudentForm = {
  rollNumber: "",
  name: "",
  email: "",
  batch: "",
  classSectionId: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function classLabel(cs: ClassSection) {
  return `${cs.branch?.name ?? "?"} • Sem ${cs.semester} (${cs.year})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function StudentsTab({ academicYearId }: { academicYearId?: string }) {
  // ── Data ──
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");

  // ── Selection ──
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Drawer ──
  const [drawer, setDrawer] = useState<{ open: boolean; mode: DrawerMode }>({
    open: false,
    mode: "create",
  });
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferNote, setTransferNote] = useState("");

  // ── Bulk import ──
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkClassId, setBulkClassId] = useState("");
  const [bulkResult, setBulkResult] = useState<{ succeeded: number; failed: any[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Loading state ──
  const [actionLoading, setActionLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────────────────────────────────
  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: { classSectionId?: string; search?: string } = {};
      if (filterClass) params.classSectionId = filterClass;
      if (search) params.search = search;
      const data = await studentApi.list(params);
      setStudents(data);
    } catch (e) {
      showToast((e as Error).message, "err");
    } finally {
      setLoading(false);
    }
  }, [filterClass, search]);

  useEffect(() => {
    classApi.list(academicYearId).then(setClasses).catch(() => {});
  }, [academicYearId]);

  useEffect(() => {
    const t = setTimeout(loadStudents, 300);
    return () => clearTimeout(t);
  }, [loadStudents]);

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD handlers
  // ─────────────────────────────────────────────────────────────────────────
  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDrawer({ open: true, mode: "create" });
  }
  function openEdit(s: Student) {
    setEditTarget(s);
    setForm({
      rollNumber: s.rollNumber,
      name: s.name,
      email: s.email ?? "",
      batch: s.batch ?? "",
      classSectionId: s.classSectionId,
    });
    setDrawer({ open: true, mode: "edit" });
  }
  function openBulk() {
    setBulkFile(null);
    setBulkResult(null);
    setBulkClassId(filterClass || "");
    setDrawer({ open: true, mode: "bulk" });
  }
  function openTransfer(mode: "promote" | "demote") {
    if (selected.size === 0) return showToast("Select at least one student first", "err");
    setTransferTarget("");
    setTransferNote("");
    setDrawer({ open: true, mode });
  }
  function closeDrawer() {
    setDrawer((d) => ({ ...d, open: false }));
    setSelected(new Set());
  }

  async function handleSaveSingle() {
    if (!form.rollNumber || !form.name || !form.classSectionId) {
      return showToast("Roll Number, Name and Class are required", "err");
    }
    setActionLoading(true);
    try {
      if (drawer.mode === "create") {
        await studentApi.create({
          rollNumber: form.rollNumber,
          name: form.name,
          email: form.email || undefined,
          classSectionId: form.classSectionId,
          batch: form.batch || undefined,
        });
        showToast(`Student ${form.rollNumber} created`);
      } else if (drawer.mode === "edit" && editTarget) {
        await studentApi.update(editTarget.id, {
          name: form.name,
          email: form.email || undefined,
          classSectionId: form.classSectionId,
          batch: form.batch || undefined,
        });
        showToast(`${editTarget.rollNumber} updated`);
      }
      closeDrawer();
      loadStudents();
    } catch (e) {
      showToast((e as Error).message, "err");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSoftDelete(s: Student) {
    if (!confirm(`Deactivate ${s.rollNumber}? They will no longer be able to log in.`)) return;
    try {
      await studentApi.softDelete(s.id);
      showToast(`${s.rollNumber} deactivated`);
      loadStudents();
    } catch (e) {
      showToast((e as Error).message, "err");
    }
  }

  async function handleTransfer() {
    if (!transferTarget) return showToast("Please select a destination class", "err");
    const ids = Array.from(selected);
    setActionLoading(true);
    try {
      const fn = drawer.mode === "promote" ? studentApi.promote : studentApi.demote;
      const result = await fn(ids, transferTarget, transferNote || undefined);
      showToast(`${result.succeeded} student(s) moved. ${result.failed?.length ?? 0} failed.`);
      closeDrawer();
      loadStudents();
    } catch (e) {
      showToast((e as Error).message, "err");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkImport() {
    if (!bulkFile) return showToast("Please select a CSV or XLSX file", "err");
    if (!bulkClassId) return showToast("Please select destination class section", "err");
    setActionLoading(true);
    try {
      const result = await studentApi.bulkImportFile(bulkFile, bulkClassId);
      setBulkResult(result);
      showToast(`Import complete — ${result.succeeded} inserted/updated`);
      loadStudents();
    } catch (e) {
      showToast((e as Error).message, "err");
    } finally {
      setActionLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Selection helpers
  // ─────────────────────────────────────────────────────────────────────────
  const allSelected = students.length > 0 && selected.size === students.length;
  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(students.map((s) => s.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-xl shadow-2xl text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
            toast.type === "ok"
              ? "bg-on-surface text-surface"
              : "bg-error text-on-error"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-outline-variant/10">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roll / name…"
              className="pl-10 pr-4 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-sm text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-secondary transition-colors"
            />
          </div>

          {/* Filter by class */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-sm text-on-surface focus:outline-none focus:border-secondary transition-colors"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {classLabel(c)}
              </option>
            ))}
          </select>

          {/* Record count */}
          <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded">
            {students.length} RECORDS
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {selected.size > 0 && (
            <>
              <button
                onClick={() => openTransfer("promote")}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-container text-on-primary-container text-xs font-bold uppercase tracking-wider rounded-md hover:scale-[1.02] transition-all"
              >
                <span className="material-symbols-outlined text-sm">arrow_upward</span>
                Promote ({selected.size})
              </button>
              <button
                onClick={() => openTransfer("demote")}
                className="flex items-center gap-1.5 px-4 py-2 bg-error-container text-on-error-container text-xs font-bold uppercase tracking-wider rounded-md hover:scale-[1.02] transition-all"
              >
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
                Demote ({selected.size})
              </button>
            </>
          )}

          <button
            onClick={openBulk}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-wider rounded-md hover:bg-surface-variant transition-all border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            Bulk Import
          </button>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-secondary to-secondary-container text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Add Student
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-highest/50">
              <th className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-outline-variant"
                />
              </th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Roll No</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Name</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Class</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Batch</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12">
                  <SkeletonTable rows={8} columns={6} />
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="material-symbols-outlined text-[3rem] text-on-surface-variant/30 mb-3">group_off</span>
                    <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">No students found</p>
                    <p className="text-xs text-outline/60 mt-1">Try a different filter or add a student above</p>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className={`hover:bg-surface-container-lowest transition-colors ${selected.has(s.id) ? "bg-primary-fixed/10" : ""}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleOne(s.id)}
                      className="rounded border-outline-variant"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-bold text-secondary">{s.rollNumber}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary-fixed flex items-center justify-center text-on-primary-fixed text-xs font-bold shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-on-surface text-sm">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">
                    {s.classSection
                      ? `${s.classSection.branch?.name ?? "?"} Sem ${s.classSection.semester}`
                      : "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{s.batch ?? "—"}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-tighter ${
                        s.isActive
                          ? "bg-primary-fixed text-on-primary-fixed-variant"
                          : "bg-error-container text-on-error-container"
                      }`}
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-0.5">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-2 text-on-surface-variant hover:text-secondary transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      {s.isActive && (
                        <button
                          onClick={() => handleSoftDelete(s)}
                          className="p-2 text-on-surface-variant hover:text-error transition-colors"
                          title="Deactivate"
                        >
                          <span className="material-symbols-outlined text-lg">person_off</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Slide-out Drawer ── */}
      {drawer.open && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-surface-container-lowest shadow-2xl flex flex-col overflow-y-auto">
            {/* Drawer header */}
            <div className="flex items-center justify-between p-8 pb-6 border-b border-outline-variant/10 shrink-0">
              <h3 className="text-xl font-black tracking-tighter uppercase italic">
                {drawer.mode === "create" && "Add Student"}
                {drawer.mode === "edit" && "Edit Student"}
                {drawer.mode === "promote" && `Promote ${selected.size} Student(s)`}
                {drawer.mode === "demote" && `Demote ${selected.size} Student(s)`}
                {drawer.mode === "bulk" && "Bulk Import"}
              </h3>
              <button onClick={closeDrawer} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 p-8 space-y-8">
              {/* ── CREATE / EDIT form ── */}
              {(drawer.mode === "create" || drawer.mode === "edit") && (
                <>
                  <Field label="Roll Number">
                    <input
                      value={form.rollNumber}
                      onChange={(e) => setForm({ ...form, rollNumber: e.target.value.toUpperCase() })}
                      disabled={drawer.mode === "edit"}
                      placeholder="e.g. 21UCSE1001"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Full Name">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Email (optional)">
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      type="email"
                      placeholder="e.g. priya@example.com"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Batch Year (optional)">
                    <input
                      value={form.batch}
                      onChange={(e) => setForm({ ...form, batch: e.target.value })}
                      placeholder="e.g. 2021"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Class Section">
                    <select
                      value={form.classSectionId}
                      onChange={(e) => setForm({ ...form, classSectionId: e.target.value })}
                      className={inputCls}
                    >
                      <option value="">— Select class —</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {classLabel(c)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                    Default password: <code className="font-mono text-secondary">password123</code>
                  </p>
                </>
              )}

              {/* ── PROMOTE / DEMOTE form ── */}
              {(drawer.mode === "promote" || drawer.mode === "demote") && (
                <>
                  <p className="text-sm text-on-surface-variant font-medium">
                    Moving <strong>{selected.size}</strong> student(s) to a new class section.
                    This action will be recorded in each student&apos;s history.
                  </p>
                  <Field label={drawer.mode === "promote" ? "Promote To" : "Demote To"}>
                    <select
                      value={transferTarget}
                      onChange={(e) => setTransferTarget(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— Choose destination class —</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {classLabel(c)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Reason / Note (optional)">
                    <input
                      value={transferNote}
                      onChange={(e) => setTransferNote(e.target.value)}
                      placeholder="e.g. End of academic year promotion"
                      className={inputCls}
                    />
                  </Field>
                  <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 max-h-40 overflow-y-auto">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">
                      Selected Students
                    </p>
                    {students
                      .filter((s) => selected.has(s.id))
                      .map((s) => (
                        <div key={s.id} className="text-xs font-mono py-0.5 text-on-surface">
                          {s.rollNumber} — {s.name}
                        </div>
                      ))}
                  </div>
                </>
              )}

              {/* ── BULK IMPORT form ── */}
              {drawer.mode === "bulk" && (
                <>
                  <div className="p-4 bg-primary-container/30 rounded-xl border border-primary/20 text-sm font-medium text-on-surface space-y-2">
                    <p className="font-black uppercase text-xs tracking-widest text-primary">CSV / Excel Format</p>
                    <p>Columns required: <code className="font-mono bg-surface-container px-1 rounded">RollNumber</code> · <code className="font-mono bg-surface-container px-1 rounded">Name</code></p>
                    <p className="text-on-surface-variant text-xs">Optional: <code className="font-mono bg-surface-container px-1 rounded">Email</code> · <code className="font-mono bg-surface-container px-1 rounded">Batch</code></p>
                    <p className="text-on-surface-variant text-xs">Existing roll numbers will be updated; new ones will be created with default password <code className="font-mono">password123</code>.</p>
                  </div>
                  <Field label="Target Class Section">
                    <select
                      value={bulkClassId}
                      onChange={(e) => setBulkClassId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— Select class —</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {classLabel(c)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="File (CSV or XLSX)">
                    <div
                      className="border-2 border-dashed border-outline-variant/40 rounded-xl p-8 text-center cursor-pointer hover:border-secondary/60 transition-colors"
                      onClick={() => fileRef.current?.click()}
                    >
                      <span className="material-symbols-outlined text-[2.5rem] text-on-surface-variant/40 block mb-2">upload_file</span>
                      {bulkFile ? (
                        <p className="text-sm font-bold text-secondary">{bulkFile.name}</p>
                      ) : (
                        <p className="text-sm text-on-surface-variant font-medium">Click to choose a file</p>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
                    />
                  </Field>

                  {bulkResult && (
                    <div className={`p-4 rounded-xl text-sm font-bold border ${bulkResult.failed.length > 0 ? "bg-error-container text-on-error-container border-error/30" : "bg-primary-container text-on-primary-container border-primary/20"}`}>
                      <div>✓ {bulkResult.succeeded} inserted/updated</div>
                      {bulkResult.failed.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {bulkResult.failed.slice(0, 5).map((f: any, i: number) => (
                            <div key={i} className="text-xs font-mono">{f.rollNumber ?? f}: {f.reason ?? "failed"}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Drawer footer */}
            <div className="p-8 pt-0 shrink-0">
              <button
                onClick={() => {
                  if (drawer.mode === "create" || drawer.mode === "edit") handleSaveSingle();
                  else if (drawer.mode === "promote" || drawer.mode === "demote") handleTransfer();
                  else handleBulkImport();
                }}
                disabled={actionLoading}
                className="w-full py-4 bg-secondary text-white font-black uppercase tracking-widest text-xs rounded-lg shadow-xl shadow-secondary/20 hover:bg-secondary-container transition-all disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {actionLoading && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
                {drawer.mode === "create" && "Create Student"}
                {drawer.mode === "edit" && "Save Changes"}
                {drawer.mode === "promote" && "Confirm Promotion"}
                {drawer.mode === "demote" && "Confirm Demotion"}
                {drawer.mode === "bulk" && (bulkResult ? "Import Again" : "Start Import")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tiny helpers
// ─────────────────────────────────────────────────────────────────────────────
const inputCls =
  "w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-secondary transition-all px-0 pb-2 font-bold outline-none text-on-surface";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block">
        {label}
      </label>
      {children}
    </div>
  );
}
