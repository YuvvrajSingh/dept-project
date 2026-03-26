"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomService = void 0;
const client_1 = require("../prisma/client");
const AppError_1 = require("../utils/AppError");
const assertRoomExists = async (id) => {
    const room = await client_1.prisma.room.findUnique({ where: { id } });
    if (!room) {
        throw new AppError_1.AppError("Room not found", 404, "NOT_FOUND");
    }
};
exports.roomService = {
    listRooms() {
        return client_1.prisma.room.findMany({ orderBy: { id: "asc" } });
    },
    createRoom(data) {
        return client_1.prisma.room.create({ data: { name: data.name, capacity: data.capacity ?? 60 } });
    },
    async updateRoom(id, data) {
        await assertRoomExists(id);
        return client_1.prisma.room.update({ where: { id }, data });
    },
    async deleteRoom(id) {
        await assertRoomExists(id);
        await client_1.prisma.room.delete({ where: { id } });
    },
};
