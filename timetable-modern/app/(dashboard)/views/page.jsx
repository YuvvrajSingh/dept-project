"use client";

import { useEffect, useMemo, useState } from "react";
import { getClasses } from "@/lib/api/classes";
import { getRooms } from "@/lib/api/rooms";
import { getTeachers } from "@/lib/api/teachers";
import { getClassTimetable, getRoomTimetable, getTeacherTimetable } from "@/lib/api/timetable";
import { useToast } from "@/lib/toast-context";
import { buildRoomMatrix, buildTeacherMatrix, createEmptyMatrix } from "@/lib/utils/matrix";
import { YEAR_OPTIONS, getYearLabel } from "@/lib/utils/format";
import PageShell from "@/components/page-shell";
import Spinner from "@/components/spinner";
import TimetableGrid from "@/components/timetable-grid";

const tabs = ["Class Matrix", "Teacher Schedule", "Room Occupancy"];
const BRANCHES = ["CSE", "IT", "AI"];
const inputBase = "w-full border-2 border-foreground bg-background font-mono text-sm h-10 px-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none";
const labelClass = "text-[10px] font-mono tracking-[0.2em] uppercase font-bold block mb-2";

export default function TimetableViewsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState("Class Matrix");
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState(2);
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [matrix, setMatrix] = useState(createEmptyMatrix());

  useEffect(() => {
    async function setup() {
      setLoadingSetup(true);
      try {
        const [c, t, r] = await Promise.all([getClasses(), getTeachers(), getRooms()]);
        setClasses(c); setTeachers(t); setRooms(r);
      } catch (err) { showToast(err.message, "error"); }
      finally { setLoadingSetup(false); }
    }
    setup();
  }, [showToast]);

  const filteredClasses = useMemo(
    () => classes.filter((c) => c.branch?.name === branch && c.year === Number(year)),
    [classes, branch, year]
  );

  const handleLoad = async () => {
    setLoadingGrid(true);
    try {
      if (tab === "Class Matrix" && classId) {
        const data = await getClassTimetable(classId);
        setMatrix(data.timetable);
      }
      if (tab === "Teacher Schedule" && teacherId) {
        const data = await getTeacherTimetable(teacherId);
        setMatrix(buildTeacherMatrix(data));
      }
      if (tab === "Room Occupancy" && roomId) {
        const data = await getRoomTimetable(roomId);
        setMatrix(buildRoomMatrix(data));
      }
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoadingGrid(false); }
  };

  if (loadingSetup) return <Spinner />;

  return (
    <PageShell title="TIMETABLE VIEWS" subtitle="SYS.AUTH // MODULE_06 — MATRIX VIEWER">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)}
            className={`border-2 border-foreground px-4 py-2 text-[10px] font-mono tracking-wider font-bold uppercase transition-colors ${
              tab === item ? "bg-foreground text-background" : "hover:bg-muted"
            }`}>
            {item}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="border-2 border-foreground bg-card p-4 mb-4">
        {tab === "Class Matrix" && (
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
              <select className={inputBase} value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">SELECT CLASS</option>
                {filteredClasses.map((c) => <option key={c.id} value={c.id}>{c.branch.name} - {getYearLabel(c.year)}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === "Teacher Schedule" && (
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[240px]">
              <label className={labelClass}>TEACHER</label>
              <select className={inputBase} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">SELECT TEACHER</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.abbreviation} - {t.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === "Room Occupancy" && (
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[240px]">
              <label className={labelClass}>ROOM</label>
              <select className={inputBase} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                <option value="">SELECT ROOM</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
        )}

        <button type="button" onClick={handleLoad}
          className="mt-4 border-2 border-foreground bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-mono text-xs tracking-wider px-6 h-10 uppercase font-bold transition-colors">
          LOAD
        </button>
      </div>

      {/* Grid */}
      <TimetableGrid matrix={matrix} readOnly loading={loadingGrid} onCellClick={() => {}} />
    </PageShell>
  );
}
