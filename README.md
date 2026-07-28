# Smart Health & Fitness

A full-stack health and fitness tracking application. Users can log workouts, track nutrition, monitor health metrics, set goals, and view analytics — all through an Angular frontend backed by a Flask REST API and MongoDB.

---

## Features

- **Activity tracking** — Log workouts and exercise sessions with type, duration, and notes
- **Nutrition logging** — Record meals and track daily food intake
- **Health metrics** — Monitor vitals and measurements over time (weight, heart rate, etc.)
- **Goal management** — Set fitness goals and track progress towards them
- **Analytics** — Insights and summaries across all tracked data
- **User accounts** — Registration and login with bcrypt-hashed passwords and JWT authentication
- **Seed data** — `seed_data.py` populates MongoDB with realistic sample data for development

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular, TypeScript, HTML, CSS |
| Backend | Python 3, Flask, Flask-CORS |
| Auth | Flask-JWT-Extended, Flask-Bcrypt |
| Database | MongoDB (PyMongo) |
| Config | python-dotenv |

---

## Project Structure

```
smart_health_frontend_and_backend/
├── smart_health_api_backend/
│   ├── routes/
│   │   ├── auth.py            # Register, login
│   │   ├── users.py           # Profile management
│   │   ├── activities.py      # Exercise logging
│   │   ├── nutrition.py       # Meal and food logging
│   │   ├── health_metrics.py  # Vitals and measurements
│   │   ├── goals.py           # Fitness goal tracking
│   │   └── analytics.py       # Insights and summaries
│   ├── app.py                 # Application entry point
│   ├── utils.py               # Helper functions
│   ├── seed_data.py           # Sample data loader
│   └── requirements.txt
│
└── smart_health_frontend/
    └── smart-health-frontend/ # Angular application
        ├── src/
        ├── angular.json
        └── package.json
```

---

## API Overview

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Prefix | Module | Description |
|---|---|---|
| `/api/auth` | Auth | Register and login |
| `/api/users` | Users | Profile read and update |
| `/api/activities` | Activities | Log and manage workouts |
| `/api/nutrition` | Nutrition | Log and manage meals |
| `/api/health` | Health Metrics | Record vitals and measurements |
| `/api/goals` | Goals | Create and track fitness goals |
| `/api/analytics` | Analytics | Aggregated data and insights |

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- Angular CLI (`npm install -g @angular/cli`)
- MongoDB running locally on port 27017

### 1. Clone the repository

```bash
git clone https://github.com/meharjots/Smart-Health-Fitness.git
cd Smart-Health-Fitness/smart_health_frontend_and_backend
```

### 2. Backend setup

```bash
cd smart_health_api_backend
pip install -r requirements.txt
```

Create a `.env` file:

```
JWT_SECRET_KEY=your-secret-key
MONGO_URI=mongodb://localhost:27017/smart_health
```

Optionally seed the database with sample data:

```bash
python seed_data.py
```

Start the API:

```bash
python app.py
```

The API runs at `http://localhost:5001`.

### 3. Frontend setup

In a separate terminal:

```bash
cd smart_health_frontend/smart-health-frontend
npm install
ng serve
```

Open `http://localhost:4200` in your browser.

---

## Testing the API

A Postman collection covering all endpoints is included in the repository:

```
smart_health_frontend_and_backend/smart_health_api_backend/SmartHealthAPI.postman_collection.json
```

Import it into Postman, set the `base_url` variable to `http://localhost:5001`, register a user to get a JWT token, then set the `token` variable — all authenticated requests will work from there.

---

## Environment Variables

| Variable | Description |
|---|---|
| `JWT_SECRET_KEY` | Secret used to sign JWT tokens |
| `MONGO_URI` | MongoDB connection string |
