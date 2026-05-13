# Aaharam — Nutrition Tracking App

A full-stack nutrition tracking application built with React + Vite (frontend) and Spring Boot 3 (backend), powered by Supabase for auth and database.

## Stack

| Layer    | Tech                                      |
|----------|-------------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts    |
| Backend  | Spring Boot 3, Java 21, Spring Security   |
| Database | PostgreSQL (Supabase)                     |
| Auth     | Supabase Auth (JWT)                       |

## Prerequisites

- Node.js 18+
- Java 21
- Maven 3.9+
- A [Supabase](https://supabase.com) project

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd aaharam
```

### 2. Configure environment variables

**Client:**

```bash
cp client/.env.example client/.env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project settings
```

**Server:**

```bash
cp server/.env.example server/.env
# Fill in DB_URL, DB_USERNAME, DB_PASSWORD, and SUPABASE_JWT_SECRET
```

> The `SUPABASE_JWT_SECRET` is found in your Supabase project under **Settings → API → JWT Secret**.

### 3. Install root dependencies

```bash
npm install
```

### 4. Install client dependencies

```bash
cd client && npm install
```

### 5. Run in development

From the repo root:

```bash
npm run dev
```

This starts both:
- React dev server at `http://localhost:5173`
- Spring Boot API at `http://localhost:8080`

## Project Structure

```
aaharam/
├── client/          # React 18 + Vite frontend
│   ├── src/
│   │   ├── lib/     # Supabase client
│   │   ├── pages/   # Route-level page components
│   │   └── App.jsx  # Router configuration
│   └── .env.example
├── server/          # Spring Boot 3 backend
│   ├── src/main/java/com/nutriscan/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── model/
│   │   ├── dto/
│   │   └── exception/
│   └── .env.example
└── package.json     # Root dev script (concurrently)
```

## Routes

| Path        | Page      | Auth required |
|-------------|-----------|---------------|
| `/`         | → `/dashboard` | —        |
| `/login`    | Login     | No            |
| `/register` | Register  | No            |
| `/dashboard`| Dashboard | Yes           |
| `/log`      | Log Food  | Yes           |
| `/history`  | History   | Yes           |
| `/goals`    | Goals     | Yes           |
