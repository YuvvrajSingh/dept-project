import { request } from "./client";

export const getRooms = () => request("GET", "/api/rooms");
export const createRoom = (body) => request("POST", "/api/rooms", body);
export const updateRoom = (id, body) =>
  request("PUT", `/api/rooms/${id}`, body);
export const deleteRoom = (id) => request("DELETE", `/api/rooms/${id}`);
