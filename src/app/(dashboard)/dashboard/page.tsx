export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Good morning, Dr. Sharma</h1>
        <p className="text-gray-400 text-sm mt-1">SmileCare Dental Clinic · Wednesday, 18 June 2026</p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Patients", value: "1,284", color: "text-emerald-400" },
          { label: "Today's Appointments", value: "14", color: "text-blue-400" },
          { label: "Monthly Revenue", value: "₹2.4L", color: "text-amber-400" },
          { label: "Pending Payments", value: "₹38,500", color: "text-red-400" },
        ].map((card) => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-gray-400 text-xs mb-2">{card.label}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Today's Appointments</h2>
        {[
          { name: "Ravi Kumar", treatment: "Root Canal", time: "10:00 AM", status: "Confirmed" },
          { name: "Priya Devi", treatment: "Scaling & Polish", time: "11:30 AM", status: "Confirmed" },
          { name: "Arjun Varma", treatment: "Crown Fitting", time: "2:00 PM", status: "Pending" },
        ].map((apt) => (
          <div key={apt.name} className="flex items-center gap-3 py-3 border-b border-gray-800 last:border-0">
            <div className="w-8 h-8 bg-emerald-600/20 rounded-full flex items-center justify-center text-emerald-400 text-xs font-bold">
              {apt.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1">
              <div className="text-white text-sm">{apt.name}</div>
              <div className="text-gray-400 text-xs">{apt.treatment}</div>
            </div>
            <div className="text-gray-400 text-xs">{apt.time}</div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${apt.status === "Confirmed" ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10"}`}>
              {apt.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
