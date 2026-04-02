import express, { type Request, type Response } from "express";
import cors from "cors";
import classRoutes from "./routes/class.routes";
import labRoutes from "./routes/lab.routes";
import roomRoutes from "./routes/room.routes";
import subjectRoutes from "./routes/subject.routes";
import teacherRoutes from "./routes/teacher.routes";
import timetableRoutes from "./routes/timetable.routes";
import { errorHandler } from "./middleware/errorHandler";
import { schedulerService } from "./services/scheduler.service";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const configuredOrigins = process.env.CORS_ORIGIN?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins?.length
  ? configuredOrigins
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/teachers", teacherRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/timetable", timetableRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Timetable API running on port ${port}`);
});
