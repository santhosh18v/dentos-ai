import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const CLINIC_ID = "clinic001";
const DENTIST_ID = "user001";
const GST_RATE = 18;

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna",
  "Ishaan", "Rohan", "Ananya", "Diya", "Saanvi", "Aadhya", "Kavya", "Priya",
  "Anika", "Navya", "Riya", "Meera", "Lakshmi", "Sneha", "Pooja", "Divya",
  "Rahul", "Kiran", "Sandeep", "Manoj", "Deepak", "Suresh",
];
const LAST_NAMES = [
  "Reddy", "Rao", "Naidu", "Sharma", "Kumar", "Patel", "Gupta", "Nair",
  "Menon", "Iyer", "Chowdary", "Varma", "Prasad", "Mehta", "Shetty",
];
const TREATMENTS: { name: string; price: number }[] = [
  { name: "Cleaning", price: 1000 },
  { name: "Root Canal", price: 5000 },
  { name: "Filling", price: 1500 },
  { name: "Extraction", price: 2000 },
  { name: "Crown", price: 8000 },
  { name: "Checkup", price: 500 },
  { name: "Whitening", price: 6000 },
  { name: "X-Ray", price: 300 },
  { name: "Braces Consultation", price: 1200 },
  { name: "Scaling & Polishing", price: 2500 },
];
const LANGUAGES = ["ENGLISH", "TELUGU", "HINDI"];
const PAY_METHODS: Prisma.PaymentCreateInput["method"][] = ["CASH", "UPI", "CARD", "BANK_TRANSFER"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
// A random date up to `monthsBack` months ago
function randomPastDate(monthsBack: number): Date {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - monthsBack);
  const ts = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  const d = new Date(ts);
  d.setHours(randInt(9, 17), pick([0, 15, 30, 45]), 0, 0);
  return d;
}
// Weighted appointment status: mostly COMPLETED
function randomStatus(): "COMPLETED" | "CANCELLED" | "NO_SHOW" | "CONFIRMED" {
  const r = Math.random();
  if (r < 0.7) return "COMPLETED";
  if (r < 0.82) return "CONFIRMED";
  if (r < 0.93) return "CANCELLED";
  return "NO_SHOW";
}

async function nextInvoiceSeq(): Promise<number> {
  const last = await prisma.invoice.findFirst({
    where: { clinicId: CLINIC_ID },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  if (last?.invoiceNumber) {
    const m = last.invoiceNumber.match(/(\d+)$/);
    if (m) return parseInt(m[1], 10) + 1;
  }
  return 1;
}

async function main() {
  console.log("Seeding demo data (tagged SEED-)...");

  // Find the next patient code number for SEED patients
  const NUM_PATIENTS = 28;
  let invoiceSeq = await nextInvoiceSeq();
  let createdPatients = 0;
  let createdAppts = 0;
  let createdInvoices = 0;
  let createdPayments = 0;

  for (let i = 1; i <= NUM_PATIENTS; i++) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const code = `SEED-${String(i).padStart(3, "0")}`;
    const phone = `9${randInt(100000000, 999999999)}`;

    const patient = await prisma.patient.create({
      data: {
        clinicId: CLINIC_ID,
        patientCode: code,
        name,
        phone,
        preferredLanguage: pick(LANGUAGES),
        createdAt: randomPastDate(6),
      },
    });
    createdPatients++;

    // 1-4 appointments per patient
    const apptCount = randInt(1, 4);
    for (let a = 0; a < apptCount; a++) {
      const treatment = pick(TREATMENTS);
      const status = randomStatus();
      const scheduledAt = randomPastDate(6);

      const appt = await prisma.appointment.create({
        data: {
          clinicId: CLINIC_ID,
          patientId: patient.id,
          dentistId: DENTIST_ID,
          scheduledAt,
          treatmentType: treatment.name,
          status,
          createdAt: scheduledAt,
        },
      });
      createdAppts++;

      // Only completed appointments get an invoice
      if (status === "COMPLETED") {
        const qty = 1;
        const subtotal = treatment.price * qty;
        const gstAmount = (subtotal * GST_RATE) / 100;
        const total = subtotal + gstAmount;
        const invoiceNumber = `INV-${String(invoiceSeq++).padStart(3, "0")}`;

        // Payment outcome: 70% paid full, 15% partial, 15% unpaid
        const r = Math.random();
        let amountPaid = 0;
        let invStatus: "PAID" | "PARTIALLY_PAID" | "SENT" = "SENT";
        if (r < 0.7) { amountPaid = total; invStatus = "PAID"; }
        else if (r < 0.85) { amountPaid = Math.round(total * 0.5); invStatus = "PARTIALLY_PAID"; }

        const invoice = await prisma.invoice.create({
          data: {
            clinicId: CLINIC_ID,
            patientId: patient.id,
            appointmentId: appt.id,
            invoiceNumber,
            subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
            gstRate: new Prisma.Decimal(GST_RATE.toFixed(2)),
            gstAmount: new Prisma.Decimal(gstAmount.toFixed(2)),
            total: new Prisma.Decimal(total.toFixed(2)),
            amountPaid: new Prisma.Decimal(amountPaid.toFixed(2)),
            status: invStatus,
            issuedAt: scheduledAt,
            createdAt: scheduledAt,
            lineItems: {
              create: [{
                description: treatment.name,
                quantity: qty,
                unitPrice: new Prisma.Decimal(treatment.price.toFixed(2)),
                lineTotal: new Prisma.Decimal(subtotal.toFixed(2)),
              }],
            },
          },
        });
        createdInvoices++;

        if (amountPaid > 0) {
          await prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: new Prisma.Decimal(amountPaid.toFixed(2)),
              method: pick(PAY_METHODS),
              paidAt: scheduledAt,
              createdAt: scheduledAt,
            },
          });
          createdPayments++;
        }
      }
    }
  }

  console.log("Done.");
  console.log(`  Patients:  ${createdPatients}`);
  console.log(`  Appointments: ${createdAppts}`);
  console.log(`  Invoices:  ${createdInvoices}`);
  console.log(`  Payments:  ${createdPayments}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
