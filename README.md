# Aaharam — Nutrition Tracking App

A full-stack nutrition tracking application built with React + Vite (frontend) and Spring Boot 3 (backend), powered by Supabase for auth and database.

## Stack

| Layer    | Tech                                             |
|----------|--------------------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS v4, Recharts        |
| Backend  | Spring Boot 3.3, Java 21, Spring Security        |
| Database | PostgreSQL via Supabase                          |
| Auth     | Supabase Auth (JWT)                              |
| Deploy   | Vercel (frontend) · Railway / Render (backend)   |

---

## Local Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd aaharam
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, then run the schema:

1. Open **SQL Editor** in your Supabase dashboard
2. Paste the contents of [`/supabase/schema.sql`](./supabase/schema.sql) and click **Run**

### 3. Configure the client

```bash
cp client/.env.example client/.env
```

Edit `client/.env`:

```env
VITE_SUPABASE_URL=        # Project Settings → API → Project URL
VITE_SUPABASE_ANON_KEY=   # Project Settings → API → anon / public key
VITE_API_BASE_URL=http://localhost:8080
```

### 4. Configure the server

Create `server/src/main/resources/application-local.yml` (gitignored):

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres
    username: postgres
    password: <your-db-password>
supabase:
  jwt-secret: <your-jwt-secret>
```

Or set the four environment variables directly:

| Variable              | Where to find it                                          |
|-----------------------|-----------------------------------------------------------|
| `DB_URL`              | Project Settings → Database → Connection string (URI, port 5432) — convert to JDBC format |
| `DB_USERNAME`         | `postgres`                                               |
| `DB_PASSWORD`         | Project Settings → Database → Password                   |
| `SUPABASE_JWT_SECRET` | Project Settings → API → JWT Secret                      |

### 5. Install dependencies

```bash
# Root (concurrently)
npm install

# Client
cd client && npm install && cd ..
```

### 6. Run in development

From the repo root:

```bash
npm run dev
```

This starts:
- **React** dev server at `http://localhost:5173`
- **Spring Boot** API at `http://localhost:8080`

---

## Deployment

### Frontend → Vercel

1. Push the repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set **Root Directory** to `client`
4. Add environment variables in **Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL` → your backend's public URL
5. Click **Deploy** — `client/vercel.json` handles SPA routing automatically

### Backend → Railway or Render

**Build the JAR:**

```bash
cd server
mvn clean package -DskipTests
```

**Using the Dockerfile:**

```bash
docker build -t aaharam-server .
docker run -p 8080:8080 \
  -e DB_URL=... \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=... \
  -e SUPABASE_JWT_SECRET=... \
  aaharam-server
```

**On Railway / Render:**

1. Connect the GitHub repo, set root directory to `server`
2. Add the four environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `SUPABASE_JWT_SECRET`)
3. Railway auto-detects the `Dockerfile`; Render uses the Docker runtime
4. Health check endpoint: `GET /api/health`

---

## Finding your Supabase credentials

| Credential             | Location in dashboard                              |
|------------------------|----------------------------------------------------|
| Project URL            | Project Settings → API → Project URL              |
| Anon / public key      | Project Settings → API → Project API keys         |
| JWT Secret             | Project Settings → API → JWT Secret               |
| DB connection string   | Project Settings → Database → Connection string → URI mode (port 5432) |
| DB password            | Project Settings → Database → Database password   |

---

## Project Structure

```
aaharam/
├── client/                   # React 18 + Vite frontend
│   ├── src/
│   │   ├── components/       # Layout, ErrorBoundary, BarcodeScanner, …
│   │   ├── context/          # AuthContext, ToastContext
│   │   ├── lib/              # supabase.js, api.js
│   │   └── pages/            # Dashboard, Log, History, Goals, Login, Register
│   ├── vercel.json           # SPA rewrite rule
│   └── .env.example
├── server/                   # Spring Boot 3 backend
│   ├── src/main/java/com/aaharam/
│   │   ├── config/           # Security, CORS, JWT filter, RestTemplate
│   │   ├── controller/       # Food, MealLog, DailyGoals, Health
│   │   ├── service/          # FoodService, MealLogService, DailyGoalsService, OpenFoodFacts
│   │   ├── repository/       # JPA repositories
│   │   ├── model/            # JPA entities
│   │   ├── dto/              # Request/response records
│   │   └── exception/        # GlobalExceptionHandler
│   ├── Dockerfile
│   └── .env.example
├── supabase/
│   └── schema.sql            # Full DB schema + RLS policies + trigger
└── package.json              # Root dev script (concurrently)
```

## API Endpoints

| Method | Path                      | Auth | Description                     |
|--------|---------------------------|------|---------------------------------|
| GET    | `/api/health`             | No   | Health check                    |
| GET    | `/api/food/barcode/{bc}`  | Yes  | Look up food by barcode         |
| GET    | `/api/food/search?q=`     | Yes  | Search Open Food Facts          |
| POST   | `/api/log`                | Yes  | Log a meal entry                |
| GET    | `/api/log?date=YYYY-MM-DD`| Yes  | Get entries for a date          |
| DELETE | `/api/log/{id}`           | Yes  | Delete a meal entry             |
| GET    | `/api/goals`              | Yes  | Get daily macro goals           |
| PUT    | `/api/goals`              | Yes  | Update daily macro goals        |
