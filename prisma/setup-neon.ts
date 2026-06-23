import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log("Setting up Neon: clinic, users, services...");

  await prisma.clinic.upsert({
    where: { id: "clinic001" },
    update: {},
    create: {
      id: "clinic001",
      name: "SmileCare Dental",
      slug: "smilecare",
      whatsappNumber: "+91 90147 43783",
      openingTime: "09:00",
      closingTime: "21:00",
      address: "Banjara Hills, Hyderabad",
    },
  });
  console.log("✓ Clinic created");

  const adminHash = await bcrypt.hash("admin123", 10);
  const receptionHash = await bcrypt.hash("reception123", 10);
  const dentistHash = await bcrypt.hash("dentist123", 10);

  await prisma.user.upsert({
    where: { email: "admin@smilecare.com" },
    update: {},
    create: {
      id: "user001",
      clinicId: "clinic001",
      email: "admin@smilecare.com",
      passwordHash: adminHash,
      name: "Dr. Sharma",
      role: "CLINIC_ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "reception@smilecare.com" },
    update: {},
    create: {
      clinicId: "clinic001",
      email: "reception@smilecare.com",
      passwordHash: receptionHash,
      name: "Priya Reception",
      role: "RECEPTIONIST",
    },
  });

  await prisma.user.upsert({
    where: { email: "dentist@smilecare.com" },
    update: {},
    create: {
      id: "cmqpfbk3n00007d11c9ah9kex",
      clinicId: "clinic001",
      email: "dentist@smilecare.com",
      passwordHash: dentistHash,
      name: "Dr. Anjali Rao",
      role: "DENTIST",
    },
  });
  console.log("✓ Users created");

  const existing = await prisma.clinicService.count({ where: { clinicId: "clinic001" } });
  if (existing === 0) {
    await prisma.clinicService.createMany({
      data: [
        { clinicId: "clinic001", name: "Cleaning", price: 1000 },
        { clinicId: "clinic001", name: "Root Canal", price: 5000 },
        { clinicId: "clinic001", name: "Filling", price: 1500 },
        { clinicId: "clinic001", name: "Extraction", price: 2000 },
        { clinicId: "clinic001", name: "Crown", price: 8000 },
        { clinicId: "clinic001", name: "Checkup", price: 500 },
        { clinicId: "clinic001", name: "Whitening", price: 6000 },
        { clinicId: "clinic001", name: "X-Ray", price: 300 },
        { clinicId: "clinic001", name: "Braces Consultation", price: 1200 },
        { clinicId: "clinic001", name: "Scaling & Polishing", price: 2500 },
      ],
    });
    console.log("✓ Services created");
  }

  console.log("\nNeon setup complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
