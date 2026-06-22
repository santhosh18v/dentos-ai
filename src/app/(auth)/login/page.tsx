"use client";

import { useState, useEffect } from "react";

type Role = "DOCTOR" | "RECEPTIONIST" | "ADMIN";

const ROLES: { id: Role; label: string; icon: string; description: string }[] = [
  { id: "DOCTOR", label: "Doctor", icon: "🩺", description: "Clinical access" },
  { id: "RECEPTIONIST", label: "Receptionist", icon: "📋", description: "Front desk" },
  { id: "ADMIN", label: "Admin", icon: "⚙️", description: "Full access" },
];

const ROLE_PLACEHOLDERS: Record<Role, string> = {
  DOCTOR: "doctor@smilecare.com",
  RECEPTIONIST: "reception@smilecare.com",
  ADMIN: "admin@smilecare.com",
};

const ROLE_WELCOME: Record<Role, string> = {
  DOCTOR: "Welcome, Doctor",
  RECEPTIONIST: "Welcome back",
  ADMIN: "Admin login",
};

export default function LoginPage() {
  const [role, setRole] = useState<Role>("ADMIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated, bounce to dashboard (fixes Back button)
  useEffect(() => {
    if (document.cookie.split("; ").some((c) => c.startsWith("access_token="))) {
      window.location.replace("/");
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.error);
        setLoading(false);
        return;
      }
      document.cookie = `access_token=${data.data.accessToken}; path=/; max-age=900`;
      const roleMap: Record<string, string> = { DOCTOR: "DENTIST", RECEPTIONIST: "RECEPTIONIST", ADMIN: "CLINIC_ADMIN" };
      document.cookie = `user_role=${roleMap[role] || "CLINIC_ADMIN"}; path=/; max-age=900`;
      document.cookie = `user_name=${encodeURIComponent(data.data.user.name)}; path=/; max-age=900`;
      // Hard navigation so proxy sees the cookie immediately (no flash)
      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-xl mb-4">
          <span className="text-white text-xl">🦷</span>
        </div>
        <h1 className="text-2xl font-bold text-white">DentOS AI</h1>
        <p className="text-gray-400 text-sm mt-1">SmileCare Dental Clinic</p>
      </div>

      {/* Role selector */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => { setRole(r.id); setError(""); }}
            className={`flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 border text-sm transition-all ${
              role === r.id
                ? "bg-emerald-600/20 border-emerald-500 text-white"
                : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="text-xl">{r.icon}</span>
            <span className="font-medium">{r.label}</span>
            <span className="text-[10px] opacity-70">{r.description}</span>
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <h2 className="text-lg font-semibold text-white mb-6">
          {ROLE_WELCOME[role]}
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={ROLE_PLACEHOLDERS[role]}
              required
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-gray-600"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? "Signing in..." : `Sign in as ${ROLES.find(r => r.id === role)?.label}`}
          </button>
        </form>
      </div>

      <p className="text-center text-gray-600 text-xs mt-6">
        DentOS AI — AI-Powered Dental Clinic OS
      </p>
    </div>
  );
}
