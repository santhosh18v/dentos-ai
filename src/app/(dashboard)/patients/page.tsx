"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Patient {
  id: string;
  patientCode: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  bloodGroup?: string;
  preferredLanguage: string;
  createdAt: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, [search]);

  async function fetchPatients() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/patients?search=${search}&clinicId=clinic001`
      );
      const data = await res.json();
      if (data.success) setPatients(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Patients</h1>
          <p className="text-gray-400 text-sm mt-1">
            {patients.length} patients registered
          </p>
        </div>
        <Link
          href="/patients/new"
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Patient
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-gray-500"
        />
      </div>

      {/* Patient Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Loading patients...
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-4xl mb-3">👤</div>
            <div className="text-gray-400 font-medium">No patients found</div>
            <div className="text-gray-500 text-sm mt-1">
              {search ? "Try a different search" : "Add your first patient"}
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">
                  PATIENT
                </th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">
                  CODE
                </th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">
                  PHONE
                </th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">
                  GENDER
                </th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">
                  LANGUAGE
                </th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-600/20 rounded-full flex items-center justify-center text-emerald-400 text-xs font-bold">
                        {getInitials(patient.name)}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">
                          {patient.name}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {patient.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-emerald-400 text-xs font-mono bg-emerald-400/10 px-2 py-0.5 rounded">
                      {patient.patientCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {patient.phone}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {patient.gender || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                      {patient.preferredLanguage}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/patients/${patient.id}`}
                      className="text-emerald-400 hover:text-emerald-300 text-xs"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
