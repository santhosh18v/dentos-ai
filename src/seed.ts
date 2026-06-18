import { PrismaClient } from "./generated/prisma/client";
import bcrypt from "bcryptjs";

// Prisma 7 reads URL from environment
process.env.DATABASE_URL = "postgresql://dentos:dentos_secret_2024@localhost:5432/dentos_ai?schema=public";

const prisma = new PrismaClient();

async function main() {
  const clinic = await prisma.clinic.create({
    data: {
      name: "SmileCare Dental Clinic",
      address: "Jubilee Hills, Hyderabad",
      phone: "9999900000",
      email: "info@smilecare.com",
      gstNumber: "36AABCS1234A1Z5",
      isActive: true,
    },
  });
  console.log("✅ Clinic created:", clinic.name);

  await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: "Dr. Sharma",
      email: "admin@smilecare.com",
      passwordHash: await bcrypt.hash("admin123", 12),
      role: "CLINIC_ADMIN",
      phone: "9876543210",
      isActive: true,
    },
  });
  console.log("✅ Admin created: admin@smilecare.com");

  await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: "Dr. Reddy",
      email: "dentist@smilecare.com",
      passwordHash: await bcrypt.hash("dentist123", 12),
      role: "DENTIST",
      phone: "9876543211",
      isActive: true,
    },
  });
  console.log("✅ Dentist created: dentist@smilecare.com");

  await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: "Priya",
      email: "reception@smilecare.com",
      passwordHash: await bcrypt.hash("reception123", 12),
      role: "RECEPTIONIST",
      phone: "9876543212",
      isActive: true,
    },
  });
  console.log("✅ Receptionist created: reception@smilecare.com");

  console.log("\n🎉 Seed complete!");
  console.log("Login: admin@smilecare.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
