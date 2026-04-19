import { prisma } from "../prisma/client";
import { AppError } from "../utils/AppError";

const assertLabExists = async (id: string) => {
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

  async updateLab(id: string, data: { name?: string; capacity?: number }) {
    await assertLabExists(id);
    return prisma.lab.update({ where: { id }, data });
  },

  async deleteLab(id: string) {
    await assertLabExists(id);

    const usageCount = await prisma.labGroupEntry.count({
      where: { labId: id },
    });

    if (usageCount > 0) {
      throw new AppError(
        `Cannot delete lab: It is currently assigned to ${usageCount} scheduled class(es). Please remove this lab from the timetable first.`,
        409,
        "CONFLICT"
      );
    }

    await prisma.lab.delete({ where: { id } });
  },
};
