"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const class_routes_1 = __importDefault(require("./routes/class.routes"));
const lab_routes_1 = __importDefault(require("./routes/lab.routes"));
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const subject_routes_1 = __importDefault(require("./routes/subject.routes"));
const teacher_routes_1 = __importDefault(require("./routes/teacher.routes"));
const timetable_routes_1 = __importDefault(require("./routes/timetable.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const occupancy_routes_1 = __importDefault(require("./routes/occupancy.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const port = Number(process.env.PORT ?? 3000);
const configuredOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedOrigins = configuredOrigins?.length
    ? configuredOrigins
    : ["http://localhost:5173", "http://127.0.0.1:5173"];
app.use((0, cors_1.default)({ origin: allowedOrigins }));
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
app.use("/api/teachers", teacher_routes_1.default);
app.use("/api/subjects", subject_routes_1.default);
app.use("/api/classes", class_routes_1.default);
app.use("/api/rooms", room_routes_1.default);
app.use("/api/labs", lab_routes_1.default);
app.use("/api/timetable/occupancy", occupancy_routes_1.default);
app.use("/api/timetable", timetable_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use((_req, res) => {
    res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});
app.use(errorHandler_1.errorHandler);
app.listen(port, () => {
    console.log(`Timetable API running on port ${port}`);
});
