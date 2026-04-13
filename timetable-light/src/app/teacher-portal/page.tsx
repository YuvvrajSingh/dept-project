"use client";

import { useEffect, useState } from "react";
import { teacherMeApi, teacherApi, subjectApi } from "@/lib/api";
import type { Teacher, Subject, TeacherSubject } from "@/lib/types";

export default function TeacherPortalSubjectsPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assigned, setAssigned] = useState<TeacherSubject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const me = await teacherMeApi.get();
      setTeacher(me);
      const [asgn, all] = await Promise.all([
        teacherApi.getSubjects(me.id),
        subjectApi.list(),
      ]);
      setAssigned(asgn);
      setAllSubjects(all);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const assignedIds = new Set(assigned.map((a) => a.subjectId));
  const availableSubjects = allSubjects.filter((s) => s.isActive && !assignedIds.has(s.id));

  async function handleAssign() {
    if (!selectedSubjectId || !teacher) return;
    setAddingId(Number(selectedSubjectId));
    setError(null);
    try {
      await teacherApi.assignSubject(teacher.id, Number(selectedSubjectId));
      setSelectedSubjectId("");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to assign subject.");
    } finally {
      setAddingId(null);
    }
  }

  async function handleRemove(subjectId: number) {
    if (!teacher) return;
    setRemovingId(subjectId);
    setError(null);
    try {
      await teacherApi.removeSubject(teacher.id, subjectId);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove subject.");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-on-surface-variant font-semibold uppercase tracking-widest">
          Loading your subjects...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tighter text-on-surface italic">
          My Subjects
        </h2>
        <p className="text-on-surface-variant text-sm font-medium">
          Manage the subjects assigned to you for the current semester.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assigned Subjects */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm">
          <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">
              Assigned Subjects
            </h3>
            <span className="text-xs font-bold text-outline bg-surface-container px-3 py-1 rounded-full">
              {assigned.length} subject{assigned.length !== 1 ? "s" : ""}
            </span>
          </div>

          {assigned.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-outline-variant/30 mb-3 block">
                menu_book
              </span>
              <p className="text-sm font-bold text-on-surface-variant">No subjects assigned yet</p>
              <p className="text-xs text-on-surface-variant/60 mt-1">
                Add subjects from the panel on the right.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/5">
              {assigned.map((a) => {
                const subject = allSubjects.find((s) => s.id === a.subjectId);
                return (
                  <div key={a.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          subject?.type === "LAB" ? "bg-tertiary-container" : "bg-secondary"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-on-surface truncate">
                            {subject?.name ?? a.subject?.name ?? "Unknown Subject"}
                          </p>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              subject?.type === "LAB"
                                ? "bg-tertiary-fixed/20 text-on-tertiary-fixed-variant"
                                : "bg-primary-fixed/20 text-on-primary-fixed-variant"
                            }`}
                          >
                            {subject?.type ?? "—"}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                          {subject?.code}
                          {subject?.creditHours ? ` · ${subject.creditHours} credits` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(a.subjectId)}
                      disabled={removingId === a.subjectId}
                      className="flex-shrink-0 p-2 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-all disabled:opacity-50"
                      title="Remove subject"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {removingId === a.subjectId ? "hourglass_empty" : "remove_circle"}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Subject Panel */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm h-fit">
          <div className="px-6 py-5 border-b border-outline-variant/10">
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">
              Add Subject
            </h3>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Select Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full appearance-none bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm font-bold text-on-surface outline-none focus:border-secondary transition-colors"
                disabled={availableSubjects.length === 0}
              >
                <option value="">Choose a subject...</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.type}] {s.abbreviation || s.name}
                  </option>
                ))}
              </select>
              {availableSubjects.length === 0 && (
                <p className="text-[11px] text-outline italic">
                  All active subjects are already assigned.
                </p>
              )}
            </div>

            <button
              onClick={handleAssign}
              disabled={!selectedSubjectId || !!addingId || availableSubjects.length === 0}
              className="w-full px-4 py-3 bg-primary-container text-white font-bold text-sm rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              {addingId ? "Assigning..." : "Assign Subject"}
            </button>

            <p className="text-[11px] text-on-surface-variant/60 leading-relaxed">
              Only active subjects not already in your profile are listed. Contact admin if a subject is missing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
