<div align="center">

# 🦷 DentOS AI

### AI-Powered Dental Clinic Management System

*Helping dental clinics manage patients, appointments, billing, and AI-assisted clinical workflows — all in one place.*

![Status](https://img.shields.io/badge/status-MVP-blue)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## 📋 Overview

**DentOS AI** is a modern, cloud-based clinic management system built specifically for dental practices. It brings patient records, appointments, billing, and clinical documentation into one simple, secure place that a clinic's team can access from any device.

It is a **multi-tenant** application — each clinic gets its own fully isolated data — with **role-based access** for admins, dentists, and receptionists.

> ⚠️ **This is an MVP (Minimum Viable Product).** It is being built to validate real-world dental workflows with practising dentists before advanced AI features are expanded. Some AI capabilities are live today; others are on the roadmap (clearly marked below).

---

## ✨ Features

### ✅ Available Today

| Feature | Description |
|---|---|
| 👥 **Patient Management** | Add patients, view complete history, and search instantly by name or phone. |
| 📅 **Appointment Scheduling** | Book appointments by patient, dentist, treatment, and time slot with status tracking. |
| 💰 **Billing & Invoicing** | Generate invoices with automatic GST calculation and track full/partial payments. |
| 📝 **Clinical Notes** | Create structured clinical notes with a clear review-and-approve workflow. |
| 🎙️ **AI Clinical Dictation** | Dentist speaks naturally → AI transcribes and structures the note → dentist reviews & approves. |
| 📊 **Analytics Dashboard** | Revenue trends, appointment statistics, and clinic insights at a glance. |
| ⚙️ **Clinic Settings** | Manage clinic profile, working hours, and services. |
| 🔒 **Security & Access** | Secure login, role-based access, and clinic-level data isolation. |

### 🚧 On the Roadmap (Planned)

| Feature | Description |
|---|---|
| 📞 **AI Phone Assistant** | Automated appointment reminder calls in the patient's language. |
| 💬 **AI WhatsApp Assistant** | Patient queries, appointment booking, and clinic info over WhatsApp. |
| 📄 **AI Treatment Summary** | Rewrites clinical notes into patient-friendly, plain-language explanations. |

---

## 🤖 The AI: Clinical Dictation

The flagship feature turns a dentist's voice into a structured clinical note using a two-stage AI pipeline, with a human always in the loop.

```
🎙️  Doctor speaks   →   📝 Speech-to-text   →   🧠 AI structures   →   👀 Doctor reviews   →   ✅ Save
        (audio)            (Whisper)              (Qwen3)              (edit if needed)      (to database)
```

- **Stage 1 — Speech-to-text (Whisper):** converts spoken audio into raw text.
- **Stage 2 — Structuring (Qwen3 LLM):** organises the raw transcript into proper clinical sections — chief complaint, history, examination, diagnosis, and treatment plan.
- **Human-in-the-loop:** the AI only ever produces a *draft*. Nothing is saved until the dentist reviews and approves it — essential for accuracy and trust in a medical setting.

> 🔐 The AI models run **locally**, so patient audio and notes are not sent to any third-party cloud service.

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js](https://nextjs.org/)** — React framework for UI and API in a single codebase
- **[TypeScript](https://www.typescriptlang.org/)** — type safety across a data-heavy application
- **[Tailwind CSS](https://tailwindcss.com/)** — utility-first styling for a consistent, modern look
- **[Recharts](https://recharts.org/)** — analytics charts and data visualisation

### Backend
- **Next.js API Routes (Node.js)** — REST API endpoints for all clinic operations
- **[PostgreSQL](https://www.postgresql.org/)** — reliable relational database for interconnected clinic data
- **[Prisma](https://www.prisma.io/)** — type-safe ORM with schema migrations

### Authentication & Security
- **JWT (JSON Web Tokens)** — stateless, role-based authentication
- **bcrypt** — industry-standard password hashing
- **Multi-tenant architecture** — every query scoped to the authenticated user's clinic

### AI Layer
- **[Whisper](https://openai.com/research/whisper)** — local speech-to-text
- **[Qwen3](https://github.com/QwenLM/Qwen) via [Ollama](https://ollama.com/)** — local LLM for structuring notes
- **[FastAPI](https://fastapi.tiangolo.com/)** — lightweight Python service wrapping the AI models

### Deployment
- **Cloud hosting** with a **managed PostgreSQL** database
- **Continuous deployment** from GitHub on every push

---

## 🏗️ Architecture

DentOS AI separates the AI into its own service, keeping the main application a clean TypeScript codebase.

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│                 │  HTTP   │                      │  Prisma │                 │
│   Browser (UI)  │ ──────► │   Next.js App        │ ──────► │   PostgreSQL    │
│   Next.js/React │ ◄────── │   (UI + REST API)    │ ◄────── │   Database      │
│                 │  JSON   │   JWT auth           │         │                 │
└─────────────────┘         └──────────┬───────────┘         └─────────────────┘
                                       │
                                       │ HTTP (audio → structured note)
                                       ▼
                            ┌──────────────────────┐
                            │  AI Service (Python)  │
                            │  FastAPI              │
                            │  • Whisper (STT)      │
                            │  • Qwen3 (LLM)        │
                            └──────────────────────┘
```

**Why a separate AI service?** The mature speech and LLM libraries are Python-based, while the main app is TypeScript. Isolating the AI keeps each codebase clean and lets the AI layer scale or be swapped independently — a clear separation of concerns.

---

## 🗺️ Roadmap

- [x] **Phase 1 — Core Clinic Management** — patients, appointments, billing, notes, analytics
- [x] **Phase 2 — Cloud Deployment** — live and accessible to clinics
- [x] **Phase 3 — AI Clinical Dictation** — voice-to-structured-note (live)
- [ ] **Phase 4 — AI Voice Assistant** — automated appointment reminder calls
- [ ] **Phase 5 — WhatsApp AI** — patient queries and booking over WhatsApp

---

## 👨‍💻 Author

**Santhosh Reddy**

Building DentOS AI to explore how AI can give dentists their time back — not replace them, but remove the paperwork so they can focus on patients.

---

<div align="center">

*DentOS AI is currently an MVP under active development. Feedback from dental professionals directly shapes what gets built next.*

</div>
