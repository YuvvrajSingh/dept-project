import type {
  Teacher,
  Subject,
  ClassSection,
  Room,
  Lab,
  TimetableEntry,
  TimetableMatrix,
  TeacherSubject,
  ClassSubject,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── Teachers ──
export const teacherApi = {
  list: () => request<Teacher[]>("/api/teachers"),
  get: (id: number) => request<Teacher>(`/api/teachers/${id}`),
  create: (data: { name: string; abbreviation: string }) =>
    request<Teacher>("/api/teachers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; abbreviation: string }>) =>
    request<Teacher>(`/api/teachers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => request(`/api/teachers/${id}`, { method: "DELETE" }),
  getSubjects: (id: number) => request<TeacherSubject[]>(`/api/teachers/${id}/subjects`),
  assignSubject: (id: number, subjectId: number) =>
    request<TeacherSubject>(`/api/teachers/${id}/subjects`, {
      method: "POST",
      body: JSON.stringify({ subjectId }),
    }),
  removeSubject: (id: number, subjectId: number) =>
    request(`/api/teachers/${id}/subjects/${subjectId}`, { method: "DELETE" }),
  getSchedule: (id: number) => request<TimetableEntry[]>(`/api/teachers/${id}/schedule`),
};

// ── Subjects ──
export const subjectApi = {
  list: () => request<Subject[]>("/api/subjects"),
  get: (id: number) => request<Subject>(`/api/subjects/${id}`),
  create: (data: { code: string; name: string; type: "THEORY" | "LAB"; creditHours: number }) =>
    request<Subject>("/api/subjects", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Subject>) =>
    request<Subject>(`/api/subjects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => request(`/api/subjects/${id}`, { method: "DELETE" }),
};

// ── Classes ──
export const classApi = {
  list: () => request<ClassSection[]>("/api/classes"),
  get: (id: number) => request<ClassSection>(`/api/classes/${id}`),
  create: (data: { branchId: number; year: number }) =>
    request<ClassSection>("/api/classes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ branchId: number; year: number }>) =>
    request<ClassSection>(`/api/classes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => request(`/api/classes/${id}`, { method: "DELETE" }),
  getSubjects: (id: number) => request<ClassSubject[]>(`/api/classes/${id}/subjects`),
  assignSubject: (id: number, subjectId: number) =>
    request<ClassSubject>(`/api/classes/${id}/subjects`, {
      method: "POST",
      body: JSON.stringify({ subjectId }),
    }),
  removeSubject: (id: number, subjectId: number) =>
    request(`/api/classes/${id}/subjects/${subjectId}`, { method: "DELETE" }),
};

// ── Rooms ──
export const roomApi = {
  list: () => request<Room[]>("/api/rooms"),
  create: (data: { name: string; capacity?: number }) =>
    request<Room>("/api/rooms", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Room>) =>
    request<Room>(`/api/rooms/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => request(`/api/rooms/${id}`, { method: "DELETE" }),
};

// ── Labs ──
export const labApi = {
  list: () => request<Lab[]>("/api/labs"),
  create: (data: { name: string; capacity?: number }) =>
    request<Lab>("/api/labs", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Lab>) =>
    request<Lab>(`/api/labs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => request(`/api/labs/${id}`, { method: "DELETE" }),
};

// ── Timetable ──
export const timetableApi = {
  getMatrix: (classSectionId: number) =>
    request<TimetableMatrix>(`/api/timetable/${classSectionId}`),
  createEntry: (data: {
    classSectionId: number;
    day: number;
    slotStart?: number;
    entryType: "THEORY" | "LAB";
    subjectId: number;
    teacherId?: number;
    roomId?: number;
    labGroups?: { groupName: string; labId: number; teacherId: number }[];
  }) => request<TimetableEntry>("/api/timetable/entry", { method: "POST", body: JSON.stringify(data) }),
  updateEntry: (id: number, data: Record<string, unknown>) =>
    request<TimetableEntry>(`/api/timetable/entry/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEntry: (id: number) => request(`/api/timetable/entry/${id}`, { method: "DELETE" }),
  getTeacherSchedule: (teacherId: number) =>
    request<{ teacher: Teacher, theoryEntries: any[], labEntries: any[] }>(`/api/timetable/teacher/${teacherId}`),
  getRoomOccupancy: (roomId: number) =>
    request<{ room: Room, entries: TimetableEntry[] }>(`/api/timetable/room/${roomId}`),
  getExportPdfUrl: (classSectionId: number) => `${BASE}/api/timetable/${classSectionId}/export/pdf`,
};
