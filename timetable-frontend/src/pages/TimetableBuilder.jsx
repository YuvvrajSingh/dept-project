import { useEffect, useMemo, useState } from "react";
import { getClasses, getClassSubjects } from "../api/classes";
import { getLabs } from "../api/labs";
import { getRooms } from "../api/rooms";
import { getTeachers } from "../api/teachers";
import { deleteEntry, getClassTimetable } from "../api/timetable";
import EntryForm from "../components/EntryForm";
import Spinner from "../components/Spinner";
import TimetableGrid from "../components/TimetableGrid";
import { YEAR_OPTIONS, getYearLabel } from "../utils/format";

const BRANCHES = ["CSE", "IT", "AI"];

export default function TimetableBuilder({ showToast }) {
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
        const [classesData, roomsData, labsData, teachersData] = await Promise.all([
          getClasses(),
          getRooms(),
          getLabs(),
          getTeachers(),
        ]);
        setClasses(classesData);
        setRooms(roomsData);
        setLabs(labsData);
        setTeachers(teachersData);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoadingSetup(false);
      }
    }

    setup();
  }, [showToast]);

  const filteredClasses = useMemo(
    () => classes.filter((item) => item.branch?.name === branch && item.year === Number(year)),
    [classes, branch, year],
  );

  const loadTimetable = async (id) => {
    setLoadingGrid(true);
    try {
      const [timetable, subjects] = await Promise.all([getClassTimetable(id), getClassSubjects(id)]);
      setMatrix(timetable.timetable);
      setClassSubjects(subjects);
      setPreviewOpen(false);
      setEntryOpen(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingGrid(false);
    }
  };

  if (loadingSetup) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Timetable Builder</h1>
      </div>

      <div className="top-filter panel">
        <div className="form-group">
          <label>Branch</label>
          <select value={branch} onChange={(event) => setBranch(event.target.value)}>
            {BRANCHES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Year</label>
          <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {YEAR_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {getYearLabel(item)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Class</label>
          <select value={classSectionId} onChange={(event) => setClassSectionId(event.target.value)}>
            <option value="">Select class</option>
            {filteredClasses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.branch.name} - {getYearLabel(item.year)}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-primary"
          type="button"
          disabled={!classSectionId}
          onClick={() => loadTimetable(Number(classSectionId))}
        >
          Load
        </button>
      </div>

      <div className="panel" style={{ position: "relative" }}>
        <TimetableGrid
          matrix={matrix}
          loading={loadingGrid}
          readOnly={!classSectionId}
          onCellClick={(day, slot, cellData) => {
            setSelectedCell({ day: Number(day), slot: Number(slot), cellData });
            if (cellData) {
              setPreviewOpen(true);
              setEntryOpen(false);
              return;
            }

            setPreviewOpen(false);
            setEntryOpen(true);
          }}
        />
      </div>

      {previewOpen && selectedCell.cellData ? (
        <div className="preview-panel panel">
          <div className="page-header" style={{ marginBottom: 8 }}>
            <h3>Entry Preview</h3>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setPreviewOpen(false);
              }}
            >
              Close
            </button>
          </div>

          <div className="preview-grid">
            <div className="preview-k">Day</div>
            <div className="preview-v">{selectedCell.day}</div>
            <div className="preview-k">Slot</div>
            <div className="preview-v">
              {selectedCell.cellData.type === "LAB" ? "5-6" : selectedCell.slot}
            </div>
            <div className="preview-k">Type</div>
            <div className="preview-v">{selectedCell.cellData.type}</div>
            <div className="preview-k">Subject</div>
            <div className="preview-v">{selectedCell.cellData.subjectCode}</div>
            <div className="preview-k">Teacher</div>
            <div className="preview-v">
              {selectedCell.cellData.type === "THEORY"
                ? selectedCell.cellData.teacherAbbr || "-"
                : Object.values(selectedCell.cellData.groups || {})
                    .map((item) => item.teacher)
                    .join(", ")}
            </div>
            <div className="preview-k">Room/Lab</div>
            <div className="preview-v">
              {selectedCell.cellData.type === "THEORY"
                ? selectedCell.cellData.roomName || "-"
                : Object.values(selectedCell.cellData.groups || {})
                    .map((item) => item.lab)
                    .join(", ")}
            </div>
          </div>

          <div className="form-row" style={{ marginTop: 10 }}>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setPreviewOpen(false);
                setEntryOpen(true);
              }}
            >
              Edit Entry
            </button>
            <button
              className="btn btn-danger"
              type="button"
              disabled={previewDeleting}
              onClick={async () => {
                if (!selectedCell.cellData?.entryId) {
                  showToast("Entry ID missing for delete", "error");
                  return;
                }

                try {
                  setPreviewDeleting(true);
                  await deleteEntry(selectedCell.cellData.entryId);
                  showToast("Entry deleted", "success");
                  setPreviewOpen(false);
                  await loadTimetable(Number(classSectionId));
                } catch (err) {
                  showToast(err.message, "error");
                } finally {
                  setPreviewDeleting(false);
                }
              }}
            >
              Delete Entry
            </button>
          </div>
        </div>
      ) : null}

      {entryOpen && classSectionId ? (
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
          onClose={() => {
            setEntryOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
