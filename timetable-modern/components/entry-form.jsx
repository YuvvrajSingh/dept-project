"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createEntry, deleteEntry, updateEntry } from "@/lib/api/timetable";
import { getTeacherSubjects } from "@/lib/api/teachers";
import ConflictBanner from "./conflict-banner";
import Spinner from "./spinner";

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6];
const SLOT_OPTIONS = [1, 2, 3, 4, 5, 6];
const LAB_GROUPS = ["A1", "A2", "A3"];

function mapIssueFields(status, entryType, message) {
  if (!message) return [];
  if (status === 409) {
    if (message.includes("Class section already has an entry")) return ["day", "slot"];
    if (message.startsWith("Teacher ")) return entryType === "THEORY" ? ["teacher"] : ["labTeacher"];
    if (message.startsWith("Room ")) return ["room"];
    if (message.startsWith("Lab ")) return ["lab"];
  }
  if (status === 422) {
    if (message.includes("Subject is not assigned")) return entryType === "THEORY" ? ["subject"] : ["labSubject"];
    if (message.includes("Teacher is not assigned")) return entryType === "THEORY" ? ["teacher"] : ["labTeacher"];
  }
  return [];
}

const inputBase = "w-full border-2 border-foreground bg-background font-mono text-sm h-10 px-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none";
const inputError = "w-full border-2 border-destructive bg-destructive/5 font-mono text-sm h-10 px-3 focus:ring-2 focus:ring-destructive outline-none";
const labelClass = "text-[10px] font-mono tracking-[0.2em] uppercase font-bold block mb-2";

