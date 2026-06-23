import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChatWidget } from "@/components/support/chat-widget";
import { MapPin, Clock, Phone, MessageCircle } from "lucide-react";

// PUBLIC clinic page — no login. Patients land here (from search, a link, a QR code)
// to see clinic info and ask the assistant questions. Identified by slug in the URL.
export default async function PublicClinicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: {
      id: true, name: true, address: true, phone: true, whatsappNumber: true,
      workingDays: true, openingTime: true, closingTime: true, aboutInfo: true,
    },
  });

  if (!clinic) notFound();

  const services = await prisma.clinicService.findMany({
    where: { clinicId: clinic.id, isActive: true },
    orderBy: { name: "asc" },
  });

  // Live open/closed status
  const now = new Date();
  const [oh, om] = (clinic.openingTime || "09:00").split(":").map(Number);
  const [ch, cm] = (clinic.closingTime || "20:00").split(":").map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  const isOpen = mins >= oh * 60 + (om || 0) && mins < ch * 60 + (cm || 0);

  const waLink = clinic.whatsappNumber
    ? `https://wa.me/${clinic.whatsappNumber.replace(/[^\d]/g, "")}`
    : null;

  return (
    <div className="min-h-screen bg-[#f7f9f8] text-slate-800">
      {/* Header */}
      <header className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
        <div className="max-w-2xl mx-auto px-5 py-10">
          <div className="flex items-center gap-2 text-emerald-100 text-sm mb-2">
            <span className="text-lg">🦷</span> DentOS AI
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{clinic.name}</h1>
          {clinic.aboutInfo && (
            <p className="mt-2 text-emerald-50/90">{clinic.aboutInfo}</p>
          )}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
            <span className={`h-2 w-2 rounded-full ${isOpen ? "bg-green-300" : "bg-red-300"}`} />
            {isOpen ? "Open now" : "Closed now"}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        {/* Info cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <Clock className="h-4 w-4" /> <span className="font-medium">Hours</span>
            </div>
            <p className="text-sm text-slate-600">
              {clinic.workingDays || "Mon–Sun"}<br />
              {clinic.openingTime || "09:00"} – {clinic.closingTime || "20:00"}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <MapPin className="h-4 w-4" /> <span className="font-medium">Location</span>
            </div>
            <p className="text-sm text-slate-600">{clinic.address || "Address on request"}</p>
          </div>
        </div>

        {/* Contact row */}
        <div className="flex flex-wrap gap-3">
          {clinic.phone && (
            <a href={`tel:${clinic.phone.replace(/\s/g, "")}`}
               className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium shadow-sm border border-slate-100 hover:border-emerald-200">
              <Phone className="h-4 w-4 text-emerald-600" /> Call
            </a>
          )}
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-emerald-500">
              <MessageCircle className="h-4 w-4" /> WhatsApp us
            </a>
          )}
        </div>

        {/* Services & prices */}
        {services.length > 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-slate-800 mb-3">Treatments & Prices</h2>
            <div className="divide-y divide-slate-100">
              {services.map((s) => (
                <div key={s.id} className="flex justify-between py-2.5 text-sm">
                  <span className="text-slate-700">{s.name}</span>
                  <span className="text-slate-900 font-medium">₹{Number(s.price).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 pt-4">
          Have a question? Tap the chat button to ask our assistant.
        </p>
      </main>

      {/* Public chat widget — web channel, no patient context */}
      <ChatWidget clinicId={clinic.id} channel="web" />
    </div>
  );
}
