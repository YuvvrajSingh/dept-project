import "dotenv/config";
import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import classRoutes from "./routes/class.routes";
import labRoutes from "./routes/lab.routes";
import roomRoutes from "./routes/room.routes";
import subjectRoutes from "./routes/subject.routes";
import teacherRoutes from "./routes/teacher.routes";
import timetableRoutes from "./routes/timetable.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import occupancyRoutes from "./routes/occupancy.routes";
import academicYearRoutes from "./routes/academicYear.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import { authenticate } from "./middleware/auth.middleware";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
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

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api", authenticate);
app.use("/api/users", userRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/timetable/occupancy", occupancyRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/academic-years", academicYearRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Timetable API running on port ${port}`);
});
