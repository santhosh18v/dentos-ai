"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChatWidget } from "@/components/support/chat-widget";

const DEMO_PATIENT_ID = "cmqkewjsj00004z11dtco7xw6";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "▪" },
  { label: "Patients", href: "/patients", icon: "▪" },
  { label: "Appointments", href: "/appointments", icon: "▪" },
  { label: "Clinical Notes", href: "/clinical-notes", icon: "▪" },
  { label: "Voice Assistant", href: "/voice-assistant", icon: "▪" },
  { label: "Billing", href: "/billing", icon: "▪" },
  { label: "Analytics", href: "/analytics", icon: "▪" },
  { label: "Settings", href: "/settings", icon: "▪" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-sm">
              🦷
            </div>
            <div>
              <div className="text-white font-semibold text-sm">DentOS AI</div>
              <div className="text-gray-500 text-xs">SmileCare Clinic</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? "bg-emerald-600/20 text-emerald-400 font-medium"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600/20 rounded-full flex items-center justify-center text-emerald-400 text-xs font-medium">
              DS
            </div>
            <div>
              <div className="text-white text-xs font-medium">Dr. Sharma</div>
              <div className="text-gray-500 text-xs">Clinic Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-56 flex-1 p-6 bg-gray-950">
        {children}
      </main>
      <ChatWidget patientId={DEMO_PATIENT_ID} />
    </div>
  );
}
