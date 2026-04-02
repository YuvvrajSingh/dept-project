import { request } from "./client";

export const getLabs = () => request("GET", "/api/labs");
export const createLab = (body) => request("POST", "/api/labs", body);
export const updateLab = (id, body) => request("PUT", `/api/labs/${id}`, body);
export const deleteLab = (id) => request("DELETE", `/api/labs/${id}`);
