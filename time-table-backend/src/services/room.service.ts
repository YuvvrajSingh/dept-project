import { prisma } from "../prisma/client";
import { AppError } from "../utils/AppError";

const assertRoomExists = async (id: number) => {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) {
    throw new AppError("Room not found", 404, "NOT_FOUND");
  }
};

export const roomService = {
  listRooms() {
    return prisma.room.findMany({ orderBy: { id: "asc" } });
  },

  createRoom(data: { name: string; capacity?: number }) {
    return prisma.room.create({ data: { name: data.name, capacity: data.capacity ?? 60 } });
  },

  async updateRoom(id: number, data: { name?: string; capacity?: number }) {
    await assertRoomExists(id);
    return prisma.room.update({ where: { id }, data });
  },

  async deleteRoom(id: number) {
    await assertRoomExists(id);
    await prisma.room.delete({ where: { id } });
  },
};
