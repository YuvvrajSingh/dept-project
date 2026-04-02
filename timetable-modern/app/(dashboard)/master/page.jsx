"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTeacher, deleteTeacher, getTeachers, updateTeacher,
} from "@/lib/api/teachers";
import {
  createSubject, deleteSubject, getSubjects, updateSubject,
} from "@/lib/api/subjects";
import { createRoom, deleteRoom, getRooms, updateRoom } from "@/lib/api/rooms";
import { createLab, deleteLab, getLabs, updateLab } from "@/lib/api/labs";
import {
  createClass, deleteClass, getClasses, updateClass,
} from "@/lib/api/classes";
import { useToast } from "@/lib/toast-context";
import { BRANCH_OPTIONS, YEAR_OPTIONS, getYearLabel } from "@/lib/utils/format";
import PageShell from "@/components/page-shell";
import DataTable from "@/components/data-table";
import EntityDrawer from "@/components/entity-drawer";
import Spinner from "@/components/spinner";

const tabs = ["Teachers", "Subjects", "Rooms", "Labs", "Classes"];

export default function MasterDataPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState("Teachers");
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState({
    Teachers: [], Subjects: [], Rooms: [], Labs: [], Classes: [],
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [teachers, subjects, rooms, labs, classes] = await Promise.all([
        getTeachers(), getSubjects(), getRooms(), getLabs(), getClasses(),
      ]);
      setEntities({ Teachers: teachers, Subjects: subjects, Rooms: rooms, Labs: labs, Classes: classes });
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const config = useMemo(() => ({
    Teachers: {
      columns: [
        { key: "name", label: "Name" },
        { key: "abbreviation", label: "Short Name" },
      ],
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "abbreviation", label: "Short Name", type: "text", required: true, maxLength: 6 },
      ],
      create: createTeacher, update: updateTeacher, remove: deleteTeacher,
    },
    Subjects: {
      columns: [
        { key: "name", label: "Name" },
        { key: "code", label: "Code" },
        {
          key: "type", label: "Type",
          render: (value) => (
            <span className={`status-tag ${value === "LAB" ? "text-chart-2" : "text-chart-3"}`}>
              {value}
            </span>
          ),
        },
        { key: "creditHours", label: "Credit Hours" },
      ],
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "code", label: "Code", type: "text", required: true },
        { key: "type", label: "Type", type: "select", required: true, options: [{ value: "THEORY", label: "THEORY" }, { value: "LAB", label: "LAB" }] },
        { key: "creditHours", label: "Credit Hours", type: "number", required: true },
      ],
      create: createSubject, update: updateSubject, remove: deleteSubject,
    },
    Rooms: {
      columns: [{ key: "name", label: "Name" }, { key: "capacity", label: "Capacity" }],
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "capacity", label: "Capacity", type: "number" },
      ],
      create: createRoom, update: updateRoom, remove: deleteRoom,
    },
    Labs: {
      columns: [{ key: "name", label: "Name" }, { key: "capacity", label: "Capacity" }],
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "capacity", label: "Capacity", type: "number" },
      ],
      create: createLab, update: updateLab, remove: deleteLab,
    },
    Classes: {
      columns: [
        { key: "branch", label: "Branch", render: (_, row) => row.branch.name },
        { key: "year", label: "Year", render: (value) => getYearLabel(value) },
      ],
      fields: [
        { key: "branchId", label: "Branch", type: "select", required: true, numeric: true, options: BRANCH_OPTIONS.map((b) => ({ value: b.id, label: b.name })) },
        { key: "year", label: "Year", type: "select", required: true, numeric: true, options: YEAR_OPTIONS.map((y) => ({ value: y, label: getYearLabel(y) })) },
      ],
      create: createClass, update: updateClass, remove: deleteClass,
    },
  }), []);

  const current = config[tab];

  const handleSubmit = async (formData) => {
    const payload = Object.fromEntries(
      Object.entries(formData).filter(([, v]) => v !== "" && v !== undefined && v !== null)
    );
    if (editingRow) {
      await current.update(editingRow.id, payload);
      showToast(`${tab.slice(0, -1)} UPDATED`, "success");
    } else {
      await current.create(payload);
      showToast(`${tab.slice(0, -1)} CREATED`, "success");
    }
    await loadAll();
    setDrawerOpen(false);
    setEditingRow(null);
  };

  const handleDelete = async (row) => {
    try {
      await current.remove(row.id);
      showToast(`${tab.slice(0, -1)} DELETED`, "success");
      await loadAll();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (loading) return <Spinner />;

  return (
    <PageShell
      title="MASTER DATA"
      subtitle="SYS.AUTH // MODULE_02 — DATA MANAGEMENT"
      actions={
        <button
          type="button"
          onClick={() => { setEditingRow(null); setDrawerOpen(true); }}
          className="border-2 border-foreground bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-mono text-xs tracking-wider px-4 h-10 uppercase font-bold transition-colors"
        >
          + ADD NEW
        </button>
      }
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`border-2 border-foreground px-4 py-2 text-[10px] font-mono tracking-wider font-bold uppercase transition-colors ${
              tab === item
                ? "bg-foreground text-background"
                : "hover:bg-muted"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={current.columns}
        rows={entities[tab]}
        onEdit={(row) => { setEditingRow(row); setDrawerOpen(true); }}
        onDelete={handleDelete}
        loading={false}
      />

      <EntityDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingRow(null); }}
        title={`${editingRow ? "EDIT" : "ADD"} ${tab.slice(0, -1)}`}
        onSubmit={handleSubmit}
        initialValues={editingRow || {}}
        fields={current.fields}
      />
    </PageShell>
  );
}
