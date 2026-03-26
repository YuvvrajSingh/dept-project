"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.labService = void 0;
const client_1 = require("../prisma/client");
const AppError_1 = require("../utils/AppError");
const assertLabExists = async (id) => {
    const lab = await client_1.prisma.lab.findUnique({ where: { id } });
    if (!lab) {
        throw new AppError_1.AppError("Lab not found", 404, "NOT_FOUND");
    }
};
exports.labService = {
    listLabs() {
        return client_1.prisma.lab.findMany({ orderBy: { id: "asc" } });
    },
    createLab(data) {
        return client_1.prisma.lab.create({ data: { name: data.name, capacity: data.capacity ?? 20 } });
    },
    async updateLab(id, data) {
        await assertLabExists(id);
        return client_1.prisma.lab.update({ where: { id }, data });
    },
    async deleteLab(id) {
        await assertLabExists(id);
        await client_1.prisma.lab.delete({ where: { id } });
    },
};
