import { prisma } from "../prisma/client";
import { AppError } from "../utils/AppError";

const assertLabExists = async (id: number) => {
  const lab = await prisma.lab.findUnique({ where: { id } });
  if (!lab) {
    throw new AppError("Lab not found", 404, "NOT_FOUND");
  }
};

export const labService = {
  listLabs() {
    return prisma.lab.findMany({ orderBy: { id: "asc" } });
  },

  createLab(data: { name: string; capacity?: number }) {
    return prisma.lab.create({ data: { name: data.name, capacity: data.capacity ?? 20 } });
  },

  async updateLab(id: number, data: { name?: string; capacity?: number }) {
    await assertLabExists(id);
    return prisma.lab.update({ where: { id }, data });
  },

  async deleteLab(id: number) {
    await assertLabExists(id);
    await prisma.lab.delete({ where: { id } });
  },
};
