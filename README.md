<div align="center">

# 🏢 Harmony HR Suite | نظام الموارد البشرية

### منصة SaaS متكاملة لإدارة الموارد البشرية مصممة خصيصاً لمنطقة الشرق الأوسط وشمال أفريقيا

**A comprehensive, production-grade HR Management SaaS platform designed for the MENA region**

[![Built with React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[🐛 Report Bug](https://github.com/shadow1t/harmony-hr-suite/issues) · [✨ Request Feature](https://github.com/shadow1t/harmony-hr-suite/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Harmony HR Suite** is a fully bilingual (Arabic/English) HR Management platform built to address the gap in the MENA market for modern, open-source HR solutions. Unlike global HR tools, this platform is designed **Arabic-first** with native **RTL support**, regional labor law compliance, and full localization.

### Why This Project?

| Problem | Our Solution |
|---------|-------------|
| Most HR systems lack Arabic support | Native bilingual architecture (AR/EN) |
| No RTL-first HR platforms | Built from ground up with RTL support |
| Regional compliance gaps | Localized business logic and tracking |
| Expensive enterprise solutions | Open-source with tiered pricing ready |
| Data isolation concerns | Row-Level Security (RLS) per tenant |

---

## ✨ Key Features

### 🌍 Localization & Accessibility
- **Full Bilingual Support** — Arabic & English with instant language switching
- **RTL/LTR Native** — Seamless right-to-left and left-to-right layout switching
- **Bilingual Database** — All entities support `name_ar`/`name_en` fields

### 👥 Employee Management
- Complete employee profiles with personal & professional data
- Contract management (Full-time, Part-time, Contract, Temporary)
- Document tracking with expiry notifications
- Multi-branch employee assignment

### ⏰ Attendance & Time Tracking
- Daily check-in/check-out tracking
- Attendance status management (Present, Absent, Late, Excused)
- Monthly attendance reports & analytics

### 🏖️ Leave Management
- **6 Leave Types**: Annual, Sick, Emergency, Unpaid, Maternity, Paternity
- Leave balance tracking per employee per year
- Multi-level approval workflows

### 💰 Payroll Processing
- Salary calculation with configurable components: Basic, Allowances, Overtime
- Social insurance deductions
- Monthly payslip generation and workflow tracking

### 💳 Loans & Advances
- Loan request and approval workflow
- Installment tracking with monthly auto-deductions

### 📢 Recruitment & Training
- Job posting management with department linkage
- Application tracking
- Course creation and employee enrollment tracking

### 📊 Performance Evaluations
- Evaluation cycle management
- Self-assessment capabilities
- Manager scoring and comments

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI Framework |
| **Build Tool** | Vite 5 | Fast HMR & bundling |
| **Styling** | Tailwind CSS + shadcn/ui | Design system |
| **State Management** | TanStack Query v5 | Server state & caching |
| **Routing** | React Router v6 | Client-side routing |
| **Backend** | Supabase | Auth, Database, Edge Functions |
| **Database** | PostgreSQL | Primary data store |

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                  │
│  ┌───────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │   Pages   │ │Components│ │   Hooks & Context  │  │
│  │  (Views)  │ │   (UI)   │ │  (State & Logic)   │  │
│  └─────┬─────┘ └────┬─────┘ └─────────┬──────────┘  │
│        └─────────────┼─────────────────┘            │
│                      │                              │
│              ┌───────▼───────┐                      │
│              │ Supabase SDK  │                      │
│              └───────┬───────┘                      │
└──────────────────────┼──────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────┐
│               Supabase Backend                      │
│  ┌───────────┐ ┌─────▼─────┐ ┌────────────────┐     │
│  │   Auth    │ │ PostgreSQL │ │ Edge Functions  │     │
│  │  (JWT)    │ │   + RLS    │ │  (Serverless)   │     │
│  └───────────┘ └───────────┘ └────────────────┘     │
└─────────────────────────────────────────────────────┘
```

### Multi-Tenant Data Flow
```
User Request → Auth (JWT) → RLS Policy Check → company_id Filter → Data
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0
- **npm** or **bun** package manager
- **Supabase** account (for backend)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/shadow1t/harmony-hr-suite.git

# 2. Navigate to the project directory
cd harmony-hr-suite

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 5. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔒 Security

### Authentication & Authorization
- **JWT-based authentication** via Supabase Auth
- **Role-Based Access Control (RBAC)** (Admin, HR Manager, Manager, Employee)

### Data Isolation
- **Row-Level Security (RLS)** on all tables
- Tenant isolation via `company_id` filtering
- Security-definer functions to prevent recursive RLS checks

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch
3. **Commit** your changes
4. **Push** to the branch
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for the MENA region**

</div>
