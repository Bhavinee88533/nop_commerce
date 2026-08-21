﻿# 🛒 nopCommerce — Enhanced E-Commerce Platform
### EPAM Systems · Project-Based Education (PBE) · Team 7

> *Extending the open-source nopCommerce (.NET) platform with production-grade features, built by a cross-functional team following real-world Agile/Scrum practices.*

---

## 🧭 Quick Navigation

- [What We're Building](#-what-were-building)
- [Tech Stack](#-tech-stack)
- [Team](#-team)
- [Sprint Roadmap](#-sprint-roadmap)
- [Feature Highlights](#-feature-highlights)
- [Project Infrastructure](#-project-infrastructure)
- [Documentation Hub](#-documentation-hub)

---

## 🎯 What We're Building

This is not just another tutorial project. As part of the **EPAM Systems Project-Based Education** program, our team of 10 operates like a real product delivery team — owning a backlog, running sprint ceremonies, reviewing each other's code, and shipping working software every two weeks.

We picked up the battle-tested **nopCommerce** open-source platform and are layering on a series of ambitious, real-world features — from OTP-based login flows to a full **Rider Delivery Agent** system built from scratch, an AI-powered customer support bot, and seamless payment gateway integration.

**Platform Base:** nopCommerce (ASP.NET Core)  
**Repository:** [epm-icmp/jan2026/dotnet/team7/nop_commerce-team-7](https://githyd.epam.com/epm-icmp/jan2026/dotnet/team7/nop_commerce-team-7)  
**Project Board:** [Jira — EPMICMPNOP · Agile Board](https://jiraeu.epam.com/secure/RapidBoard.jspa?rapidView=344759&projectKey=EPMICMPNOP&view=planning.nodetail&issueLimit=100#)  
**Methodology:** Agile · Scrum · 2-week sprints

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core (.NET), C# |
| Frontend | Angular |
| CI/CD | Jenkins |
| Code Quality | SonarQube |
| Cloud | Microsoft Azure |
| Version Control | GitLab |
| Project Tracking | Jira |
| Auth | OTP-based (custom implementation) |
| Payments | Payment Gateway Integration (Sprint 4) |
| AI / Bot | Customer Support Chatbot (Sprint 3) |

---

## 👥 Team

| Role | Members |
|---|---|
| 👨‍💻 Junior Developers | 8 |
| 🧪 Testers (QA) | 2 |
| **Total** | **10** |

We follow **Scrum** with bi-weekly sprints, daily standups, sprint planning, reviews, and retrospectives.

---

## 🗓 Sprint Roadmap

```
◉ Sprint 0   ──────────────────────────────────────── ✅ COMPLETED
│  └─ Jenkins CI/CD setup
│  └─ SonarQube integration
│  └─ Azure environment provisioning
│  └─ GitLab repo & branching strategy
│  └─ Jira board + backlog grooming
│
◉ Sprint 1   ──────────────────────────────────────── 🔜 PLANNED
│  └─ OTP-Based Authentication
│  └─ App Theming & UI Styling overhaul
│
◉ Sprint 2   ──────────────────────────────────────── 🔜 UPCOMING
│  └─ Rider (Delivery Agent) Module — built from scratch
│     ├─ Agent registration & onboarding
│     ├─ Order assignment & tracking
│     └─ Delivery status updates
│
◉ Sprint 3   ──────────────────────────────────────── 🔜 UPCOMING
│  └─ Customer Support Chatbot (AI-powered)
│  └─ Azure Production Deployment
│  └─ AI Product Search (intelligent search layer)
│
◉ Sprint 4   ──────────────────────────────────────── 🔜 UPCOMING
   └─ Payment Gateway Integration
   └─ End-to-end testing & release prep
```

---

## ✨ Feature Highlights

### 🔐 OTP-Based Authentication *(Sprint 1)*
Replacing standard password login with a secure one-time-password flow — SMS/email based verification to enhance account security for customers.

### 🎨 App Theming & Styling *(Sprint 1)*
A complete UI refresh — custom theme variables, redesigned component library, improved mobile responsiveness, and a consistent design language across the storefront.

### 🏍 Rider Delivery Agent System *(Sprint 2)*
A greenfield module built from scratch on top of nopCommerce:
- Agent signup, profile, and availability management
- Real-time order assignment engine
- Live delivery status tracking for customers
- Admin dashboard for fleet visibility

### 🤖 Customer Support Bot *(Sprint 3)*
An AI-powered chatbot embedded into the storefront to handle FAQs, order status queries, and escalation flows — reducing manual support load.

### ☁️ Azure Deployment *(Sprint 3)*
Migrating from a dev environment to a fully configured Azure deployment with environment-specific configs, secrets management, and monitoring.

### 💳 Payment Gateway *(Sprint 4)*
Integrating a production-ready payment gateway with support for multiple payment methods, secure tokenization, and order confirmation flows.


---

## 🏗 Project Infrastructure

```
Development Workflow
─────────────────────────────────────────────
  Code Push (GitLab)
       │
       ▼
  Jenkins Pipeline ──► SonarQube Analysis
       │                    │
       │              (Quality Gate)
       ▼
  Build & Test
       │
       ▼
  Azure Deployment
       │
       ▼
  Staging / Production Environment
```

**Branching Strategy:** Feature branches off `develop`, PRs reviewed before merge, `main` is production-only.

**Code Quality Gates:** SonarQube enforces coverage thresholds and code smell limits on every PR.

---

## 📚 Documentation Hub

| Document | Description |
|---|---|
| 🛠️ Project Setup & Tech Stack | Environment setup, toolchain, prerequisites |
| 📋 Epics & User Stories | Full backlog with acceptance criteria |
| 🌿 Git Branching Strategy | Branch naming, PR rules, merge policy |
| 📝 Coding Standards | C# conventions, linting rules, review checklist |
| ✅ Definition of Ready & Done | Sprint entry/exit criteria |
| 🚀 CI/CD Pipeline | Jenkins config, pipeline stages, deployment flow |

> 📌 All documentation is maintained in the project wiki and linked from the Jira board.

---

## 🚦 Project Status

| Sprint | Theme | Status |
|---|---|---|
| Sprint 0 | Setup & Infrastructure | ✅ Done |
| Sprint 1 | Auth + UI | 🔜 Planned |
| Sprint 2 | Rider Delivery Module | 🔜 Planned |
| Sprint 3 | Bot + AI + Azure Deploy | 🔜 Planned |
| Sprint 4 | Payments + Release | 🔜 Planned |

---

<div align="center">

**Built with 💙 by Team 7 · EPAM Systems PBE Program**

*Learning by shipping. Iterating by doing.*

</div>
