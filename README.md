# LinkLens — Independent Link Shortener & Analytics

A standalone React + FastAPI + PostgreSQL link shortener. It has no Apper runtime dependency.

## Architecture

- Frontend: React + Vite
- Backend: FastAPI
- Database: PostgreSQL
- Auth: JWT in an HttpOnly cookie
- Redirects: backend HTTP 302
- Analytics: click events with device/browser/OS/referrer and hashed IP

## Run locally

### 1. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd backend
copy .env.example .env
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Linux/macOS activation:
`source .venv/bin/activate`

### 3. Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

The API docs are at `http://localhost:8000/docs`.

## Production

Deploy the frontend to a static host and FastAPI to a server/container. PostgreSQL should be a managed database or a private production instance. Set `VITE_API_URL`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `SHORT_BASE_URL`, `COOKIE_SECURE=true`, and `IP_HASH_SALT` in production.

For a dedicated short-link domain, point that domain's DNS to the FastAPI service. A request such as `https://lnk.example.com/abc123` is handled by `GET /{short_code}` and returns a real HTTP 302 redirect.
