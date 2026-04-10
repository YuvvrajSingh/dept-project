"use client";

import { useEffect, useState } from "react";
import { teacherApi, subjectApi, roomApi, labApi, classApi } from "@/lib/api";
import { useAcademicYear } from "@/contexts/academic-year-context";
import type { Teacher, Subject, Room, Lab, ClassSection } from "@/lib/types";

type Tab = "teachers" | "subjects" | "rooms" | "labs" | "classes";

export default function MasterDataPage() {
  const { selectedYear, isArchived, loading: yearLoading } = useAcademicYear();
  const [tab, setTab] = useState<Tab>("teachers");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Drawer state ──
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (yearLoading || !selectedYear) return;
    loadAll();
  }, [selectedYear, yearLoading]);

  async function loadAll() {
    setLoading(true);
    try {
      const [t, s, r, l, c] = await Promise.all([
        teacherApi.list().catch(() => []),
        subjectApi.list().catch(() => []),
        roomApi.list().catch(() => []),
        labApi.list().catch(() => []),
        classApi.list(selectedYear?.id).catch(() => []),
      ]);
      setTeachers(t);
      setSubjects(s);
      setRooms(r);
      setLabs(l);
      setClasses(c);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      if (tab === "teachers") {
        const payload = { 
          name: formData.name || "", 
          abbreviation: formData.abbreviation || "",
          email: formData.email || ""
        };
        if (editingId) await teacherApi.update(editingId, payload);
        else await teacherApi.create(payload);
      } else if (tab === "subjects") {
        const payload = {
          code: formData.code || "",
          name: formData.name || "",
          abbreviation: formData.abbreviation || "",
          type: (formData.type as "THEORY" | "LAB") || "THEORY",
          creditHours: parseInt(formData.creditHours || "4"),
        };
        if (editingId) await subjectApi.update(editingId, payload);
        else await subjectApi.create(payload as any);
      } else if (tab === "rooms") {
        const payload = { name: formData.name || "", capacity: parseInt(formData.capacity || "60") };
        if (editingId) await roomApi.update(editingId, payload);
        else await roomApi.create(payload);
      } else if (tab === "labs") {
        const payload = { name: formData.name || "", capacity: parseInt(formData.capacity || "20") };
        if (editingId) await labApi.update(editingId, payload);
        else await labApi.create(payload);
      } else if (tab === "classes") {
        const sem = parseInt(formData.semester || "1");
        const calculatedYear = Math.ceil(sem / 2);
        const payload = { branchName: formData.branchName?.toUpperCase() || "CSE", year: calculatedYear, semester: sem, academicYearId: selectedYear!.id };
        if (editingId) await classApi.update(editingId, payload);
        else await classApi.create(payload);
      }
      setDrawerOpen(false);
      setFormData({});
      setEditingId(null);
      loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error saving record");
    }
  }

  function handleEditClick(type: Tab, item: any) {
    setEditingId(item.id);
    if (type === "teachers") {
      setFormData({ name: item.name, abbreviation: item.abbreviation, email: item.email || "" });
    } else if (type === "subjects") {
      setFormData({ code: item.code, name: item.name, abbreviation: item.abbreviation, type: item.type, creditHours: String(item.creditHours) });
    } else if (type === "rooms" || type === "labs") {
      setFormData({ name: item.name, capacity: String(item.capacity) });
    } else if (type === "classes") {
      setFormData({ branchName: item.branch?.name || "CSE", semester: String(item.semester || 1) });
    }
    setDrawerOpen(true);
  }

  async function handleDelete(type: Tab, id: number) {
    if (!confirm("Delete this record?")) return;
    try {
      if (type === "teachers") await teacherApi.delete(id);
      else if (type === "subjects") await subjectApi.delete(id);
      else if (type === "rooms") await roomApi.delete(id);
      else if (type === "labs") await labApi.delete(id);
      else if (type === "classes") await classApi.delete(id);
      loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error deleting record");
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "teachers", label: "Teachers" },
    { key: "subjects", label: "Subjects" },
    { key: "rooms", label: "Rooms" },
    { key: "labs", label: "Labs" },
    { key: "classes", label: "Classes" },
  ];

  const tabLabels: Record<Tab, string> = {
    teachers: "Faculty Registry",
    subjects: "Curriculum Entities",
    rooms: "Physical Rooms",
    labs: "Lab Facilities",
    classes: "Class Cohorts",
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tighter text-on-surface italic">The Ledger</h2>
          <p className="text-on-surface-variant text-sm font-medium">
            Manage core academic entities and resource mappings.
          </p>
        </div>
        <div className="flex p-1 bg-surface-container-high rounded-lg">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                tab === t.key
                  ? "bg-surface-container-lowest text-secondary shadow-sm rounded-md"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <div className="flex items-center gap-4">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">
              {tabLabels[tab]}
            </span>
            <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded">
              {tab === "teachers" ? teachers.length : tab === "subjects" ? subjects.length : tab === "rooms" ? rooms.length : tab === "labs" ? labs.length : classes.length} RECORDS
            </span>
          </div>
          <button
            onClick={() => { setDrawerOpen(true); setFormData({}); setEditingId(null); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-secondary to-secondary-container text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add {tab.slice(0, -1)}
          </button>
        </div>

        {/* Table content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest/50">
                {tab === "teachers" && (
                  <>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Code</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Full Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Email</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                  </>
                )}
                {tab === "subjects" && (
                  <>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Code</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Abbr</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Credits</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                  </>
                )}
                {tab === "rooms" && (
                  <>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Capacity</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                  </>
                )}
                {tab === "labs" && (
                  <>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Capacity</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                  </>
                )}
                {tab === "classes" && (
                  <>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Branch</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Year</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Semester</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-on-surface-variant">Loading...</td></tr>
              ) : (
                <>
                  {tab === "teachers" && teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-5"><span className="font-mono text-sm font-bold text-secondary">{t.abbreviation}</span></td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary-fixed flex items-center justify-center text-on-primary-fixed text-xs font-bold">
                            {t.abbreviation.slice(0, 2)}
                          </div>
                          <span className="font-bold text-on-surface text-sm">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5"><span className="text-sm text-on-surface-variant">{t.email || "-"}</span></td>
                      <td className="px-6 py-5 text-right flex justify-end">
                        <button onClick={() => handleEditClick("teachers", t)} className="p-2 text-on-surface-variant hover:text-secondary transition-colors">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onClick={() => handleDelete("teachers", t.id)} className="p-2 text-on-surface-variant hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-lg">delete_sweep</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tab === "subjects" && subjects.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-5"><span className="font-mono text-sm font-bold text-secondary">{s.code}</span></td>
                      <td className="px-6 py-5 font-bold text-on-surface text-sm">{s.name}</td>
                      <td className="px-6 py-5 font-bold text-on-surface-variant text-sm">{s.abbreviation || "-"}</td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-tighter ${
                          s.type === "THEORY" ? "bg-primary-fixed text-on-primary-fixed-variant" : "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                        }`}>{s.type}</span>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{s.creditHours}</td>
                      <td className="px-6 py-5 text-right flex justify-end">
                        <button onClick={() => handleEditClick("subjects", s)} className="p-2 text-on-surface-variant hover:text-secondary transition-colors">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onClick={() => handleDelete("subjects", s.id)} className="p-2 text-on-surface-variant hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-lg">delete_sweep</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tab === "rooms" && rooms.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-5 font-bold text-on-surface text-sm">{r.name}</td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{r.capacity}</td>
                      <td className="px-6 py-5 text-right flex justify-end">
                        <button onClick={() => handleEditClick("rooms", r)} className="p-2 text-on-surface-variant hover:text-secondary transition-colors">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onClick={() => handleDelete("rooms", r.id)} className="p-2 text-on-surface-variant hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-lg">delete_sweep</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tab === "labs" && labs.map((l) => (
                    <tr key={l.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-5 font-bold text-on-surface text-sm">{l.name}</td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{l.capacity}</td>
                      <td className="px-6 py-5 text-right flex justify-end">
                        <button onClick={() => handleEditClick("labs", l)} className="p-2 text-on-surface-variant hover:text-secondary transition-colors">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onClick={() => handleDelete("labs", l.id)} className="p-2 text-on-surface-variant hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-lg">delete_sweep</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tab === "classes" && classes.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-5">
                        <span className="text-[9px] font-black text-secondary tracking-widest uppercase">{c.branch?.name}</span>
                      </td>
                      <td className="px-6 py-5 font-bold text-on-surface text-sm">Year {c.year}</td>
                      <td className="px-6 py-5 font-bold text-on-surface text-sm">Sem {c.semester}</td>
                      <td className="px-6 py-5 text-right flex justify-end">
                        <button onClick={() => handleEditClick("classes", c)} className="p-2 text-on-surface-variant hover:text-secondary transition-colors">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onClick={() => handleDelete("classes", c.id)} className="p-2 text-on-surface-variant hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-lg">delete_sweep</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-surface-container-lowest shadow-2xl p-10 flex flex-col">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-2xl font-black tracking-tighter uppercase italic">{editingId ? "Edit Entity" : "Entity Entry"}</h3>
              <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-8 flex-grow">
              {tab === "teachers" && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Full Name</label>
                    <input
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-secondary transition-all px-0 pb-2 text-lg font-bold outline-none"
                      placeholder="e.g. Dr. Jane Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Faculty Code</label>
                    <input
                      value={formData.abbreviation || ""}
                      onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-secondary transition-all px-0 pb-2 text-lg font-bold outline-none"
                      placeholder="e.g. JSM"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Email Address</label>
                    <input
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      type="email"
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-secondary transition-all px-0 pb-2 text-lg font-bold outline-none"
                      placeholder="e.g. jane@example.com"
                    />
                  </div>
                </>
              )}
              {tab === "subjects" && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Subject Code</label>
                    <input value={formData.code || ""} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-secondary transition-all px-0 pb-2 text-lg font-bold outline-none" placeholder="e.g. 7ADS41A" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Subject Name</label>
                    <input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-secondary transition-all px-0 pb-2 text-lg font-bold outline-none" placeholder="e.g. Advanced Data Structures" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Abbreviation</label>
                    <input value={formData.abbreviation || ""} onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })} className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-secondary transition-all px-0 pb-2 text-lg font-bold outline-none" placeholder="e.g. ADS" />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Type</label>
                      <select value={formData.type || "THEORY"} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-secondary transition-all px-0 pb-2 font-bold outline-none">
                        <option value="THEORY">Theory</option>
                        <option value="LAB">Lab</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Credits</label>
                      <input value={formData.creditHours || ""} onChange={(e) => setFormData({ ...formData, creditHours: e.target.value })} className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-secondary transition-all px-0 pb-2 font-bold outline-none" placeholder="4" type="number" />
                    </div>
                  </div>
                </>
              )}
              {(tab === "rooms" || tab === "labs") && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Name</label>
                    <input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-secondary transition-all px-0 pb-2 text-lg font-bold outline-none" placeholder={tab === "rooms" ? "e.g. CSE-9" : "e.g. LAB-4"} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Capacity</label>
                    <input value={formData.capacity || ""} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-secondary transition-all px-0 pb-2 font-bold outline-none" placeholder={tab === "rooms" ? "60" : "20"} type="number" />
                  </div>
                </>
              )}
              {tab === "classes" && (
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Branch Name</label>
                    <input value={formData.branchName || ""} onChange={(e) => setFormData({ ...formData, branchName: e.target.value.toUpperCase() })} className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-secondary transition-all px-0 pb-2 font-bold outline-none" placeholder="e.g. CSE" type="text" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Semester</label>
                    <input value={formData.semester || ""} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-secondary transition-all px-0 pb-2 font-bold outline-none" placeholder="3" type="number" min="1" max="8" />
                  </div>
                </div>
              )}
            </div>
            <div className="pt-8">
              <button onClick={handleSave} className="w-full py-4 bg-secondary text-white font-black uppercase tracking-widest text-xs rounded-lg shadow-xl shadow-secondary/20 hover:bg-secondary-container transition-all">
                {editingId ? "Save Changes" : "Confirm Entry"}
              </button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">Secure Academic Entry // CSE V2</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
