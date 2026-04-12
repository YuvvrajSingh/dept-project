"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const class_routes_1 = __importDefault(require("./routes/class.routes"));
const lab_routes_1 = __importDefault(require("./routes/lab.routes"));
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const subject_routes_1 = __importDefault(require("./routes/subject.routes"));
const teacher_routes_1 = __importDefault(require("./routes/teacher.routes"));
const timetable_routes_1 = __importDefault(require("./routes/timetable.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const occupancy_routes_1 = __importDefault(require("./routes/occupancy.routes"));
const academicYear_routes_1 = __importDefault(require("./routes/academicYear.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const port = Number(process.env.PORT ?? 3001);
const configuredOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedOrigins = configuredOrigins?.length
    ? configuredOrigins
    : [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/public", public_routes_1.default);
app.use("/api", auth_middleware_1.authenticate);
app.use("/api/users", user_routes_1.default);
app.use("/api/teachers", teacher_routes_1.default);
app.use("/api/subjects", subject_routes_1.default);
app.use("/api/classes", class_routes_1.default);
app.use("/api/rooms", room_routes_1.default);
app.use("/api/labs", lab_routes_1.default);
app.use("/api/timetable/occupancy", occupancy_routes_1.default);
app.use("/api/timetable", timetable_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/academic-years", academicYear_routes_1.default);
app.use((_req, res) => {
    res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});
app.use(errorHandler_1.errorHandler);
app.listen(port, () => {
    console.log(`Timetable API running on port ${port}`);
});
