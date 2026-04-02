"use client";

import { useEffect, useMemo, useState } from "react";
import { getClasses, getClassSubjects } from "@/lib/api/classes";
import { getLabs } from "@/lib/api/labs";
import { getRooms } from "@/lib/api/rooms";
import { getTeachers } from "@/lib/api/teachers";
import { deleteEntry, getClassTimetable } from "@/lib/api/timetable";
import { useToast } from "@/lib/toast-context";
import { YEAR_OPTIONS, getYearLabel } from "@/lib/utils/format";
import PageShell from "@/components/page-shell";
import EntryForm from "@/components/entry-form";
import Spinner from "@/components/spinner";
import TimetableGrid from "@/components/timetable-grid";

const BRANCHES = ["CSE", "IT", "AI"];
const inputBase = "w-full border-2 border-foreground bg-background font-mono text-sm h-10 px-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none";
const labelClass = "text-[10px] font-mono tracking-[0.2em] uppercase font-bold block mb-2";

export default function TimetableBuilderPage() {
  const { showToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [labs, setLabs] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState(2);
  const [classSectionId, setClassSectionId] = useState("");
  const [matrix, setMatrix] = useState(null);
  const [classSubjects, setClassSubjects] = useState([]);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [previewDeleting, setPreviewDeleting] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState({ day: null, slot: null, cellData: null });

  useEffect(() => {
    async function setup() {
      setLoadingSetup(true);
      try {
        const [c, r, l, t] = await Promise.all([getClasses(), getRooms(), getLabs(), getTeachers()]);
        setClasses(c); setRooms(r); setLabs(l); setTeachers(t);
      } catch (err) { showToast(err.message, "error"); }
      finally { setLoadingSetup(false); }
    }
    setup();
  }, [showToast]);

  const filteredClasses = useMemo(
    () => classes.filter((c) => c.branch?.name === branch && c.year === Number(year)),
    [classes, branch, year]
  );

  const loadTimetable = async (id) => {
    setLoadingGrid(true);
    try {
      const [timetable, subjects] = await Promise.all([getClassTimetable(id), getClassSubjects(id)]);
      setMatrix(timetable.timetable);
      setClassSubjects(subjects);
      setPreviewOpen(false);
      setEntryOpen(false);
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoadingGrid(false); }
  };

  if (loadingSetup) return <Spinner />;

  const selectedLabGroups = selectedCell.cellData?.type === "LAB"
    ? Object.entries(selectedCell.cellData.groups || {}).sort(([a], [b]) => a.localeCompare(b)) : [];
  const labGroupLabels = selectedLabGroups.map(([gn]) => gn);
  const formatLabByGroup = (pick) => selectedLabGroups.map(([gn, g]) => `${gn}:${pick(g)}`).join(" | ");

  return (
    <PageShell title="TIMETABLE BUILDER" subtitle="SYS.AUTH // MODULE_05 — SCHEDULING ENGINE">
      {/* Filters */}
      <div className="border-2 border-foreground bg-card p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="min-w-[140px]">
            <label className={labelClass}>BRANCH</label>
            <select className={inputBase} value={branch} onChange={(e) => setBranch(e.target.value)}>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className={labelClass}>YEAR</label>
            <select className={inputBase} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{getYearLabel(y)}</option>)}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className={labelClass}>CLASS</label>
            <select className={inputBase} value={classSectionId} onChange={(e) => setClassSectionId(e.target.value)}>
              <option value="">SELECT CLASS</option>
              {filteredClasses.map((c) => <option key={c.id} value={c.id}>{c.branch.name} - {getYearLabel(c.year)}</option>)}
            </select>
          </div>
          <button type="button" disabled={!classSectionId} onClick={() => loadTimetable(Number(classSectionId))}
            className="border-2 border-foreground bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-mono text-xs tracking-wider px-6 h-10 uppercase font-bold transition-colors disabled:opacity-40">
            LOAD
          </button>
        </div>
      </div>

      {/* Grid */}
      <TimetableGrid
        matrix={matrix}
        loading={loadingGrid}
        readOnly={!classSectionId}
        onCellClick={(day, slot, cellData) => {
          setSelectedCell({ day: Number(day), slot: Number(slot), cellData });
          if (cellData) { setPreviewOpen(true); setEntryOpen(false); return; }
          setPreviewOpen(false); setEntryOpen(true);
        }}
      />

      {/* Preview Panel */}
      {previewOpen && selectedCell.cellData && (
        <div className="border-2 border-foreground bg-card p-6 mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold tracking-wider uppercase">ENTRY PREVIEW</h3>
            <button type="button" onClick={() => setPreviewOpen(false)}
              className="border-2 border-foreground px-3 py-1 text-[10px] font-mono tracking-wider font-bold hover:bg-accent transition-colors uppercase">
              CLOSE
            </button>
          </div>
          <div className="h-[2px] w-full bg-foreground" />
          <div className="grid grid-cols-[140px_1fr] gap-2 text-xs font-mono">
            <span className="text-muted-foreground tracking-[0.2em] uppercase font-bold text-[10px]">DAY</span>
            <span>{selectedCell.day}</span>
            <span className="text-muted-foreground tracking-[0.2em] uppercase font-bold text-[10px]">SLOT</span>
            <span>{selectedCell.slot}</span>
            <span className="text-muted-foreground tracking-[0.2em] uppercase font-bold text-[10px]">TYPE</span>
            <span>{selectedCell.cellData.type}</span>
            {selectedCell.cellData.type === "LAB" && (
              <>
                <span className="text-muted-foreground tracking-[0.2em] uppercase font-bold text-[10px]">SECTIONS</span>
                <span>{labGroupLabels.join(", ")}</span>
              </>
            )}
            <span className="text-muted-foreground tracking-[0.2em] uppercase font-bold text-[10px]">SUBJECT</span>
            <span>{selectedCell.cellData.type === "THEORY" ? selectedCell.cellData.subjectCode : formatLabByGroup((g) => g.subjectCode)}</span>
            <span className="text-muted-foreground tracking-[0.2em] uppercase font-bold text-[10px]">TEACHER</span>
            <span>{selectedCell.cellData.type === "THEORY" ? (selectedCell.cellData.teacherAbbr || "-") : formatLabByGroup((g) => g.teacher)}</span>
            <span className="text-muted-foreground tracking-[0.2em] uppercase font-bold text-[10px]">ROOM/LAB</span>
            <span>{selectedCell.cellData.type === "THEORY" ? (selectedCell.cellData.roomName || "-") : formatLabByGroup((g) => g.lab)}</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setPreviewOpen(false); setEntryOpen(true); }}
              className="border-2 border-foreground bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-mono text-xs tracking-wider px-4 h-10 uppercase font-bold transition-colors">
              EDIT ENTRY
            </button>
            <button type="button" disabled={previewDeleting}
              onClick={async () => {
                if (!selectedCell.cellData?.entryId) { showToast("ENTRY ID MISSING", "error"); return; }
                try {
                  setPreviewDeleting(true);
                  await deleteEntry(selectedCell.cellData.entryId);
                  showToast("ENTRY DELETED", "success");
                  setPreviewOpen(false);
                  await loadTimetable(Number(classSectionId));
                } catch (err) { showToast(err.message, "error"); }
                finally { setPreviewDeleting(false); }
              }}
              className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-white font-mono text-xs tracking-wider px-4 h-10 uppercase font-bold transition-colors">
              DELETE ENTRY
            </button>
          </div>
        </div>
      )}

      {/* Entry Form */}
      {entryOpen && classSectionId && (
        <EntryForm
          classSectionId={Number(classSectionId)}
          initialDay={selectedCell.day}
          initialSlot={selectedCell.slot}
          existingEntry={selectedCell.cellData}
          classSubjects={classSubjects}
          allRooms={rooms}
          allLabs={labs}
          allTeachers={teachers}
          onSuccess={async (message) => {
            showToast(message, "success");
            await loadTimetable(Number(classSectionId));
          }}
          onClose={() => setEntryOpen(false)}
        />
      )}
    </PageShell>
  );
}
