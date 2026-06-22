"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChatWidget } from "@/components/support/chat-widget";
import { LogOut } from "lucide-react";

const DEMO_PATIENT_ID = "cmqkewjsj00004z11dtco7xw6";

const ALL = ["CLINIC_ADMIN", "DENTIST", "RECEPTIONIST"];
const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "▪", roles: ALL },
  { label: "Patients", href: "/patients", icon: "▪", roles: ALL },
  { label: "Appointments", href: "/appointments", icon: "▪", roles: ALL },
  { label: "Clinical Notes", href: "/clinical-notes", icon: "▪", roles: ["CLINIC_ADMIN", "DENTIST"] },
  { label: "Voice Assistant", href: "/voice-assistant", icon: "▪", roles: ALL },
  { label: "Billing", href: "/billing", icon: "▪", roles: ["CLINIC_ADMIN", "RECEPTIONIST"] },
  { label: "Analytics", href: "/analytics", icon: "▪", roles: ALL },
  { label: "Settings", href: "/settings", icon: "▪", roles: ["CLINIC_ADMIN", "RECEPTIONIST"] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState("CLINIC_ADMIN");
  const [userName, setUserName] = useState("Dr. Sharma");
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    // If the page is restored from bfcache (browser Back after logout),
    // re-check that the auth cookie still exists; if not, bounce to login.
    const onPageShow = () => {
      const hasToken = document.cookie.split("; ").some((x) => x.startsWith("access_token="));
      if (!hasToken) window.location.replace("/login");
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    const c = document.cookie.split("; ").find((x) => x.startsWith("user_role="));
    if (c) setUserRole(c.split("=")[1]);
    const n = document.cookie.split("; ").find((x) => x.startsWith("user_name="));
    if (n) setUserName(decodeURIComponent(n.split("=")[1]));
  }, []);

  const visibleNav = navItems.filter((item) => item.roles.includes(userRole));

  // Derive avatar initials from the name: "Dr. Anjali Rao" -> "AR", "Priya Reception" -> "PR"
  const initials = (() => {
    const stripped = userName.replace(/^Dr\.?\s+/i, "").split(/\s+/).filter(Boolean);
    // If stripping "Dr." leaves 2+ words (e.g. "Dr. Anjali Rao" -> Anjali, Rao), use those.
    // If it leaves only one (e.g. "Dr. Sharma" -> Sharma), keep the title so we get "DS".
    const words = stripped.length >= 2 ? stripped : userName.split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
  })();
  const ROLE_LABEL: Record<string, string> = {
    CLINIC_ADMIN: "Clinic Admin",
    DENTIST: "Doctor",
    RECEPTIONIST: "Receptionist",
  };

  function handleLogout() {
    // Clear the auth cookie and hard-redirect to login (proxy + guard see no cookie)
    document.cookie = "access_token=; path=/; max-age=0";
    document.cookie = "user_role=; path=/; max-age=0";
    document.cookie = "user_name=; path=/; max-age=0";
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full">
        {/* Logo */}
        <Link href="/dashboard" className="block px-4 py-5 border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex-shrink-0">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-sm" />
              <div className="relative w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-base shadow-lg">
                🦷
              </div>
            </div>
            <div>
              <div className="text-sm font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent tracking-tight">
                DentOS AI
              </div>
              <div className="text-gray-500 text-[10px] tracking-wide uppercase">
                SmileCare Clinic
              </div>
            </div>
          </div>
        </Link>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {visibleNav.map((item) => (
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
              {initials || "?"}
            </div>
            <div>
              <div className="text-white text-xs font-medium">{userName}</div>
              <div className="text-gray-500 text-xs">{ROLE_LABEL[userRole] || userRole}</div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-3 pt-3">
            <button
              onClick={() => setConfirmLogout(true)}
              className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg px-3 py-2 transition-colors group"
            >
              <LogOut className="h-3.5 w-3.5 group-hover:text-red-400" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-56 flex-1 p-6 bg-gray-950">
        {children}
      </main>
      <ChatWidget patientId={DEMO_PATIENT_ID} />
      {/* Sign out confirmation modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmLogout(false)}
          />
          {/* Modal */}
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <LogOut className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Sign out?</h2>
                <p className="text-gray-400 text-sm mt-1">
                  You will be returned to the login screen.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white bg-red-600 hover:bg-red-500 transition-colors"
                >
                  Yes, sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
