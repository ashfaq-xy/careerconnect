# CareerConnect

A full-stack job portal platform connecting job seekers with recruiters in real time.

**MCA Final Year Project — 2025**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Real-time | Socket.IO |
| Auth | JWT (access + refresh token rotation) |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Forms | React Hook Form |

## Quick Start

### 1. Clone & Install

```bash
# Backend
cd server
npm install
cp .env.example .env    # Fill in your values

# Frontend
cd ../client
npm install
cp .env.example .env    # Fill in your values
```

### 2. Configure Environment

**server/.env**
```
PORT=8000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/careerconnect
JWT_ACCESS_SECRET=<min-32-random-chars>
JWT_REFRESH_SECRET=<min-32-random-chars>
CLIENT_URL=http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

**client/.env**
```
VITE_API_URL=http://localhost:8000/api/v1
VITE_SOCKET_URL=http://localhost:8000
VITE_APP_NAME=CareerConnect
```

### 3. Run

```bash
# Terminal 1 — Backend (port 8000)
cd server && npm run dev

# Terminal 2 — Frontend (port 3000)
cd client && npm run dev
```

Open http://localhost:3000

## Project Structure

```
careerconnect/
├── server/                  # Express.js API
│   ├── config/              # Database connection
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth, error handler
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routers
│   ├── socket/              # Socket.IO setup
│   └── utils/               # Email utility
└── client/                  # React SPA
    └── src/
        ├── api/             # Axios API layer
        ├── components/      # Reusable UI components
        ├── context/         # AuthContext, NotificationContext
        ├── hooks/           # useJobs, useSocket
        └── pages/           # Route-level page components
```

## Features

- **Job Seekers** — Browse & filter jobs, apply with cover letter, track application status in real time
- **Recruiters** — Post jobs, manage applicant pipeline (reviewing → shortlisted → interview → offered/rejected)
- **Admin** — Manage all users, moderate listings
- **Real-time** — Socket.IO notifications when applications are received or statuses change
- **Security** — JWT rotation, bcrypt, OTP email verification, RBAC, rate limiting

## API Base URL

`http://localhost:8000/api/v1`

Health check: `GET /api/v1/health`
