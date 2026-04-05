import React, { useState, useEffect, useMemo } from "react";
import { timetableApi } from "@/lib/api";
import type { Subject, Teacher, Room, Lab, SlotData } from "@/lib/types";
import { DAY_SHORT, SLOT_TIMES } from "@/lib/types";
import { ConflictBanner } from "./ConflictBanner";

interface LabGroupInput {
  groupName: string;
  subjectId: string;
  labId: string;
  teacherId: string;
}

interface EntryFormProps {
  classSectionId: number;
  initialDay?: number;
  initialSlot?: number;
  existingEntry?: SlotData | null;
  classSubjects: Subject[];
  allTeachers: Teacher[];
  allRooms: Room[];
  allLabs: Lab[];
  teacherMap: Record<number, number[]>;
  onSuccess: (msg: string) => void;
  onClose: () => void;
}

export function EntryForm({
  classSectionId,
  initialDay = 1,
  initialSlot = 1,
  existingEntry,
  classSubjects,
  allTeachers,
  allRooms,
  allLabs,
  teacherMap,
  onSuccess,
  onClose,
}: EntryFormProps) {
  const [entryType, setEntryType] = useState<"THEORY" | "LAB">(existingEntry?.type === "LAB" ? "LAB" : "THEORY");
  const [day, setDay] = useState(String(initialDay));
  const [slot, setSlot] = useState(String(initialSlot));
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [labGroups, setLabGroups] = useState<LabGroupInput[]>([
    { groupName: "A1", subjectId: "", labId: "", teacherId: "" },
    { groupName: "A2", subjectId: "", labId: "", teacherId: "" },
    { groupName: "A3", subjectId: "", labId: "", teacherId: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [conflictMsg, setConflictMsg] = useState("");
  const [prereqMsg, setPrereqMsg] = useState("");
  const [issueFields, setIssueFields] = useState<string[]>([]);

  useEffect(() => {
    setEntryType(existingEntry?.type === "LAB" ? "LAB" : "THEORY");
    setDay(String(initialDay));
    setSlot(String(initialSlot));
    setConflictMsg("");
    setPrereqMsg("");
    setIssueFields([]);

    if (existingEntry?.type === "THEORY") {
      const matchedSub = classSubjects.find(s => s.code === existingEntry.subjectCode);
      const matchedTeacher = allTeachers.find(t => t.abbreviation === existingEntry.teacherAbbr);
      const matchedRoom = allRooms.find(r => r.name === existingEntry.roomName);
      
      setSubjectId(matchedSub ? String(matchedSub.id) : "");
      setTeacherId(matchedTeacher ? String(matchedTeacher.id) : "");
      setRoomId(matchedRoom ? String(matchedRoom.id) : "");
    } else if (existingEntry?.type === "LAB") {
      setLabGroups(["A1", "A2", "A3"].map((g) => {
        const info = existingEntry.groups[g];
        if (!info) return { groupName: g, subjectId: "", labId: "", teacherId: "" };
        const sSub = classSubjects.find(s => s.code === info.subjectCode);
        const sLab = allLabs.find(l => l.name === info.lab);
        const sTea = allTeachers.find(t => t.abbreviation === info.teacher);
        return {
          groupName: g,
          subjectId: sSub ? String(sSub.id) : "",
          labId: sLab ? String(sLab.id) : "",
          teacherId: sTea ? String(sTea.id) : ""
        };
      }));
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
  }, [existingEntry, initialDay, initialSlot, classSubjects, allTeachers, allRooms, allLabs]);

  const subjectsForType = useMemo(() => classSubjects.filter(s => s.type === entryType), [classSubjects, entryType]);
  
  const filteredTheoryTeachers = useMemo(() => {
    if (!subjectId) return [];
    return allTeachers.filter(t => (teacherMap[t.id] || []).includes(Number(subjectId)));
  }, [subjectId, allTeachers, teacherMap]);

  const getTeachersForSubject = (sId: string) => {
    if (!sId) return [];
    return allTeachers.filter(t => (teacherMap[t.id] || []).includes(Number(sId)));
  };

  function mapErrors(status: number, message: string) {
    if (status === 409) {
      if (message.includes("Class section already")) return ["day", "slot"];
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

  const handleSubmit = async () => {
    setLoading(true);
    setConflictMsg("");
    setPrereqMsg("");
    setIssueFields([]);

    try {
      if (entryType === "THEORY") {
        const payload = {
          classSectionId,
          day: parseInt(day),
          slotStart: parseInt(slot),
          entryType: "THEORY" as const,
          subjectId: parseInt(subjectId),
          teacherId: parseInt(teacherId),
          roomId: parseInt(roomId),
        };
        if (existingEntry) {
          await timetableApi.updateEntry(existingEntry.entryId, payload);
        } else {
          await timetableApi.createEntry(payload);
        }
      } else {
        const groups = labGroups.filter(g => g.subjectId && g.labId && g.teacherId);
        const payload = {
          classSectionId,
          day: parseInt(day),
          slotStart: parseInt(slot),
          entryType: "LAB" as const,
          subjectId: 0, // DUMMY - required by old API sometimes or we skip it if backend allows
          labGroups: groups.map(g => ({
            groupName: g.groupName,
            subjectId: parseInt(g.subjectId),
            labId: parseInt(g.labId),
            teacherId: parseInt(g.teacherId),
          })),
        };
        // Fix subjectId: The timetable array might take the first group's subject as the primary one
        if (payload.labGroups.length > 0) {
          payload.subjectId = payload.labGroups[0].subjectId;
        }

        if (existingEntry) {
          await timetableApi.updateEntry(existingEntry.entryId, payload);
        } else {
          await timetableApi.createEntry(payload);
        }
      }
      onSuccess(existingEntry ? "Entry updated" : "Entry added");
      onClose();
    } catch (e: any) {
      const msg = e.message || "Unknown error";
      const is409 = msg.includes("already") || msg.toLowerCase().includes("conflict");
      const is422 = msg.includes("assigned") || msg.includes("validation");
      
      if (is409) {
        setConflictMsg(msg);
        setIssueFields(mapErrors(409, msg));
      } else if (is422) {
        setPrereqMsg(msg);
        setIssueFields(mapErrors(422, msg));
      } else {
        setConflictMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const isTheoryValid = entryType === "THEORY" && subjectId && teacherId && roomId;
  const isLabValid = entryType === "LAB" && labGroups.some(g => g.subjectId && g.labId && g.teacherId) && 
    !labGroups.some(g => (g.subjectId || g.labId || g.teacherId) && !(g.subjectId && g.labId && g.teacherId));

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/10 overflow-hidden">
      <div className="bg-primary-container p-5 text-white flex justify-between items-center">
        <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">edit_calendar</span>
          {existingEntry ? "Edit Entry" : "Create Entry"}
        </h3>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors text-white">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
      
      <div className="p-6 space-y-6">
        <ConflictBanner message={conflictMsg} type="conflict" />
        <ConflictBanner message={prereqMsg} type="prerequisite" />

        <div className="flex p-1 bg-surface-container-low rounded-lg">
          <button
            onClick={() => { setEntryType("THEORY"); setIssueFields([]); }}
            className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-md transition-all ${
              entryType === "THEORY" ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >THEORY</button>
          <button
            onClick={() => { setEntryType("LAB"); setIssueFields([]); }}
            className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-md transition-all ${
              entryType === "LAB" ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >LAB</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-outline tracking-wider">Day</label>
            <select 
              value={day} onChange={e => { setDay(e.target.value); setIssueFields([]); }} 
              className={`w-full bg-surface-container border-2 ${issueFields.includes("day") ? "border-destructive bg-destructive/10" : "border-transparent"} rounded-lg text-sm font-semibold p-2 outline-none focus:border-secondary`}
            >
              {[1,2,3,4,5,6].map(d => <option key={d} value={d}>{DAY_SHORT[d]}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-outline tracking-wider">Slot</label>
            <select 
              value={slot} onChange={e => { setSlot(e.target.value); setIssueFields([]); }} 
              className={`w-full bg-surface-container border-2 ${issueFields.includes("slot") ? "border-destructive bg-destructive/10" : "border-transparent"} rounded-lg text-sm font-semibold p-2 outline-none focus:border-secondary`}
            >
              {(entryType === "LAB" ? [5] : [1,2,3,4,5,6]).map(s => <option key={s} value={s}>Slot {SLOT_TIMES[s].label}</option>)}
            </select>
          </div>
        </div>

        {entryType === "THEORY" ? (
          <>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-outline tracking-wider">Subject</label>
              <select 
                value={subjectId} onChange={e => { setSubjectId(e.target.value); setTeacherId(""); setIssueFields([]); }} 
                className={`w-full bg-surface-container border-2 ${issueFields.includes("subject") ? "border-destructive bg-destructive/10" : "border-transparent"} rounded-lg text-sm font-semibold p-2 outline-none focus:border-secondary`}
              >
                <option value="">Select subject...</option>
                {subjectsForType.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-outline tracking-wider">Teacher</label>
              <select 
                disabled={!subjectId}
                value={teacherId} onChange={e => { setTeacherId(e.target.value); setIssueFields([]); }} 
                className={`w-full bg-surface-container border-2 ${issueFields.includes("teacher") ? "border-destructive bg-destructive/10" : "border-transparent"} rounded-lg text-sm font-semibold p-2 outline-none focus:border-secondary disabled:opacity-50`}
              >
                <option value="">Select teacher...</option>
                {filteredTheoryTeachers.map(t => <option key={t.id} value={t.id}>{t.abbreviation} - {t.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-outline tracking-wider">Room</label>
              <select 
                value={roomId} onChange={e => { setRoomId(e.target.value); setIssueFields([]); }} 
                className={`w-full bg-surface-container border-2 ${issueFields.includes("room") ? "border-destructive bg-destructive/10" : "border-transparent"} rounded-lg text-sm font-semibold p-2 outline-none focus:border-secondary`}
              >
                <option value="">Select room...</option>
                {allRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-on-surface tracking-wider">Lab Groups (A1-A3)</label>
            {labGroups.map((g, i) => (
              <div key={g.groupName} className={`p-3 border-2 rounded-lg space-y-2 bg-surface-container-low/50 ${issueFields.includes("labSubject") || issueFields.includes("labTeacher") || issueFields.includes("lab") ? "border-destructive/30" : "border-outline-variant/30"}`}>
                <span className="text-[10px] font-black text-indigo-700">{g.groupName}</span>
                
                <select 
                  value={g.subjectId} 
                  onChange={e => { const n = [...labGroups]; n[i].subjectId = e.target.value; n[i].teacherId = ""; setLabGroups(n); setIssueFields([]); }} 
                  className={`w-full text-[11px] font-bold bg-white border-2 ${issueFields.includes("labSubject") ? "border-destructive" : "border-transparent"} rounded py-1.5 outline-none`}
                >
                  <option value="">Subject...</option>
                  {subjectsForType.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                </select>
                
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    value={g.teacherId} 
                    disabled={!g.subjectId}
                    onChange={e => { const n = [...labGroups]; n[i].teacherId = e.target.value; setLabGroups(n); setIssueFields([]); }} 
                    className={`w-full text-[11px] font-bold bg-white border-2 ${issueFields.includes("labTeacher") ? "border-destructive" : "border-transparent"} rounded py-1.5 outline-none disabled:opacity-50`}
                  >
                    <option value="">Teacher...</option>
                    {getTeachersForSubject(g.subjectId).map(t => <option key={t.id} value={t.id}>{t.abbreviation} - {t.name}</option>)}
                  </select>
                  
                  <select 
                    value={g.labId} 
                    onChange={e => { const n = [...labGroups]; n[i].labId = e.target.value; setLabGroups(n); setIssueFields([]); }} 
                    className={`w-full text-[11px] font-bold bg-white border-2 ${issueFields.includes("lab") ? "border-destructive" : "border-transparent"} rounded py-1.5 outline-none`}
                  >
                    <option value="">Lab...</option>
                    {allLabs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {entryType === "LAB" && labGroups.some(g => (g.subjectId || g.labId || g.teacherId) && !(g.subjectId && g.labId && g.teacherId)) && (
          <div className="text-[10px] font-bold text-destructive bg-destructive/10 p-2 rounded">
            For each active group, you must select Subject, Teacher, AND Lab.
          </div>
        )}

        <div className="pt-2 flex flex-col gap-3">
          <button 
            disabled={loading || !(isTheoryValid || isLabValid)}
            onClick={handleSubmit} 
            className="w-full py-3 bg-gradient-to-br from-secondary to-secondary-container text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-md hover:translate-y-[-1px] transition-transform disabled:opacity-50 disabled:transform-none disabled:shadow-none"
          >
            {loading ? "Saving..." : existingEntry ? "Update Entry" : "Save Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
