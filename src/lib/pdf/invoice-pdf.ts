import { jsPDF } from "jspdf";

type LineItem = { description: string; quantity: number; unitPrice: string; lineTotal: string };
type InvoicePdfData = {
  invoiceNumber: string;
  subtotal: string;
  gstAmount: string;
  total: string;
  amountPaid: string;
  status: string;
  patient: { name: string; patientCode: string; phone: string };
  lineItems: LineItem[];
};

const CLINIC_NAME = "SmileCare Dental Clinic";
const CLINIC_ADDR = "Hyderabad, Telangana";

// Draw a GST tax invoice and trigger a browser download.
export function generateInvoicePdf(inv: InvoicePdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const left = 40;
  const right = pageW - 40;
  let y = 50;

  // --- Header ---
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(CLINIC_NAME, left, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(CLINIC_ADDR, left, y + 16);

  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", right, y, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(inv.invoiceNumber, right, y + 16, { align: "right" });
  doc.text(new Date().toLocaleDateString("en-IN"), right, y + 30, { align: "right" });

  y += 60;
  doc.setDrawColor(220);
  doc.line(left, y, right, y);
  y += 24;

  // --- Bill to ---
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("BILL TO", left, y);
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(inv.patient.name, left, y + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${inv.patient.patientCode}  ·  ${inv.patient.phone}`, left, y + 30);

  y += 56;

  // --- Line items table header ---
  doc.setFillColor(245, 245, 245);
  doc.rect(left, y, right - left, 22, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80);
  doc.text("DESCRIPTION", left + 8, y + 15);
  doc.text("QTY", right - 200, y + 15, { align: "right" });
  doc.text("UNIT PRICE", right - 100, y + 15, { align: "right" });
  doc.text("AMOUNT", right - 8, y + 15, { align: "right" });
  y += 22;

  // --- Line items ---
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  doc.setFontSize(10);
  inv.lineItems.forEach((li) => {
    y += 20;
    doc.text(li.description, left + 8, y);
    doc.text(String(li.quantity), right - 200, y, { align: "right" });
    doc.text(`INR ${li.unitPrice}`, right - 100, y, { align: "right" });
    doc.text(`INR ${li.lineTotal}`, right - 8, y, { align: "right" });
    doc.setDrawColor(235);
    doc.line(left, y + 6, right, y + 6);
  });

  y += 30;

  // --- Totals ---
  const labelX = right - 160;
  const valX = right - 8;
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text("Subtotal", labelX, y, { align: "right" });
  doc.setTextColor(0);
  doc.text(`INR ${inv.subtotal}`, valX, y, { align: "right" });
  y += 18;
  doc.setTextColor(80);
  doc.text("GST (18%)", labelX, y, { align: "right" });
  doc.setTextColor(0);
  doc.text(`INR ${inv.gstAmount}`, valX, y, { align: "right" });
  y += 8;
  doc.setDrawColor(200);
  doc.line(labelX - 60, y, right, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL", labelX, y, { align: "right" });
  doc.text(`INR ${inv.total}`, valX, y, { align: "right" });

  y += 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Paid: INR ${inv.amountPaid}`, labelX, y, { align: "right" });
  doc.text(`Status: ${inv.status}`, valX, y, { align: "right" });

  // --- Footer ---
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("Thank you for choosing SmileCare Dental Clinic.", left, 780);

  doc.save(`${inv.invoiceNumber}.pdf`);
}
