import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/", label: "Dashboard" },
  { path: "/master", label: "Master Data" },
  { path: "/assignments", label: "Assignments" },
  { path: "/assignment-overview", label: "Assignment Overview" },
  { path: "/builder", label: "Timetable Builder" },
  { path: "/views", label: "Timetable Views" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Dept Timetable</div>
      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
