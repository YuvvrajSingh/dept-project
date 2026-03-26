import { request } from "./client";

export const getClassTimetable = (classSectionId) => request("GET", `/api/timetable/${classSectionId}`);
export const createEntry = (body) => request("POST", "/api/timetable/entry", body);
export const updateEntry = (id, body) => request("PUT", `/api/timetable/entry/${id}`, body);
export const deleteEntry = (id) => request("DELETE", `/api/timetable/entry/${id}`);
export const getTeacherTimetable = (teacherId) => request("GET", `/api/timetable/teacher/${teacherId}`);
export const getRoomTimetable = (roomId) => request("GET", `/api/timetable/room/${roomId}`);
