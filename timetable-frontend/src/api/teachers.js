import { request } from "./client";

export const getTeachers = () => request("GET", "/api/teachers");
export const getTeacher = (id) => request("GET", `/api/teachers/${id}`);
export const createTeacher = (body) => request("POST", "/api/teachers", body);
export const updateTeacher = (id, body) => request("PUT", `/api/teachers/${id}`, body);
export const deleteTeacher = (id) => request("DELETE", `/api/teachers/${id}`);
export const getTeacherSubjects = (id) => request("GET", `/api/teachers/${id}/subjects`);
export const assignTeacherSubject = (id, subjectId) => request("POST", `/api/teachers/${id}/subjects`, { subjectId });
export const removeTeacherSubject = (id, subjectId) => request("DELETE", `/api/teachers/${id}/subjects/${subjectId}`);
export const getTeacherSchedule = (id) => request("GET", `/api/timetable/teacher/${id}`);
