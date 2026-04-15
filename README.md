# HabitFlow

A full-stack habit-tracking application built with **Next.js** (frontend) and **Fastify + MongoDB** (backend), featuring RBAC, LDAP authentication, and a full admin dashboard.

---

## Project Structure

```
habitflow-backend/
├── backend/                  # Fastify REST API (Node.js)
│   ├── server.js             # Entry point
│   ├── package.json
│   ├── Dockerfile
│   ├── .env.example
│   ├── scripts/              # One-off admin utilities
│   └── src/
│       ├── config/           # Database & LDAP connection
│       ├── middlewares/      # JWT auth + RBAC decorators
│       ├── models/           # 10 Mongoose schemas
│       ├── controllers/      # Business logic (11 controllers)
│       ├── routes/           # Thin API route wiring (11 files)
│       └── utils/            # Normalization helpers & seed scripts
│
├── frontend/                 # Next.js 14 App Router
│   ├── app/                  # Pages (admin dashboard, dashboard, login, signup)
│   ├── components/           # Shared React components
│   ├── lib/                  # Backward-compat re-exports
│   └── src/
│       ├── services/         # API fetch wrapper & auth token helpers
│       └── types/            # TypeScript interfaces
│
├── docker/                   # LDAP seed files
├── docker-compose.yml        # MongoDB + OpenLDAP + phpLDAPadmin + backend
└── README.md
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tabler Icons |
| Backend | Fastify 5, Node.js 20 |
| Database | MongoDB (Mongoose) |
| Auth | JWT (`@fastify/jwt`) + RBAC permissions |
| LDAP | OpenLDAP via `ldapjs` |
| DevOps | Docker, docker-compose |

---

## Getting Started

### Option 1 — Docker (full stack)

```bash
docker-compose up -d --build
```

| Service | URL |
|---|---|
| Backend API | http://localhost:5000 |
| Frontend | http://localhost:3000 (run separately) |
| MongoDB | mongodb://localhost:27017 |
| phpLDAPadmin | http://localhost:8080 |

LDAP admin: `cn=admin,dc=habitflow,dc=local` / `admin`

---

### Option 2 — Local Development

**Backend:**
```bash
cd backend
cp .env.example .env        # configure MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev                 # starts on port 5000 with nodemon
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev                 # starts on port 3000
```

---

## Authentication

### Local (MongoDB)
```bash
POST /register   { nom, prenom, email, mot_de_passe }
POST /login      { email, mot_de_passe }
```

### LDAP
```bash
POST /login/ldap { email, mot_de_passe }
```

**Seeded LDAP users** (password: `Test123!`):
- `admin@habitflow.local` → `Admin123!` (admin role)
- `ali.ben@habitflow.local`, `sara.kim@habitflow.local`, `omar.said@habitflow.local`
- `lina.martin@habitflow.local`, `yassine.rahim@habitflow.local`, `nora.haddad@habitflow.local`
- `karim.amine@habitflow.local`, `maya.zidane@habitflow.local`, `adam.faris@habitflow.local`

---

## API Reference

All endpoints require a `Bearer <token>` header unless noted as public.

### Auth
| Method | Path | Access |
|---|---|---|
| POST | `/register` | Public |
| POST | `/login` | Public |
| POST | `/login/ldap` | Public |
| GET | `/profile` | Authenticated |

### Users
| Method | Path | Permission |
|---|---|---|
| POST | `/users` | Public (auto role: utilisateur) |
| GET | `/users` | USERS_VIEW |
| GET | `/users/:id` | Owner or USERS_VIEW |
| PATCH | `/users/:id` | Owner or USERS_MANAGE |
| PATCH | `/users/:id/role` | USERS_MANAGE |
| PATCH | `/users/:id/status` | USERS_MANAGE |
| DELETE | `/users/:id` | Owner or USERS_MANAGE |
| POST | `/users/admin` | USERS_MANAGE |

### Habits
| Method | Path | Permission |
|---|---|---|
| POST | `/habits` | Authenticated |
| GET | `/habits` | HABITS_VIEW (admin) |
| GET | `/habits/my` | Authenticated (own + shared) |
| GET | `/habits/:id` | Owner or HABITS_VIEW |
| PUT | `/habits/:id` | Owner or HABITS_MANAGE |
| PATCH | `/habits/:id/status` | Owner or HABITS_MANAGE |
| PATCH | `/habits/:id/notes` | Owner or shared |
| GET | `/habits/:id/notes/history` | Owner or HABITS_MANAGE |
| POST | `/habits/:id/clone` | Owner or shared |
| DELETE | `/habits/:id` | Owner (soft archive) |
| DELETE | `/habits/:id/hard` | Owner (hard delete) |
| GET | `/habits/templates` | Authenticated |
| POST | `/habits/from-template/:id` | Authenticated |

### Logs
| Method | Path | Permission |
|---|---|---|
| POST | `/logs` | Owner or shared habit |
| GET | `/logs` | LOGS_VIEW (admin) |
| GET | `/logs/:id` | Owner or LOGS_VIEW |
| PUT | `/logs/:id` | Owner or LOGS_MANAGE |
| DELETE | `/logs/:id` | Owner or LOGS_MANAGE |
| POST | `/logs/catchup` | Owner (photo proof) |
| GET | `/logs/incomplete-for-date/:date` | Authenticated |

### Progress
| Method | Path | Description |
|---|---|---|
| GET | `/progress/my` | Full stats summary |
| GET | `/progress/today` | Today's habits + logs |
| GET | `/progress/calendar` | Monthly calendar view |

### Other Endpoints
- `GET/POST /stats` — Habit statistics (admin)
- `GET/POST/DELETE /reminders` — Reminders
- `GET/POST/DELETE /sessions` — Sessions
- `GET/POST/PUT /onboarding` — Onboarding
- `GET/POST/PUT/DELETE /roles` — Role management (admin)

---

## RBAC — Permission System

| Permission | Grants Access To |
|---|---|
| `ALL` | Everything (admin role) |
| `USERS_VIEW` / `USERS_MANAGE` | User management |
| `HABITS_VIEW` / `HABITS_MANAGE` | Habit administration |
| `LOGS_VIEW` / `LOGS_MANAGE` | Log administration |
| `ROLES_VIEW` / `ROLES_MANAGE` | Role management |
| `SELF_VIEW` / `SELF_EDIT` | Own profile only |

---

## Adding a New Feature

1. **Model** → `backend/src/models/MyFeature.js`
2. **Controller** → `backend/src/controllers/myFeature.controller.js`
3. **Routes** → `backend/src/routes/myFeature.routes.js`
4. **Register** → add `fastify.register(require("./src/routes/myFeature.routes"))` in `backend/server.js`

---

## License

ISC
