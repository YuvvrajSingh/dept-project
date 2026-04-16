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
  AcademicYear,
} from "./types";

/** Browser: same-origin `/api/*` (rewritten to Express). Server: direct backend URL. */
function apiBase(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return (
    process.env.API_BACKEND_URL?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "") ||
    "http://127.0.0.1:3001"
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `API error ${res.status}`);
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

// ── Auth ──
export const authApi = {
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
};

// ── User management (admin) ──
export type UserAccount = {
  id: number;
  email: string;
  role: "ADMIN" | "TEACHER";
  teacherId: number | null;
  isActive: boolean;
  createdAt: string;
  teacher: { id: number; name: string; abbreviation: string } | null;
};

export const userApi = {
  list: () => request<UserAccount[]>("/api/users"),
  create: (data: { email: string; password: string; role: "TEACHER"; teacherId: number }) =>
    request<UserAccount>("/api/users", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: number) => request(`/api/users/${id}`, { method: "DELETE" }),
};

// ── Teacher self-service ──
export const teacherMeApi = {
  get: () => request<Teacher>("/api/teachers/me"),
};

// ── Academic Years ──
export const academicYearApi = {
  list: () => request<AcademicYear[]>("/api/academic-years"),
  getActive: () => request<AcademicYear>("/api/academic-years/active"),
  get: (id: number) => request<AcademicYear>(`/api/academic-years/${id}`),
  create: (data: { startYear: number; startDate?: string; endDate?: string }) =>
    request<AcademicYear>("/api/academic-years", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { startDate?: string; endDate?: string }) =>
    request<AcademicYear>(`/api/academic-years/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: "DRAFT" | "ACTIVE" | "ARCHIVED") =>
    request<AcademicYear>(`/api/academic-years/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  activate: (id: number) =>
    request<AcademicYear>(`/api/academic-years/${id}/activate`, { method: "PUT" }),
  clone: (sourceId: number, targetId: number) =>
    request<{ success: boolean; message: string; stats: any }>(`/api/academic-years/${targetId}/clone`, {
      method: "POST",
      body: JSON.stringify({ sourceId }),
    }),
  delete: (id: number) => request(`/api/academic-years/${id}`, { method: "DELETE" }),
  deleteAll: () => request<{ deleted: number }>(`/api/academic-years/all`, { method: "DELETE" }),
};

// ── Teachers ──
export const teacherApi = {
  list: () => request<Teacher[]>("/api/teachers"),
  get: (id: number) => request<Teacher>(`/api/teachers/${id}`),
  create: (data: { name: string; abbreviation: string; email?: string }) =>
    request<Teacher>("/api/teachers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; abbreviation: string; email: string }>) =>
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
  create: (data: { code: string; name: string; abbreviation: string; type: "THEORY" | "LAB"; creditHours: number }) =>
    request<Subject>("/api/subjects", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Subject>) =>
    request<Subject>(`/api/subjects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => request(`/api/subjects/${id}`, { method: "DELETE" }),
};

// ── Classes ──
export const classApi = {
  list: (academicYearId?: number) => {
    const url = academicYearId ? `/api/classes?academicYearId=${academicYearId}` : "/api/classes";
    return request<ClassSection[]>(url);
  },
  get: (id: number) => request<ClassSection>(`/api/classes/${id}`),
  create: (data: { branchName: string; year: number; semester: number; academicYearId: number }) =>
    request<ClassSection>("/api/classes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ branchName: string; year: number; semester: number }>) =>
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
    entryType: "LECTURE" | "LAB";
    subjectId: number;
    teacherId?: number;
    roomId?: number;
    labGroups?: { groupName: string; subjectId: number; labId: number; teacherId: number }[];
  }) => request<TimetableEntry>("/api/timetable/entry", { method: "POST", body: JSON.stringify(data) }),
  updateEntry: (id: number, data: Record<string, unknown>) =>
    request<TimetableEntry>(`/api/timetable/entry/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEntry: (id: number) => request(`/api/timetable/entry/${id}`, { method: "DELETE" }),
  getTeacherSchedule: (teacherId: number, academicYearId?: number) => {
    const params = academicYearId ? `?academicYearId=${academicYearId}` : "";
    return request<{ teacher: Teacher; theoryEntries: any[]; labEntries: any[] }>(`/api/timetable/teacher/${teacherId}${params}`);
  },
  getRoomOccupancy: (roomId: number, academicYearId?: number) => {
    const params = academicYearId ? `?academicYearId=${academicYearId}` : "";
    return request<{ room: Room; entries: TimetableEntry[] }>(`/api/timetable/room/${roomId}${params}`);
  },
  generateTimetable: (classSectionId: number) => 
    request<{ success: boolean; auditReport: string[] }>(`/api/timetable/${classSectionId}/generate`, { method: "POST" }),
  clearTimetable: (classSectionId: number) => 
    request<{ success: boolean }>(`/api/timetable/${classSectionId}/clear`, { method: "DELETE" }),
  clearGlobalTimetable: () => 
    request<{ success: boolean }>('/api/timetable/clear-all', { method: "DELETE" }),
  factoryReset: () =>
    request<{ success: boolean; message: string }>('/api/timetable/factory-reset', { method: "DELETE" }),
  getExportPdfUrl: (classSectionId: number) =>
    `${typeof window !== "undefined" ? "" : apiBase()}/api/timetable/${classSectionId}/export/pdf`,
  getOccupancy: (excludeClassSectionId?: number, academicYearId?: number) => {
    const params = new URLSearchParams();
    if (excludeClassSectionId) params.set("excludeClassSectionId", String(excludeClassSectionId));
    if (academicYearId) params.set("academicYearId", String(academicYearId));
    const qs = params.toString();
    const url = qs ? `/api/timetable/occupancy?${qs}` : "/api/timetable/occupancy";
    return request<{ teachers: Record<number, Record<number, number[]>>; rooms: Record<number, Record<number, number[]>>; labs: Record<number, Record<number, number[]>> }>(url);
  },
  cancelToday: (id: number, reason?: string) =>
    request<{ id: number; timetableEntryId: number; cancelDate: string; reason: string | null }>(
      `/api/timetable/entry/${id}/cancel-today`,
      { method: "POST", body: JSON.stringify({ reason }) }
    ),
  undoCancelToday: (id: number) =>
    request<{ success: boolean; message?: string }>(
      `/api/timetable/entry/${id}/undo-cancel-today`,
      { method: "POST" }
    ),
};

// ── Dashboard ──
export const dashboardApi = {
  getMetrics: (academicYearId?: number) => {
    const url = academicYearId ? `/api/dashboard/metrics?academicYearId=${academicYearId}` : "/api/dashboard/metrics";
    return request<any>(url);
  },
};

// ── Public API (No Auth Required) ──
export const publicApi = {
  getActiveYear: () => request<AcademicYear>("/api/public/active-year"),
  getClasses: (academicYearId?: number) => {
    const url = academicYearId ? `/api/public/classes?academicYearId=${academicYearId}` : "/api/public/classes";
    return request<ClassSection[]>(url);
  },
  getMatrix: (classSectionId: number) =>
    request<TimetableMatrix>(`/api/public/timetable/${classSectionId}`),
  getTodayCancellations: (classSectionId: number) =>
    request<Array<{ timetableEntryId: number; day: number; slotOrder: number; subjectLabel: string; reason: string | null; cancelledAt: string }>>(
      `/api/public/cancellations/today?classSectionId=${classSectionId}`
    ),
};
