# Smart Health & Fitness App

A full-stack web application for tracking health and fitness data, built with Angular and Flask.

## Overview

This project is a full-stack health and fitness tracking application consisting of:

- **Backend** — A RESTful API built with Flask, using MongoDB for data storage and JWT for authentication.
- **Frontend** — A single-page application built with Angular that consumes the API.

## Tech Stack

**Backend**
- Python 3
- Flask
- Flask-JWT-Extended (authentication)
- Flask-Bcrypt (password hashing)
- Flask-CORS (cross-origin requests)
- PyMongo (MongoDB driver)
- MongoDB

**Frontend**
- Angular
- TypeScript
- HTML / CSS

## Project Structure

```
smart-health-app/
├── backend/              # Flask REST API
│   ├── routes/           # API route handlers
│   ├── app.py            # Application entry point
│   ├── utils.py          # Helper functions
│   ├── seed_data.py      # Database seeding script
│   └── requirements.txt  # Python dependencies
│
├── frontend/             # Angular application
│   ├── src/              # Source code
│   ├── angular.json      # Angular CLI config
│   └── package.json      # Node dependencies
│
└── README.md
```

## Prerequisites

Before running the project, make sure you have the following installed:

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+ and npm](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally on port 27017)
- [Angular CLI](https://angular.io/cli) — install globally with `npm install -g @angular/cli`

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/meharjots/smart-health-app.git
cd smart-health-app
```

### 2. Backend setup

Open a terminal and navigate to the backend folder:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

(Optional) Seed the database with sample data:

```bash
python seed_data.py
```

Run the backend server:

```bash
python app.py
```

The API will be available at `http://localhost:5001`.

### 3. Frontend setup

Open a **new terminal** (keep the backend running) and navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
ng serve
```

The application will be available at `http://localhost:4200`.

## Configuration

The backend reads the following environment variables (with sensible defaults for development):

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET_KEY` | `smart-health-secret-key-2026` | Secret key used to sign JWT tokens |
| `MONGO_URI` | `mongodb://localhost:27017/smart_health_db` | MongoDB connection string |

For production, create a `.env` file in the `backend/` folder and override these values. **Never commit the `.env` file to GitHub.**

## API Endpoints

See `backend/API_Endpoints_Summary.pdf` for full documentation of the available endpoints.

A Postman collection is also provided: `backend/SmartHealthAPI.postman_collection.json`.

## Features

- User registration and login with JWT authentication
- Secure password hashing with bcrypt
- CRUD operations for health and fitness data
- CORS enabled for frontend-backend communication
- MongoDB integration for persistent data storage

## Troubleshooting

**MongoDB connection error** — Make sure MongoDB is running locally on port 27017. On Windows, start it from Services; on macOS/Linux, run `mongod`.

**Port already in use** — If port 5001 or 4200 is busy, stop the conflicting process or change the port in `app.py` / use `ng serve --port <number>`.

**Pylance import warnings in VS Code** — Select the correct Python interpreter via `Ctrl+Shift+P` → `Python: Select Interpreter` → choose the one inside `backend/venv/`.

## Author

Built as part of coursework at Ulster University.

## License

This project is for educational purposes.
