"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    medicalHistory: "",
    allergies: "",
    bloodGroup: "",
    emergencyContact: "",
    preferredLanguage: "ENGLISH",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        setLoading(false);
        return;
      }
      router.push("/patients");
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/patients" className="text-gray-400 hover:text-white text-sm">
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Add New Patient</h1>
          <p className="text-gray-400 text-sm">Fill in patient details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-6">

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">

              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Full Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Ravi Kumar"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Phone Number *</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="9876543210"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ravi@email.com"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleSelectChange}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={handleSelectChange}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Date of Birth</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Preferred Language</label>
                <select
                  name="preferredLanguage"
                  value={form.preferredLanguage}
                  onChange={handleSelectChange}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="ENGLISH">English</option>
                  <option value="TELUGU">Telugu</option>
                  <option value="HINDI">Hindi</option>
                  <option value="KANNADA">Kannada</option>
                  <option value="TAMIL">Tamil</option>
                </select>
              </div>

            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Medical Information</h2>
            <div className="space-y-4">

              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Jubilee Hills, Hyderabad"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Emergency Contact</label>
                <input
                  name="emergencyContact"
                  value={form.emergencyContact}
                  onChange={handleChange}
                  placeholder="Name: 9876543210"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Medical History</label>
                <textarea
                  name="medicalHistory"
                  value={form.medicalHistory}
                  onChange={handleTextChange}
                  placeholder="Diabetes, Hypertension..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Allergies</label>
                <textarea
                  name="allergies"
                  value={form.allergies}
                  onChange={handleTextChange}
                  placeholder="Penicillin, Latex..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Saving..." : "Save Patient"}
          </button>
          <Link
            href="/patients"
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
