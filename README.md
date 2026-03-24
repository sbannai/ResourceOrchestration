# Construction ERP - Enterprise SaaS Platform
> MERN Stack | Version 1.0.0 | Release: February 2026

## 🏗 Architecture Overview

```
construction-erp/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/          # DB, Logger, Swagger config
│   │   ├── controllers/     # Auth, Projects, Invoices, Tenants, Analytics
│   │   ├── middleware/       # JWT Auth, RBAC, Rate Limiting, Error Handler
│   │   ├── models/          # Tenant, User, Project, Invoice, JournalEntry
│   │   ├── routes/          # RESTful API routes
│   │   └── server.js        # Express app entry point
│   └── Dockerfile
├── frontend/                # React 18 SPA
│   ├── src/
│   │   ├── context/         # AuthContext (JWT + refresh tokens)
│   │   ├── pages/           # Dashboard, Projects, Invoices, Team, Settings
│   │   ├── services/        # Axios API service layer
│   │   └── App.js           # Router + Protected routes
│   └── Dockerfile
└── docker-compose.yml       # Full stack orchestration

```

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)
```bash
docker-compose up -d
# Frontend: http://localhost:3000
# API:      http://localhost:5000
# Swagger:  http://localhost:5000/api/docs
```

### Option 2: Local Development
```bash
# Backend
cd backend
cp .env.example .env          # Edit with your values
npm install
npm run dev                   # Runs on port 5000

# Frontend (separate terminal)
cd frontend
npm install
npm start                     # Runs on port 3000
```

## 🔑 Features Implemented

### Security (from Release Notes)
- ✅ JWT access + refresh tokens (15m / 7d expiry)
- ✅ RBAC: superadmin, tenant_admin, project_manager, engineer, accountant, viewer
- ✅ Tenant-based data isolation (every query scoped to tenantId)
- ✅ Helmet security headers
- ✅ API rate limiting (100 req/15min global, 10 req/15min auth)
- ✅ MongoDB sanitization (NoSQL injection prevention)

### Multi-Tenant SaaS
- ✅ Automated tenant provisioning (Provisioning → Active)
- ✅ Admin account initialization on tenant creation
- ✅ Feature flags per tenant (analytics, API access, etc.)
- ✅ Subscription plan management (starter, professional, enterprise)

### Project Management
- ✅ Full CRUD with pagination, filtering, search
- ✅ Project types: residential, commercial, infrastructure, industrial, renovation
- ✅ Milestones tracking with status
- ✅ Budget tracking & utilization
- ✅ Completion percentage with timeline tracking

### Financial Management
- ✅ Invoice creation with line items + tax calculations
- ✅ PDF invoice generation (PDFKit)
- ✅ Invoice lifecycle: draft → sent → paid / overdue
- ✅ Journal entry model (accounting foundation)
- ✅ Revenue recognition engine via analytics API

### Reporting & Analytics (KPI API)
- ✅ Project completion rate (KPI)
- ✅ Budget utilization per tenant
- ✅ Monthly revenue trend (6-month)
- ✅ Projects by status & type breakdown
- ✅ React dashboard with Chart.js integration

### Observability
- ✅ Winston structured JSON logging
- ✅ Log files: logs/combined.log, logs/error.log
- ✅ Swagger OpenAPI documentation at /api/docs
- ✅ Health check endpoint: GET /health

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register tenant + admin | No |
| POST | /api/auth/login | Login | No |
| POST | /api/auth/refresh-token | Refresh JWT | No |
| GET  | /api/auth/me | Current user | Yes |
| GET  | /api/projects | List projects (paginated) | Yes |
| POST | /api/projects | Create project | Admin/PM |
| GET  | /api/projects/kpis | Project KPI metrics | Yes |
| GET  | /api/projects/:id | Project details | Yes |
| PUT  | /api/projects/:id | Update project | Admin/PM |
| GET  | /api/invoices | List invoices | Yes |
| POST | /api/invoices | Create invoice | Admin/Acct |
| GET  | /api/invoices/:id/pdf | Generate PDF | Yes |
| GET  | /api/analytics/dashboard | Dashboard stats | Yes |
| GET  | /api/tenants/me | Tenant profile | Yes |
| GET  | /api/tenants/me/users | Tenant users | Admin |
| POST | /api/tenants/me/users | Invite user | Admin |
| POST | /api/tenants/provision | Provision tenant | Superadmin |

## 🗄 MongoDB Models

- **Tenant** - Multi-tenant SaaS entity (plan, billing, features, settings)
- **User** - RBAC users with refresh token management
- **Project** - Full construction project lifecycle
- **Invoice** - Billing with line items, PDF generation
- **JournalEntry** - Double-entry accounting foundation

## 🔜 Next Phase (from Release Notes)
- Stripe webhook-driven subscription automation
- Kafka event streaming (scaffolded, needs wiring)  
- OpenTelemetry distributed tracing
- Advanced P&L and Balance Sheet reporting
- SOC2 audit evidence automation
- Multi-region deployment
