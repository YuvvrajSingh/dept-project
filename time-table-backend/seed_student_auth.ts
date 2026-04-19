import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedPasswords() {
  const students = await prisma.student.findMany();
  
  if (students.length === 0) {
    console.log("No students found. Run seed_mock_data_dept.py first.");
    return;
  }

  const hashedPassword = await bcrypt.hash("1234", 10);
  
  for (const student of students) {
    await prisma.student.update({
      where: { id: student.id },
      data: { passwordHash: hashedPassword }
    });
    console.log(`Updated password for student ${student.rollNumber}`);
  }

  console.log("All students now have password '1234'");
}

seedPasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
