"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Patient {
  id: string;
  patientCode: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  preferredLanguage: string;
  createdAt: string;
}

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatient() {
      try {
        const res = await fetch(`/api/patients/${id}`);
        const data = await res.json();
        if (data.success) setPatient(data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">Loading patient...</div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Patient not found</div>
        <Link href="/patients" className="text-emerald-400 text-sm mt-2 block">
          ← Back to patients
        </Link>
      </div>
    );
  }

  function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/patients" className="text-gray-400 hover:text-white text-sm">
          ← Back
        </Link>
      </div>

      {/* Patient Header Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-600/20 rounded-full flex items-center justify-center text-emerald-400 text-xl font-bold">
            {getInitials(patient.name)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{patient.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-emerald-400 text-xs font-mono bg-emerald-400/10 px-2 py-0.5 rounded">
                {patient.patientCode}
              </span>
              <span className="text-gray-400 text-sm">{patient.phone}</span>
              {patient.gender && (
                <span className="text-gray-400 text-sm">{patient.gender}</span>
              )}
              {patient.bloodGroup && (
                <span className="text-red-400 text-xs bg-red-400/10 px-2 py-0.5 rounded">
                  {patient.bloodGroup}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto">
            <span className="text-blue-400 text-xs bg-blue-400/10 px-3 py-1 rounded-full">
              {patient.preferredLanguage}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Contact Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Contact Information</h2>
          <div className="space-y-3">
            {[
              { label: "Phone", value: patient.phone },
              { label: "Email", value: patient.email || "—" },
              { label: "Address", value: patient.address || "—" },
              { label: "Emergency Contact", value: patient.emergencyContact || "—" },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-gray-500 text-xs">{item.label}</div>
                <div className="text-gray-200 text-sm mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Medical Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Medical Information</h2>
          <div className="space-y-3">
            <div>
              <div className="text-gray-500 text-xs">Medical History</div>
              <div className="text-gray-200 text-sm mt-0.5">
                {patient.medicalHistory || "None recorded"}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Allergies</div>
              <div className={`text-sm mt-0.5 ${patient.allergies ? "text-red-400" : "text-gray-200"}`}>
                {patient.allergies || "None recorded"}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Date of Birth</div>
              <div className="text-gray-200 text-sm mt-0.5">
                {patient.dateOfBirth
                  ? new Date(patient.dateOfBirth).toLocaleDateString("en-IN")
                  : "—"}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
