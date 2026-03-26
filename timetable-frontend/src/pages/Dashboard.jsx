import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTeachers } from "../api/teachers";
import { getSubjects } from "../api/subjects";
import { getClasses } from "../api/classes";
import { getRooms } from "../api/rooms";
import { getLabs } from "../api/labs";
import Spinner from "../components/Spinner";
import StatCard from "../components/StatCard";

const cards = [
  { key: "teachers", label: "Teachers", icon: "👩‍🏫", path: "/master" },
  { key: "subjects", label: "Subjects", icon: "📘", path: "/master" },
  { key: "classes", label: "Classes", icon: "🏫", path: "/master" },
  { key: "rooms", label: "Rooms", icon: "🚪", path: "/master" },
  { key: "labs", label: "Labs", icon: "🧪", path: "/master" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    teachers: 0,
    subjects: 0,
    classes: 0,
    rooms: 0,
    labs: 0,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [teachers, subjects, classes, rooms, labs] = await Promise.all([
          getTeachers(),
          getSubjects(),
          getClasses(),
          getRooms(),
          getLabs(),
        ]);

        if (!active) return;

        setCounts({
          teachers: teachers.length,
          subjects: subjects.length,
          classes: classes.length,
          rooms: rooms.length,
          labs: labs.length,
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      <div className="grid-5">
        {cards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            count={counts[card.key]}
            icon={card.icon}
            onClick={() => navigate(card.path)}
          />
        ))}
      </div>
      <div className="quick-actions">
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => navigate("/master")}
        >
          Master Data
        </button>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => navigate("/assignments")}
        >
          Assignments
        </button>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => navigate("/builder")}
        >
          Build Timetable
        </button>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => navigate("/views")}
        >
          View Matrices
        </button>
      </div>
    </div>
  );
}
