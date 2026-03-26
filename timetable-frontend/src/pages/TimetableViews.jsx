import { useEffect, useMemo, useState } from "react";
import { getClasses } from "../api/classes";
import { getRooms } from "../api/rooms";
import { getTeachers } from "../api/teachers";
import {
  getClassTimetable,
  getRoomTimetable,
  getTeacherTimetable,
} from "../api/timetable";
import Spinner from "../components/Spinner";
import TimetableGrid from "../components/TimetableGrid";
import {
  buildRoomMatrix,
  buildTeacherMatrix,
  createEmptyMatrix,
} from "../utils/matrix";
import { YEAR_OPTIONS, getYearLabel } from "../utils/format";

const tabs = ["Class Matrix", "Teacher Schedule", "Room Occupancy"];
const BRANCHES = ["CSE", "IT", "AI"];

export default function TimetableViews({ showToast }) {
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
        const [classesData, teachersData, roomsData] = await Promise.all([
          getClasses(),
          getTeachers(),
          getRooms(),
        ]);

        setClasses(classesData);
        setTeachers(teachersData);
        setRooms(roomsData);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoadingSetup(false);
      }
    }

    setup();
  }, [showToast]);

  const filteredClasses = useMemo(
    () =>
      classes.filter(
        (item) => item.branch?.name === branch && item.year === Number(year),
      ),
    [classes, branch, year],
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
        <h1>Timetable Views</h1>
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

      <div className="panel" style={{ marginBottom: 12 }}>
        {tab === "Class Matrix" ? (
          <div className="top-filter">
            <div className="form-group">
              <label>Branch</label>
              <select
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
              >
                {BRANCHES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              >
                {YEAR_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {getYearLabel(item)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Class</label>
              <select
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
              >
                <option value="">Select class</option>
                {filteredClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.branch.name} - {getYearLabel(item.year)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {tab === "Teacher Schedule" ? (
          <div className="top-filter">
            <div className="form-group">
              <label>Teacher</label>
              <select
                value={teacherId}
                onChange={(event) => setTeacherId(event.target.value)}
              >
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.abbreviation} - {teacher.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {tab === "Room Occupancy" ? (
          <div className="top-filter">
            <div className="form-group">
              <label>Room</label>
              <select
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
              >
                <option value="">Select room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        <button className="btn btn-primary" type="button" onClick={handleLoad}>
          Load
        </button>
      </div>

      <div className="panel">
        <TimetableGrid
          matrix={matrix}
          readOnly
          loading={loadingGrid}
          onCellClick={() => {}}
        />
      </div>
    </div>
  );
}
