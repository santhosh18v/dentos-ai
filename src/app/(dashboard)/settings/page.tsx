"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Clock, Plus, Trash2, Pencil, Check, X } from "lucide-react";

type Clinic = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstNumber: string | null;
  workingDays: string | null;
  openingTime: string | null;
  closingTime: string | null;
  aboutInfo: string | null;
};
type Service = {
  id: string;
  name: string;
  price: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
};

export default function SettingsPage() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [savingClinic, setSavingClinic] = useState(false);
  const [message, setMessage] = useState("");

  // new-service form
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // editing a service
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  async function loadAll() {
    const [cRes, sRes] = await Promise.all([
      fetch("/api/clinic"),
      fetch("/api/clinic/services"),
    ]);
    const cData = await cRes.json();
    const sData = await sRes.json();
    if (cData.success) setClinic(cData.data);
    if (sData.success) setServices(sData.data);
  }

  // Role guard: only CLINIC_ADMIN/RECEPTIONIST may view settings.
  // Anyone else who types the URL directly is redirected to the dashboard.
  useEffect(() => {
    const c = document.cookie.split("; ").find((x) => x.startsWith("user_role="));
    const role = c ? c.split("=")[1] : "";
    if (role !== "CLINIC_ADMIN" && role !== "RECEPTIONIST") {
      window.location.replace("/dashboard");
    }
  }, []);

  useEffect(() => { loadAll(); }, []);

  function setField(field: keyof Clinic, value: string) {
    if (!clinic) return;
    setClinic({ ...clinic, [field]: value });
  }

  async function saveClinic() {
    if (!clinic) return;
    setSavingClinic(true);
    setMessage("");
    try {
      const res = await fetch("/api/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinic),
      });
      const data = await res.json();
      setMessage(data.success ? "Clinic details saved." : (data.error || "Failed to save."));
    } catch {
      setMessage("Failed to save.");
    } finally {
      setSavingClinic(false);
    }
  }

  async function addService() {
    if (!newName.trim() || !newPrice || Number(newPrice) < 0) {
      setMessage("Enter a service name and a valid price.");
      return;
    }
    const res = await fetch("/api/clinic/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, price: Number(newPrice) }),
    });
    const data = await res.json();
    if (data.success) {
      setNewName(""); setNewPrice("");
      await loadAll();
    } else {
      setMessage(data.error || "Failed to add service.");
    }
  }

  function startEdit(s: Service) {
    setEditId(s.id);
    setEditName(s.name);
    setEditPrice(String(Number(s.price)));
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/clinic/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, price: Number(editPrice) }),
    });
    const data = await res.json();
    if (data.success) {
      setEditId(null);
      await loadAll();
    }
  }

  async function deleteService(id: string) {
    const res = await fetch(`/api/clinic/services/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) await loadAll();
  }

  if (!clinic) {
    return <div className="text-muted-foreground text-sm py-12 text-center">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your clinic profile, hours, and services</p>
      </div>

      {message && <div className="rounded-md bg-muted p-3 text-sm">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — clinic profile */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Clinic Profile
          </h2>

          <div className="space-y-2">
            <Label>Clinic Name</Label>
            <Input value={clinic.name || ""} onChange={(e) => setField("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={clinic.address || ""} onChange={(e) => setField("address", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={clinic.phone || ""} onChange={(e) => setField("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={clinic.email || ""} onChange={(e) => setField("email", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>GST Number</Label>
            <Input value={clinic.gstNumber || ""} onChange={(e) => setField("gstNumber", e.target.value)} />
          </div>

          <div className="pt-2 border-t">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4" /> Working Hours
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Days</Label>
                <Input value={clinic.workingDays || ""} onChange={(e) => setField("workingDays", e.target.value)} placeholder="Mon-Sun" />
              </div>
              <div className="space-y-2">
                <Label>Open</Label>
                <Input value={clinic.openingTime || ""} onChange={(e) => setField("openingTime", e.target.value)} placeholder="09:00" />
              </div>
              <div className="space-y-2">
                <Label>Close</Label>
                <Input value={clinic.closingTime || ""} onChange={(e) => setField("closingTime", e.target.value)} placeholder="20:00" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>About / Info (parking, payments, etc.)</Label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px]"
              value={clinic.aboutInfo || ""}
              onChange={(e) => setField("aboutInfo", e.target.value)}
            />
          </div>

          <Button onClick={saveClinic} disabled={savingClinic}>
            {savingClinic ? "Saving..." : "Save Clinic Details"}
          </Button>
          <p className="text-xs text-muted-foreground">
            These details power the patient support agent's answers.
          </p>
        </Card>

        {/* RIGHT — services */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Services & Prices</h2>

          {/* Add new */}
          <div className="flex gap-2">
            <Input placeholder="Service name" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" />
            <Input placeholder="Price" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-24" />
            <Button size="icon" onClick={addService}><Plus className="h-4 w-4" /></Button>
          </div>

          {/* List */}
          <div className="border rounded-md divide-y">
            {services.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">No services yet.</div>
            ) : (
              services.map((s) => (
                <div key={s.id} className="flex items-center gap-2 p-2 text-sm">
                  {editId === s.id ? (
                    <>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 h-8" />
                      <Input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" className="w-20 h-8" />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveEdit(s.id)}><Check className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditId(null)}><X className="h-4 w-4" /></Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1">{s.name}</span>
                      <span className="text-muted-foreground">₹{Number(s.price).toLocaleString("en-IN")}</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(s)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => deleteService(s.id)}><Trash2 className="h-3 w-3" /></Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {services.length} service(s). The support agent quotes these prices to patients.
          </p>
        </Card>
      </div>
    </div>
  );
}
