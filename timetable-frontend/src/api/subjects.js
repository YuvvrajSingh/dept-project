import { request } from "./client";

export const getSubjects = () => request("GET", "/api/subjects");
export const getSubject = (id) => request("GET", `/api/subjects/${id}`);
export const createSubject = (body) => request("POST", "/api/subjects", body);
export const updateSubject = (id, body) =>
  request("PUT", `/api/subjects/${id}`, body);
export const deleteSubject = (id) => request("DELETE", `/api/subjects/${id}`);
