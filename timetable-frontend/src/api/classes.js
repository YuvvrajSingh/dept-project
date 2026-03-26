import { request } from "./client";

export const getClasses = () => request("GET", "/api/classes");
export const getClass = (id) => request("GET", `/api/classes/${id}`);
export const createClass = (body) => request("POST", "/api/classes", body);
export const updateClass = (id, body) =>
  request("PUT", `/api/classes/${id}`, body);
export const deleteClass = (id) => request("DELETE", `/api/classes/${id}`);
export const getClassSubjects = (id) =>
  request("GET", `/api/classes/${id}/subjects`);
export const assignClassSubject = (id, subjectId) =>
  request("POST", `/api/classes/${id}/subjects`, { subjectId });
export const removeClassSubject = (id, subjectId) =>
  request("DELETE", `/api/classes/${id}/subjects/${subjectId}`);
