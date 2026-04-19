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

// ── Students (admin management) ──
export type Student = {
  id: string;
  rollNumber: string;
  name: string;
  email?: string | null;
  batch?: string | null;
  isActive: boolean;
  classSectionId: string;
  classSection?: { id: string; semester: number; year: number; branch?: { name: string } };
};

export const studentApi = {
  list: (params?: { classSectionId?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.classSectionId) qs.set("classSectionId", params.classSectionId);
    if (params?.search) qs.set("search", params.search);
    const url = `/api/students${qs.toString() ? `?${qs}` : ""}`;
    return request<Student[]>(url);
  },
  create: (data: { rollNumber: string; name: string; email?: string; classSectionId: string; batch?: string }) =>
    request<Student>("/api/students", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; email: string; classSectionId: string; batch: string }>) =>
    request<Student>(`/api/students/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  softDelete: (id: string) =>
    request(`/api/students/${id}`, { method: "DELETE" }),
  promote: (studentIds: string[], targetClassSectionId: string, note?: string) =>
    request<{ succeeded: number; failed: string[] }>("/api/students/promote", {
      method: "POST",
      body: JSON.stringify({ studentIds, targetClassSectionId, note }),
    }),
  demote: (studentIds: string[], targetClassSectionId: string, note?: string) =>
    request<{ succeeded: number; failed: string[] }>("/api/students/demote", {
      method: "POST",
      body: JSON.stringify({ studentIds, targetClassSectionId, note }),
    }),
  /** Uploads a raw CSV/XLSX file for bulk import. Returns multipart. */
  bulkImportFile: (file: File, classSectionId: string) => {
    const base = typeof window !== "undefined" ? "" : (process.env.API_BACKEND_URL?.trim().replace(/\/$/, "") || "http://127.0.0.1:3001");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("classSectionId", classSectionId);
    return fetch(`${base}/api/students/bulk-file`, {
      method: "POST",
      credentials: "include",
      body: fd,
    }).then((r) => {
      if (!r.ok) return r.json().then((b) => Promise.reject(new Error(b.message ?? `Error ${r.status}`)));
      return r.json();
    });
  },
};

// ── User management (admin) ──
export type UserAccount = {
  id: string;
  email: string;
  role: "ADMIN" | "TEACHER";
  teacherId: string | null;
  isActive: boolean;
  createdAt: string;
  teacher: { id: string; name: string; abbreviation: string } | null;
};

export const userApi = {
  list: () => request<UserAccount[]>("/api/users"),
  create: (data: { email: string; password: string; role: "TEACHER"; teacherId: string }) =>
    request<UserAccount>("/api/users", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/api/users/${id}`, { method: "DELETE" }),
};

// ── Teacher self-service ──
export const teacherMeApi = {
  get: () => request<Teacher>("/api/teachers/me"),
};

