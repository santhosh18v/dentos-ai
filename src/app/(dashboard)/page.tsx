export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Good morning, Dr. Sharma</h1>
        <p className="text-gray-400 text-sm mt-1">SmileCare Dental Clinic · Wednesday, 18 June 2026</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Patients", value: "1,284", change: "+18 this month", color: "text-emerald-400" },
          { label: "Today's Appointments", value: "14", change: "9 confirmed · 5 pending", color: "text-blue-400" },
          { label: "Monthly Revenue", value: "₹2.4L", change: "+12% vs last month", color: "text-amber-400" },
          { label: "Pending Payments", value: "₹38,500", change: "7 invoices overdue", color: "text-red-400" },
        ].map((card) => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-gray-400 text-xs mb-2">{card.label}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-gray-500 text-xs mt-1">{card.change}</div>
          </div>
        ))}
      </div>

      {/* Appointments Today */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Today's Appointments</h2>
        <div className="space-y-3">
          {[
            { name: "Ravi Kumar", treatment: "Root Canal", time: "10:00 AM", status: "Confirmed", statusColor: "text-emerald-400 bg-emerald-400/10" },
            { name: "Priya Devi", treatment: "Scaling & Polish", time: "11:30 AM", status: "Confirmed", statusColor: "text-emerald-400 bg-emerald-400/10" },
            { name: "Arjun Varma", treatment: "Crown Fitting", time: "2:00 PM", status: "Pending", statusColor: "text-amber-400 bg-amber-400/10" },
            { name: "Sunita Srinivas", treatment: "Consultation", time: "3:30 PM", status: "Pending", statusColor: "text-amber-400 bg-amber-400/10" },
          ].map((apt) => (
            <div key={apt.name} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
              <div className="w-8 h-8 bg-emerald-600/20 rounded-full flex items-center justify-center text-emerald-400 text-xs font-medium">
                {apt.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{apt.name}</div>
                <div className="text-gray-400 text-xs">{apt.treatment}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-xs">{apt.time}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${apt.statusColor}`}>
                  {apt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
