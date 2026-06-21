"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Receipt, IndianRupee } from "lucide-react";

const GST_RATE = 18;

type Patient = { id: string; name: string; patientCode: string };
type LineItem = { description: string; quantity: number; unitPrice: number };
type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  total: string;
  amountPaid: string;
  status: string;
  patient: { name: string; patientCode: string };
};
type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  subtotal: string;
  gstAmount: string;
  total: string;
  amountPaid: string;
  status: string;
  patient: { name: string; patientCode: string; phone: string };
  lineItems: { id: string; description: string; quantity: number; unitPrice: string; lineTotal: string }[];
  payments: { id: string; amount: string; method: string; reference: string | null; paidAt: string }[];
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-200 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function BillingPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [selected, setSelected] = useState<InvoiceDetail | null>(null);
  const [message, setMessage] = useState("");

  // create-invoice form
  const [patientId, setPatientId] = useState("");
  const [lines, setLines] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [creating, setCreating] = useState(false);

  // payment form
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");

  async function loadAll() {
    const [pRes, iRes] = await Promise.all([
      fetch("/api/patients"),
      fetch("/api/invoices"),
    ]);
    const pData = await pRes.json();
    const iData = await iRes.json();
    setPatients(pData.data || []);
    setInvoices(iData.data || []);
  }

  useEffect(() => { loadAll(); }, []);

  // live preview math (server is authoritative on submit)
  const subtotal = lines.reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice || 0), 0);
  const gst = (subtotal * GST_RATE) / 100;
  const total = subtotal + gst;

  function updateLine(i: number, field: keyof LineItem, value: string) {
    const next = [...lines];
    if (field === "description") next[i].description = value;
    else next[i][field] = Number(value) || 0;
    setLines(next);
  }
  function addLine() { setLines([...lines, { description: "", quantity: 1, unitPrice: 0 }]); }
  function removeLine(i: number) { setLines(lines.filter((_, idx) => idx !== i)); }

  async function createInvoice() {
    if (!patientId) { setMessage("Pick a patient."); return; }
    const valid = lines.filter((l) => l.description.trim() && l.unitPrice > 0);
    if (valid.length === 0) { setMessage("Add at least one line item with a price."); return; }

    setCreating(true);
    setMessage("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, lineItems: valid }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Invoice ${data.data.invoiceNumber} created (₹${data.data.total}).`);
        setPatientId("");
        setLines([{ description: "", quantity: 1, unitPrice: 0 }]);
        await loadAll();
      } else {
        setMessage(data.error || "Failed to create invoice.");
      }
    } catch {
      setMessage("Failed to create invoice.");
    } finally {
      setCreating(false);
    }
  }

  async function openInvoice(id: string) {
    const res = await fetch(`/api/invoices/${id}`);
    const data = await res.json();
    if (data.success) setSelected(data.data);
  }

  async function recordPayment() {
    if (!selected) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { setMessage("Enter a valid payment amount."); return; }
    const res = await fetch(`/api/invoices/${selected.id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt, method: payMethod, reference: payRef || null }),
    });
    const data = await res.json();
    if (data.success) {
      setPayAmount(""); setPayRef("");
      await openInvoice(selected.id);
      await loadAll();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Create GST invoices and track payments</p>
      </div>

      {message && <div className="rounded-md bg-muted p-3 text-sm">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — create invoice */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4" /> New Invoice
          </h2>

          <div className="space-y-2">
            <Label>Patient</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            >
              <option value="">Select a patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.patientCode})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Treatments</Label>
            {lines.map((line, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder="Treatment (e.g. Root Canal)"
                  value={line.description}
                  onChange={(e) => updateLine(i, "description", e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, "quantity", e.target.value)}
                  className="w-16"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={line.unitPrice || ""}
                  onChange={(e) => updateLine(i, "unitPrice", e.target.value)}
                  className="w-24"
                />
                {lines.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeLine(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="mr-1 h-3 w-3" /> Add treatment
            </Button>
          </div>

          {/* live preview */}
          <div className="rounded-md border p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST ({GST_RATE}%)</span><span>₹{gst.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
          </div>

          <Button onClick={createInvoice} disabled={creating}>
            {creating ? "Creating..." : "Create Invoice"}
          </Button>
        </Card>

        {/* RIGHT — invoices + detail */}
        <div className="space-y-4">
          {!selected ? (
            <Card className="p-5">
              <h2 className="font-semibold mb-4">Invoices</h2>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <button
                      key={inv.id}
                      onClick={() => openInvoice(inv.id)}
                      className="w-full text-left border rounded-lg p-3 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{inv.invoiceNumber} · {inv.patient.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Paid ₹{inv.amountPaid} of ₹{inv.total}
                          </div>
                        </div>
                        <Badge variant="secondary" className={STATUS_COLORS[inv.status] || ""}>
                          {inv.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{selected.invoiceNumber}</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>← Back</Button>
              </div>
              <div className="text-sm">
                <div className="font-medium">{selected.patient.name}</div>
                <div className="text-xs text-muted-foreground">{selected.patient.phone}</div>
              </div>

              <div className="border rounded-md divide-y text-sm">
                {selected.lineItems.map((li) => (
                  <div key={li.id} className="flex justify-between p-2">
                    <span>{li.description} {li.quantity > 1 ? `× ${li.quantity}` : ""}</span>
                    <span>₹{li.lineTotal}</span>
                  </div>
                ))}
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{selected.subtotal}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span>₹{selected.gstAmount}</span></div>
                <div className="flex justify-between font-semibold"><span>Total</span><span>₹{selected.total}</span></div>
                <div className="flex justify-between text-emerald-600"><span>Paid</span><span>₹{selected.amountPaid}</span></div>
                <Badge variant="secondary" className={STATUS_COLORS[selected.status] || ""}>{selected.status}</Badge>
              </div>

              {/* payments */}
              {selected.payments.length > 0 && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="font-medium text-foreground">Payments</div>
                  {selected.payments.map((p) => (
                    <div key={p.id} className="flex justify-between">
                      <span>{p.method}{p.reference ? ` · ${p.reference}` : ""}</span>
                      <span>₹{p.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* record payment */}
              {selected.status !== "PAID" && (
                <div className="border-t pt-3 space-y-2">
                  <Label className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> Record Payment</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Amount" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="flex-1" />
                    <select className="rounded-md border bg-background px-2 py-1 text-sm" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank</option>
                    </select>
                  </div>
                  <Input placeholder="Reference (optional)" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
                  <Button size="sm" onClick={recordPayment}>Record Payment</Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
