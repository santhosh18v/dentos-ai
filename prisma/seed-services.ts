import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const CLINIC_ID = "clinic001";

const SERVICES: { name: string; price: number; category: string; description: string }[] = [
  { name: "Consultation / Checkup", price: 500, category: "General", description: "Routine dental examination and consultation." },
  { name: "Cleaning", price: 1000, category: "General", description: "Professional teeth cleaning." },
  { name: "Scaling & Polishing", price: 2500, category: "General", description: "Deep cleaning to remove tartar and stains." },
  { name: "Filling", price: 1500, category: "Restorative", description: "Tooth-coloured filling for cavities." },
  { name: "Root Canal", price: 5000, category: "Restorative", description: "Root canal treatment for infected teeth." },
  { name: "Crown", price: 8000, category: "Restorative", description: "Dental crown / cap for damaged teeth." },
  { name: "Extraction", price: 2000, category: "Surgical", description: "Tooth removal." },
  { name: "Whitening", price: 6000, category: "Cosmetic", description: "Professional teeth whitening." },
  { name: "Braces Consultation", price: 1200, category: "Orthodontics", description: "Initial consultation for braces / aligners." },
  { name: "X-Ray", price: 300, category: "Diagnostic", description: "Dental X-ray imaging." },
];

async function main() {
  console.log("Seeding clinic info + services...");

  // Update clinic info (hours, working days, about)
  await prisma.clinic.update({
    where: { id: CLINIC_ID },
    data: {
      workingDays: "Mon-Sun",
      openingTime: "09:00",
      closingTime: "20:00",
      phone: "+91 40 1234 5678",
      email: "care@smilecare.in",
      address: "Road No. 12, Banjara Hills, Hyderabad, Telangana 500034",
      aboutInfo:
        "Free parking available on-site. We accept cash, UPI, cards, and bank transfers. " +
        "Walk-ins welcome but appointments are recommended. Emergency dental care available during working hours.",
    },
  });
  console.log("  Clinic info updated (Mon-Sun, 09:00-20:00).");

  // Clear any existing services for a clean re-seed, then insert
  await prisma.clinicService.deleteMany({ where: { clinicId: CLINIC_ID } });
  for (const s of SERVICES) {
    await prisma.clinicService.create({
      data: {
        clinicId: CLINIC_ID,
        name: s.name,
        price: new Prisma.Decimal(s.price.toFixed(2)),
        category: s.category,
        description: s.description,
      },
    });
  }
  console.log(`  ${SERVICES.length} services seeded.`);
  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
