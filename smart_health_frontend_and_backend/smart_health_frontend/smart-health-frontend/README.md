# Smart Health & Fitness Tracker — Angular Front-end

**Module:** COM661 Full Stack Strategies and Development
**Assignment:** CW2 — Individual Full Stack Application Development (Front End)
**Framework:** Angular 17 (standalone components)
**Back-end API:** Flask + MongoDB (CW1 submission)

A single-page Angular application that lets users log their workouts and meals, track their vital-sign health metrics, set fitness goals, and explore analytics. Administrators can additionally manage every user on the platform and view a "top active users" leaderboard.

---

## ✨ Features

| Area | Capabilities |
|------|---------------|
| Authentication | Register, login, JWT persistence, auto-logout on 401, role-based guards |
| Dashboard | Headline metric cards, weekly calorie bar chart, recent activities & meals, live goal progress |
| Activities | Full CRUD, filter by type/date, paginated list, edit form |
| Nutrition | Full CRUD with macro tracking, live calorie-from-macros estimator |
| Health Metrics | Heart rate, BP, sleep, VO₂ max, computed BMI with colour-coded categories |
| Fitness Goals | Set/update/clear targets; progress widgets on the dashboard |
| Analytics | BMI report, calorie-balance date range, weekly line chart, doughnut of activity types, stacked-bar of macros by meal |
| Admin | Paginated users list with search/role-change/delete, top-active leaderboard with chart |

---

## 🧱 Tech Stack

- **Angular 17** — standalone components, functional guards, functional HTTP interceptors, signals
- **Bootstrap 5 + Bootstrap Icons** — responsive UI
- **Chart.js** via **ng2-charts** — all charts
- **Reactive Forms** with client-side validators mirroring the back-end
- **RxJS** — `forkJoin`, `debounceTime`, `catchError`

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and **npm 9+**
- The **CW1 Flask API** running locally on `http://127.0.0.1:5001`
- The MongoDB database seeded (run `python seed_data.py` from your CW1 folder)

### Installation

```bash
npm install
npm start
```

The app opens at `http://localhost:4200/`.

### Demo credentials (seeded by `seed_data.py`)

| Role  | Email                     | Password      |
|-------|---------------------------|---------------|
| Admin | admin@smarthealth.com     | admin123      |
| User  | alice@example.com         | password123   |
| User  | bob@example.com           | password123   |
| User  | carol@example.com         | password123   |

The Login screen has "Demo user" and "Demo admin" buttons that fill the form automatically.

---

## 🧪 Running Tests

```bash
npm test              # interactive (watches, opens Chrome)
npm run test:ci       # single-run headless Chrome
```

Tests cover the core services (AuthService, ActivityService, ToastService), the auth guard, and the login component.

---

## 📁 Project Structure

```
src/app/
├── core/                 # cross-cutting concerns
│   ├── guards/           # authGuard, adminGuard, guestGuard
│   ├── interceptors/     # JWT HTTP interceptor
│   ├── models/           # TypeScript interfaces matching API payloads
│   └── services/         # Auth, User, Activity, Nutrition,
│                         # HealthMetrics, Goals, Analytics, Toast
├── shared/               # reusable UI pieces
│   └── components/       # Navbar, Toast, ConfirmDialog, LoadingSpinner
└── features/             # one folder per domain area (lazy-loaded)
    ├── auth/             # login, register
    ├── dashboard/
    ├── profile/
    ├── activities/       # list + form
    ├── nutrition/        # list + form
    ├── health-metrics/
    ├── goals/
    ├── analytics/
    └── admin/            # users-list, top-active-users
```

---

## 📜 API Configuration

The API URL lives in `src/environments/environment.development.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:5001/api',
  appName: 'Smart Health & Fitness Tracker'
};
```

Change this if your Flask back-end runs on a different port.

---

## 📘 Generating Documentation with Compodoc

```bash
npm run compodoc        # opens docs at http://localhost:8080
npm run compodoc:build  # writes static site to ./documentation
```

---

## 🖋️ Author

Submitted as coursework for **COM661 Full Stack Strategies and Development** (Semester 2, 2025–26).
Back-end API developed for CW1; front-end developed for CW2.
