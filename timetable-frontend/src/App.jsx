import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Toast from "./components/Toast";
import Assignments from "./pages/Assignments";
import AssignmentOverview from "./pages/AssignmentOverview";
import Dashboard from "./pages/Dashboard";
import MasterData from "./pages/MasterData";
import TimetableBuilder from "./pages/TimetableBuilder";
import TimetableViews from "./pages/TimetableViews";

function App() {
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    if (!toast.message) return undefined;

    const timer = setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/master" element={<MasterData showToast={showToast} />} />
            <Route path="/assignments" element={<Assignments showToast={showToast} />} />
            <Route path="/assignment-overview" element={<AssignmentOverview showToast={showToast} />} />
            <Route path="/builder" element={<TimetableBuilder showToast={showToast} />} />
            <Route path="/views" element={<TimetableViews showToast={showToast} />} />
          </Routes>
        </main>
      </div>
      <Toast message={toast.message} type={toast.type} onDismiss={() => setToast({ message: "", type: "success" })} />
    </BrowserRouter>
  );
}

export default App;
