# Portfolio Backend — API Contract

This document describes exactly what endpoints your backend needs to expose
so the frontend works without any changes.

---

## Base URL
Set `API_BASE` in both `index.html` and `admin.html`:
```js
const API_BASE = 'https://your-backend.com/api';
```

---

## Auth

### POST /api/auth/login
Request:
```json
{ "password": "your-admin-password" }
```
Response 200:
```json
{ "token": "jwt-or-session-token-string" }
```
Response 401:
```json
{ "error": "Unauthorized" }
```

The token is stored in `sessionStorage` and sent on every subsequent
admin request as:
```
Authorization: Bearer <token>
```

---

## Projects

### GET /api/projects
Public — no auth required.
Returns all projects (newest first).

Response 200:
```json
[
  {
    "id": "1",
    "name": "TaskFlow API",
    "description": "A REST API for managing tasks...",
    "tech": ["Node.js", "PostgreSQL", "Docker"],
    "github_url": "https://github.com/you/taskflow",
    "live_url": "https://taskflow.app",
    "created_at": "2026-01-15T10:00:00Z"
  }
]
```

---

### POST /api/projects
Admin only — requires Bearer token.

Request body:
```json
{
  "name": "TaskFlow API",
  "description": "A REST API for managing tasks...",
  "tech": ["Node.js", "PostgreSQL"],
  "github_url": "https://github.com/you/taskflow",
  "live_url": "https://taskflow.app"
}
```

Response 201 — the created project object (must include `id`):
```json
{
  "id": "2",
  "name": "TaskFlow API",
  ...
}
```

---

### PUT /api/projects/:id
Admin only — requires Bearer token.

Request body: same shape as POST.
Response 200 — the updated project object.

---

### DELETE /api/projects/:id
Admin only — requires Bearer token.
Response 204 — no body.

---

## Suggested Stack
- **Node.js + Express** (simple, fast)
- **PostgreSQL** or **SQLite** for storage
- **bcrypt** for hashing your admin password
- **jsonwebtoken** for auth tokens
- **CORS** enabled for your frontend origin

## Deployment Options
- **Railway** — free tier, easy Postgres + Node
- **Render** — free tier, straightforward deploy
- **Supabase** — instant Postgres + auto-generated REST API
- **Vercel** — great for Node serverless functions