// ── Academic Years ──
export const academicYearApi = {
  list: () => request<AcademicYear[]>("/api/academic-years"),
  getActive: () => request<AcademicYear>("/api/academic-years/active"),
  get: (id: string) => request<AcademicYear>(`/api/academic-years/${id}`),
  create: (data: { startYear: number; startDate?: string; endDate?: string }) =>
    request<AcademicYear>("/api/academic-years", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { startDate?: string; endDate?: string }) =>
    request<AcademicYear>(`/api/academic-years/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: string, status: "DRAFT" | "ACTIVE" | "ARCHIVED") =>
    request<AcademicYear>(`/api/academic-years/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  activate: (id: string) =>
    request<AcademicYear>(`/api/academic-years/${id}/activate`, { method: "PUT" }),
  clone: (sourceId: string, targetId: string) =>
    request<{ success: boolean; message: string; stats: any }>(`/api/academic-years/${targetId}/clone`, {
      method: "POST",
      body: JSON.stringify({ sourceId }),
    }),
  delete: (id: string) => request(`/api/academic-years/${id}`, { method: "DELETE" }),
  deleteAll: () => request<{ deleted: number }>(`/api/academic-years/all`, { method: "DELETE" }),
};

// ── Teachers ──
export const teacherApi = {
  list: () => request<Teacher[]>("/api/teachers"),
  get: (id: string) => request<Teacher>(`/api/teachers/${id}`),
  create: (data: { name: string; abbreviation: string; email?: string }) =>
    request<Teacher>("/api/teachers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; abbreviation: string; email: string }>) =>
    request<Teacher>(`/api/teachers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/api/teachers/${id}`, { method: "DELETE" }),
  getSubjects: (id: string) => request<TeacherSubject[]>(`/api/teachers/${id}/subjects`),
  assignSubject: (id: string, subjectId: string) =>
    request<TeacherSubject>(`/api/teachers/${id}/subjects`, {
      method: "POST",
      body: JSON.stringify({ subjectId }),
    }),
  removeSubject: (id: string, subjectId: string) =>
    request(`/api/teachers/${id}/subjects/${subjectId}`, { method: "DELETE" }),
  getSchedule: (id: string) => request<TimetableEntry[]>(`/api/teachers/${id}/schedule`),
};

// ── Subjects ──
export const subjectApi = {
  list: () => request<Subject[]>("/api/subjects"),
  get: (id: string) => request<Subject>(`/api/subjects/${id}`),
  create: (data: { code: string; name: string; abbreviation: string; type: "THEORY" | "LAB"; creditHours: number }) =>
    request<Subject>("/api/subjects", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Subject>) =>
    request<Subject>(`/api/subjects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/api/subjects/${id}`, { method: "DELETE" }),
};

// ── Classes ──
export const classApi = {
  list: (academicYearId?: string) => {
    const url = academicYearId ? `/api/classes?academicYearId=${academicYearId}` : "/api/classes";
    return request<ClassSection[]>(url);
  },
  get: (id: string) => request<ClassSection>(`/api/classes/${id}`),
  create: (data: { branchName: string; year: number; semester: number; academicYearId: string }) =>
    request<ClassSection>("/api/classes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ branchName: string; year: number; semester: number }>) =>
    request<ClassSection>(`/api/classes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/api/classes/${id}`, { method: "DELETE" }),
  getSubjects: (id: string) => request<ClassSubject[]>(`/api/classes/${id}/subjects`),
  assignSubject: (id: string, subjectId: string) =>
    request<ClassSubject>(`/api/classes/${id}/subjects`, {
      method: "POST",
      body: JSON.stringify({ subjectId }),
    }),
  removeSubject: (id: string, subjectId: string) =>
    request(`/api/classes/${id}/subjects/${subjectId}`, { method: "DELETE" }),
};

// ── Rooms ──
export const roomApi = {
  list: () => request<Room[]>("/api/rooms"),
  create: (data: { name: string; capacity?: number }) =>
    request<Room>("/api/rooms", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Room>) =>
    request<Room>(`/api/rooms/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/api/rooms/${id}`, { method: "DELETE" }),
};

// ── Labs ──
export const labApi = {
  list: () => request<Lab[]>("/api/labs"),
  create: (data: { name: string; capacity?: number }) =>
    request<Lab>("/api/labs", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Lab>) =>
    request<Lab>(`/api/labs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/api/labs/${id}`, { method: "DELETE" }),
};

// ── Timetable ──
export const timetableApi = {
  getMatrix: (classSectionId: string) =>
    request<TimetableMatrix>(`/api/timetable/${classSectionId}`),
  createEntry: (data: {
    classSectionId: string;
    day: number;
    slotStart?: number;
    entryType: "LECTURE" | "LAB";
    subjectId: string;
    teacherId?: string;
    roomId?: string;
    labGroups?: { groupName: string; subjectId: string; labId: string; teacherId: string }[];
  }) => request<TimetableEntry>("/api/timetable/entry", { method: "POST", body: JSON.stringify(data) }),
  updateEntry: (id: string, data: Record<string, unknown>) =>
    request<TimetableEntry>(`/api/timetable/entry/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEntry: (id: string) => request(`/api/timetable/entry/${id}`, { method: "DELETE" }),
  getTeacherSchedule: (teacherId: string, academicYearId?: string) => {
    const params = academicYearId ? `?academicYearId=${academicYearId}` : "";
    return request<{ teacher: Teacher; theoryEntries: any[]; labEntries: any[] }>(`/api/timetable/teacher/${teacherId}${params}`);
  },
  getRoomOccupancy: (roomId: string, academicYearId?: string) => {
    const params = academicYearId ? `?academicYearId=${academicYearId}` : "";
    return request<{ room: Room; entries: TimetableEntry[] }>(`/api/timetable/room/${roomId}${params}`);
  },
  generateTimetable: (classSectionId: string) =>
    request<{ success: boolean; auditReport: string[] }>(`/api/timetable/${classSectionId}/generate`, { method: "POST" }),
  clearTimetable: (classSectionId: string) =>
    request<{ success: boolean }>(`/api/timetable/${classSectionId}/clear`, { method: "DELETE" }),
  clearGlobalTimetable: () =>
    request<{ success: boolean }>('/api/timetable/clear-all', { method: "DELETE" }),
  factoryReset: () =>
    request<{ success: boolean; message: string }>('/api/timetable/factory-reset', { method: "DELETE" }),
  getExportPdfUrl: (classSectionId: string) =>
    `${typeof window !== "undefined" ? "" : apiBase()}/api/timetable/${classSectionId}/export/pdf`,
  getOccupancy: (excludeClassSectionId?: string, academicYearId?: string) => {
    const params = new URLSearchParams();
    if (excludeClassSectionId) params.set("excludeClassSectionId", excludeClassSectionId);
    if (academicYearId) params.set("academicYearId", academicYearId);
    const qs = params.toString();
    const url = qs ? `/api/timetable/occupancy?${qs}` : "/api/timetable/occupancy";
    return request<{ teachers: Record<string, Record<number, number[]>>; rooms: Record<string, Record<number, number[]>>; labs: Record<string, Record<number, number[]>> }>(url);
  },
  cancelToday: (id: string, reason?: string) =>
    request<{ id: string; timetableEntryId: string; cancelDate: string; reason: string | null }>(
      `/api/timetable/entry/${id}/cancel-today`,
      { method: "POST", body: JSON.stringify({ reason }) }
    ),
  undoCancelToday: (id: string) =>
    request<{ success: boolean; message?: string }>(
      `/api/timetable/entry/${id}/undo-cancel-today`,
      { method: "POST" }
    ),
};

// ── Dashboard ──
export const dashboardApi = {
  getMetrics: (academicYearId?: string) => {
    const url = academicYearId ? `/api/dashboard/metrics?academicYearId=${academicYearId}` : "/api/dashboard/metrics";
    return request<any>(url);
  },
};

// ── Public API (No Auth Required) ──
export const publicApi = {
  getActiveYear: () => request<AcademicYear>("/api/public/active-year"),
  getClasses: (academicYearId?: string) => {
    const url = academicYearId ? `/api/public/classes?academicYearId=${academicYearId}` : "/api/public/classes";
    return request<ClassSection[]>(url);
  },
  getMatrix: (classSectionId: string) =>
    request<TimetableMatrix>(`/api/public/timetable/${classSectionId}`),
  getTodayCancellations: (classSectionId: string) =>
    request<Array<{ timetableEntryId: string; day: number; slotOrder: number; subjectLabel: string; reason: string | null; cancelledAt: string }>>(
      `/api/public/cancellations/today?classSectionId=${classSectionId}`
    ),
};