export default function EntryForm({
  classSectionId,
  initialDay,
  initialSlot,
  existingEntry,
  onSuccess,
  onClose,
  classSubjects,
  allRooms,
  allLabs,
  allTeachers,
}) {
  const router = useRouter();
  const [entryType, setEntryType] = useState(existingEntry?.type === "LAB" ? "LAB" : "THEORY");
  const [day, setDay] = useState(initialDay || 1);
  const [slot, setSlot] = useState(initialSlot || 1);
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [labGroups, setLabGroups] = useState([
    { groupName: "A1", subjectId: "", labId: "", teacherId: "" },
    { groupName: "A2", subjectId: "", labId: "", teacherId: "" },
    { groupName: "A3", subjectId: "", labId: "", teacherId: "" },
  ]);
  const [teacherMap, setTeacherMap] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState("");
  const [prereq, setPrereq] = useState("");
  const [issueFields, setIssueFields] = useState([]);

  const editableEntryId = existingEntry?.entryId || null;

  useEffect(() => {
    setEntryType(existingEntry?.type === "LAB" ? "LAB" : "THEORY");
    setDay(Number(initialDay) || 1);
    setSlot(Number(initialSlot) || 1);

    if (existingEntry?.type === "THEORY") {
      setSubjectId(existingEntry.subjectId ? String(existingEntry.subjectId) : "");
      setTeacherId(existingEntry.teacherId ? String(existingEntry.teacherId) : "");
      setRoomId(existingEntry.roomId ? String(existingEntry.roomId) : "");
      setLabGroups([
        { groupName: "A1", subjectId: "", labId: "", teacherId: "" },
        { groupName: "A2", subjectId: "", labId: "", teacherId: "" },
        { groupName: "A3", subjectId: "", labId: "", teacherId: "" },
      ]);
    } else if (existingEntry?.type === "LAB") {
      setSubjectId("");
      setTeacherId("");
      setRoomId("");
      setLabGroups(
        LAB_GROUPS.map((groupName) => ({
          groupName,
          subjectId: existingEntry.groups?.[groupName]?.subjectId ? String(existingEntry.groups[groupName].subjectId) : "",
          labId: existingEntry.groups?.[groupName]?.labId ? String(existingEntry.groups[groupName].labId) : "",
          teacherId: existingEntry.groups?.[groupName]?.teacherId ? String(existingEntry.groups[groupName].teacherId) : "",
        }))
      );
    } else {
      setSubjectId("");
      setTeacherId("");
      setRoomId("");
      setLabGroups([
        { groupName: "A1", subjectId: "", labId: "", teacherId: "" },
        { groupName: "A2", subjectId: "", labId: "", teacherId: "" },
        { groupName: "A3", subjectId: "", labId: "", teacherId: "" },
      ]);
    }

    setError("");
    setConflict("");
    setPrereq("");
    setIssueFields([]);
  }, [existingEntry, initialDay, initialSlot]);

  const clearIssueIndicators = () => {
    setConflict("");
    setPrereq("");
    setIssueFields([]);
  };

  useEffect(() => {
    let active = true;
    async function loadTeacherSubjects() {
      try {
        const pairs = await Promise.all(
          allTeachers.map(async (teacher) => {
            const subjects = await getTeacherSubjects(teacher.id);
            return [teacher.id, subjects.map((item) => item.subjectId)];
          })
        );
        if (!active) return;
        const map = {};
        pairs.forEach(([id, subjectIds]) => { map[id] = subjectIds; });
        setTeacherMap(map);
      } catch {
        if (active) setTeacherMap({});
      }
    }
    loadTeacherSubjects();
    return () => { active = false; };
  }, [allTeachers]);

  const subjectsForType = useMemo(
    () => classSubjects.filter((item) => item.subject.type === entryType).map((item) => item.subject),
    [classSubjects, entryType]
  );

  const filteredTeachers = useMemo(() => {
    if (!subjectId) return [];
    return allTeachers.filter((teacher) => (teacherMap[teacher.id] || []).includes(Number(subjectId)));
  }, [subjectId, allTeachers, teacherMap]);

  const labSubjects = useMemo(
    () => classSubjects.filter((item) => item.subject.type === "LAB").map((item) => item.subject),
    [classSubjects]
  );

  const getTeachersForSubject = (groupSubjectId) => {
    if (!groupSubjectId) return [];
    return allTeachers.filter((teacher) => (teacherMap[teacher.id] || []).includes(Number(groupSubjectId)));
  };

  const completeLabGroups = useMemo(
    () => labGroups.filter((g) => Number(g.subjectId) > 0 && Number(g.labId) > 0 && Number(g.teacherId) > 0),
    [labGroups]
  );

  const hasPartialLabGroup = useMemo(
    () => labGroups.some((g) => {
      const s = Number(g.subjectId) > 0, l = Number(g.labId) > 0, t = Number(g.teacherId) > 0;
      return (s ? 1 : 0) + (l ? 1 : 0) + (t ? 1 : 0) > 0 && !(s && l && t);
    }),
    [labGroups]
  );

  const canSubmitLab = entryType === "LAB" && day && slot && completeLabGroups.length >= 1 && !hasPartialLabGroup;
  const canSubmitTheory = entryType === "THEORY" && day && slot && subjectId && teacherId && roomId;

  const handleGroupChange = (groupName, key, value) => {
    setLabGroups((prev) => prev.map((g) => g.groupName === groupName ? { ...g, [key]: value } : g));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    clearIssueIndicators();

    try {
      const payload = entryType === "THEORY"
        ? { classSectionId, day: Number(day), slotStart: Number(slot), entryType: "THEORY", subjectId: Number(subjectId), teacherId: Number(teacherId), roomId: Number(roomId) }
        : { classSectionId, day: Number(day), slotStart: Number(slot), entryType: "LAB", labGroups: completeLabGroups.map((g) => ({ groupName: g.groupName, subjectId: Number(g.subjectId), labId: Number(g.labId), teacherId: Number(g.teacherId) })) };

      if (editableEntryId) {
        await updateEntry(editableEntryId, payload);
      } else {
        await createEntry(payload);
      }

      onSuccess(editableEntryId ? "ENTRY UPDATED" : "ENTRY CREATED");
      onClose();
    } catch (err) {
      if (err.status === 409) {
        setConflict(err.message);
        setIssueFields(mapIssueFields(409, entryType, err.message));
      } else if (err.status === 422) {
        setPrereq(err.message);
        setIssueFields(mapIssueFields(422, entryType, err.message));
      } else {
        setError(err.message);
        setIssueFields([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editableEntryId) return;
    setSubmitting(true);
    clearIssueIndicators();
    setError("");
    try {
      await deleteEntry(editableEntryId);
      onSuccess("ENTRY DELETED");
      onClose();
    } catch (err) {
      if (err.status === 409) {
        setConflict(err.message);
        setIssueFields(mapIssueFields(409, entryType, err.message));
      } else {
        setError(err.message);
        setIssueFields([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-2 border-foreground bg-card p-6 space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold tracking-wider uppercase flex items-center gap-2">
          {editableEntryId ? "EDIT ENTRY" : "CREATE ENTRY"}
        </h3>
        <button type="button" onClick={onClose} disabled={submitting} className="border-2 border-foreground px-3 py-1 text-[10px] font-mono tracking-wider font-bold hover:bg-accent transition-colors uppercase">
          CLOSE
        </button>
      </div>

      <div className="h-[2px] w-full bg-foreground" />

      <ConflictBanner message={conflict} type="conflict" />
      <ConflictBanner message={prereq} type="prerequisite" onGoToAssignments={() => router.push("/assignments")} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Entry Type */}
        <div>
          <label className={labelClass}>ENTRY TYPE</label>
          <div className="flex gap-2">
            <button type="button" disabled={submitting} onClick={() => setEntryType("THEORY")}
              className={`flex-1 border-2 border-foreground h-10 font-mono text-xs tracking-wider font-bold uppercase transition-colors ${entryType === "THEORY" ? "bg-foreground text-background" : "hover:bg-muted"}`}>
              THEORY
            </button>
            <button type="button" disabled={submitting} onClick={() => setEntryType("LAB")}
              className={`flex-1 border-2 border-foreground h-10 font-mono text-xs tracking-wider font-bold uppercase transition-colors ${entryType === "LAB" ? "bg-foreground text-background" : "hover:bg-muted"}`}>
              LAB
            </button>
          </div>
        </div>

        {/* Day & Slot */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>DAY</label>
            <select className={issueFields.includes("day") ? inputError : inputBase} value={day} onChange={(e) => { clearIssueIndicators(); setDay(Number(e.target.value)); }} disabled={submitting}>
              {DAY_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>SLOT</label>
            <select className={issueFields.includes("slot") ? inputError : inputBase} value={slot} onChange={(e) => { clearIssueIndicators(); setSlot(Number(e.target.value)); }} disabled={submitting}>
              {SLOT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Theory fields */}
        {entryType === "THEORY" && (
          <>
            <div>
              <label className={labelClass}>SUBJECT</label>
              <select className={issueFields.includes("subject") ? inputError : inputBase} value={subjectId} onChange={(e) => { clearIssueIndicators(); setSubjectId(e.target.value); }} disabled={submitting}>
                <option value="">SELECT SUBJECT</option>
                {subjectsForType.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>TEACHER</label>
              <select className={issueFields.includes("teacher") ? inputError : inputBase} value={teacherId} onChange={(e) => { clearIssueIndicators(); setTeacherId(e.target.value); }} disabled={submitting || !subjectId}>
                <option value="">SELECT TEACHER</option>
                {filteredTeachers.map((t) => <option key={t.id} value={t.id}>{t.abbreviation} - {t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>ROOM</label>
              <select className={issueFields.includes("room") ? inputError : inputBase} value={roomId} onChange={(e) => { clearIssueIndicators(); setRoomId(e.target.value); }} disabled={submitting}>
                <option value="">SELECT ROOM</option>
                {allRooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Lab groups */}
        {entryType === "LAB" && LAB_GROUPS.map((groupName) => {
          const group = labGroups.find((g) => g.groupName === groupName);
          const hasIssue = issueFields.includes("lab") || issueFields.includes("labTeacher") || issueFields.includes("labSubject");
          return (
            <div key={groupName} className={`border-2 p-4 space-y-3 ${hasIssue ? "border-destructive" : "border-foreground"}`}>
              <h4 className="font-heading text-xs font-bold tracking-wider uppercase">{groupName}</h4>
              <div>
                <label className={labelClass}>SUBJECT</label>
                <select className={issueFields.includes("labSubject") ? inputError : inputBase} value={group?.subjectId || ""} onChange={(e) => { clearIssueIndicators(); handleGroupChange(groupName, "subjectId", e.target.value); handleGroupChange(groupName, "teacherId", ""); }} disabled={submitting}>
                  <option value="">SELECT SUBJECT</option>
                  {labSubjects.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>LAB</label>
                <select className={issueFields.includes("lab") ? inputError : inputBase} value={group?.labId || ""} onChange={(e) => { clearIssueIndicators(); handleGroupChange(groupName, "labId", e.target.value); }} disabled={submitting}>
                  <option value="">SELECT LAB</option>
                  {allLabs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>TEACHER</label>
                <select className={issueFields.includes("labTeacher") ? inputError : inputBase} value={group?.teacherId || ""} onChange={(e) => { clearIssueIndicators(); handleGroupChange(groupName, "teacherId", e.target.value); }} disabled={submitting || !group?.subjectId}>
                  <option value="">SELECT TEACHER</option>
                  {getTeachersForSubject(group?.subjectId).map((t) => <option key={t.id} value={t.id}>{t.abbreviation} - {t.name}</option>)}
                </select>
              </div>
            </div>
          );
        })}

        {error && <div className="p-3 border-2 border-destructive bg-destructive/10 text-xs font-mono font-bold text-destructive uppercase">{error}</div>}
        {entryType === "LAB" && hasPartialLabGroup && (
          <div className="p-3 border-2 border-warning bg-warning/10 text-xs font-mono font-bold text-warning-foreground uppercase">
            FOR EACH SELECTED GROUP, CHOOSE SUBJECT, LAB, AND TEACHER.
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={submitting || !(canSubmitTheory || canSubmitLab)}
            className="flex-1 border-2 border-foreground bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-mono text-xs tracking-wider h-10 uppercase font-bold transition-colors disabled:opacity-40">
            {submitting ? <Spinner size="sm" /> : editableEntryId ? "UPDATE ENTRY" : "CREATE ENTRY"}
          </button>
          {editableEntryId && (
            <button type="button" onClick={handleDelete} disabled={submitting}
              className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-white font-mono text-xs tracking-wider h-10 px-6 uppercase font-bold transition-colors">
              DELETE
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
