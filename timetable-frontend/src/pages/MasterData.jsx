import { useCallback, useEffect, useMemo, useState } from "react";
import { createTeacher, deleteTeacher, getTeachers, updateTeacher } from "../api/teachers";
import { createSubject, deleteSubject, getSubjects, updateSubject } from "../api/subjects";
import { createRoom, deleteRoom, getRooms, updateRoom } from "../api/rooms";
import { createLab, deleteLab, getLabs, updateLab } from "../api/labs";
import { createClass, deleteClass, getClasses, updateClass } from "../api/classes";
import DataTable from "../components/DataTable";
import EntityDrawer from "../components/EntityDrawer";
import Spinner from "../components/Spinner";
import { BRANCH_OPTIONS, YEAR_OPTIONS, getYearLabel } from "../utils/format";

const tabs = ["Teachers", "Subjects", "Rooms", "Labs", "Classes"];

export default function MasterData({ showToast }) {
  const [tab, setTab] = useState("Teachers");
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState({
    Teachers: [],
    Subjects: [],
    Rooms: [],
    Labs: [],
    Classes: [],
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [teachers, subjects, rooms, labs, classes] = await Promise.all([
        getTeachers(),
        getSubjects(),
        getRooms(),
        getLabs(),
        getClasses(),
      ]);

      setEntities({
        Teachers: teachers,
        Subjects: subjects,
        Rooms: rooms,
        Labs: labs,
        Classes: classes,
      });
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const config = useMemo(
    () => ({
      Teachers: {
        columns: [
          { key: "name", label: "Name" },
          { key: "abbreviation", label: "Short Name" },
        ],
        fields: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "abbreviation", label: "Short Name", type: "text", required: true, maxLength: 6 },
        ],
        create: createTeacher,
        update: updateTeacher,
        remove: deleteTeacher,
      },
      Subjects: {
        columns: [
          { key: "name", label: "Name" },
          { key: "code", label: "Code" },
          {
            key: "type",
            label: "Type",
            render: (value) => <span className={`badge ${value === "LAB" ? "badge-lab" : "badge-theory"}`}>{value}</span>,
          },
          { key: "creditHours", label: "Credit Hours" },
        ],
        fields: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "code", label: "Code", type: "text", required: true },
          {
            key: "type",
            label: "Type",
            type: "select",
            required: true,
            options: [
              { value: "THEORY", label: "THEORY" },
              { value: "LAB", label: "LAB" },
            ],
          },
          { key: "creditHours", label: "Credit Hours", type: "number", required: true },
        ],
        create: createSubject,
        update: updateSubject,
        remove: deleteSubject,
      },
      Rooms: {
        columns: [
          { key: "name", label: "Name" },
          { key: "capacity", label: "Capacity" },
        ],
        fields: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "capacity", label: "Capacity", type: "number" },
        ],
        create: createRoom,
        update: updateRoom,
        remove: deleteRoom,
      },
      Labs: {
        columns: [
          { key: "name", label: "Name" },
          { key: "capacity", label: "Capacity" },
        ],
        fields: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "capacity", label: "Capacity", type: "number" },
        ],
        create: createLab,
        update: updateLab,
        remove: deleteLab,
      },
      Classes: {
        columns: [
          { key: "branch", label: "Branch", render: (_, row) => row.branch.name },
          { key: "year", label: "Year", render: (value) => getYearLabel(value) },
        ],
        fields: [
          {
            key: "branchId",
            label: "Branch",
            type: "select",
            required: true,
            numeric: true,
            options: BRANCH_OPTIONS.map((branch) => ({ value: branch.id, label: branch.name })),
          },
          {
            key: "year",
            label: "Year",
            type: "select",
            required: true,
            numeric: true,
            options: YEAR_OPTIONS.map((year) => ({ value: year, label: getYearLabel(year) })),
          },
        ],
        create: createClass,
        update: updateClass,
        remove: deleteClass,
      },
    }),
    [],
  );

  const current = config[tab];

  const handleSubmit = async (formData) => {
    const payload = Object.fromEntries(
      Object.entries(formData).filter(([, value]) => value !== "" && value !== undefined && value !== null),
    );

    if (editingRow) {
      await current.update(editingRow.id, payload);
      showToast(`${tab.slice(0, -1)} updated`, "success");
    } else {
      await current.create(payload);
      showToast(`${tab.slice(0, -1)} created`, "success");
    }

    await loadAll();
    setDrawerOpen(false);
    setEditingRow(null);
  };

  const handleDelete = async (row) => {
    try {
      await current.remove(row.id);
      showToast(`${tab.slice(0, -1)} deleted`, "success");
      await loadAll();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Master Data</h1>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            setEditingRow(null);
            setDrawerOpen(true);
          }}
        >
          Add New
        </button>
      </div>

      <div className="tabs">
        {tabs.map((item) => (
          <button
            key={item}
            className={`btn ${tab === item ? "btn-primary" : "btn-ghost"}`}
            type="button"
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="panel">
        <DataTable
          columns={current.columns}
          rows={entities[tab]}
          onEdit={(row) => {
            setEditingRow(row);
            setDrawerOpen(true);
          }}
          onDelete={handleDelete}
          loading={false}
        />
      </div>

      <EntityDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingRow(null);
        }}
        title={`${editingRow ? "Edit" : "Add"} ${tab.slice(0, -1)}`}
        onSubmit={handleSubmit}
        initialValues={editingRow || {}}
        fields={current.fields}
      />
    </div>
  );
}
