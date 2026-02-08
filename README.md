# User Management System

Full-stack user management app with **JWT auth (access + refresh tokens)**, **role-based access control** (admin/user), and **profile management**.

## Tech stack

- **Frontend**: React (Vite) + TypeScript + Tailwind + Axios + React Router
- **Backend**: NestJS + TypeORM + MySQL + Passport JWT + bcrypt

## Features

- **Authentication**
  - Register, login, logout
  - Access token + refresh token (refresh token rotation)
- **Authorization**
  - Roles: `admin`, `user`
  - Admin-only: create users, delete users
  - Self-or-admin: update a user profile
- **User management**
  - List users, view user by id
  - Soft delete users
- **UI**
  - Admin dashboard (manage users)
  - User dashboard (view/edit profile, change password)

## Prerequisites

- **Node.js** (recommended: latest LTS)
- **MySQL** running locally (or accessible remotely)

## Project structure

```text
UserManagementSystem/
  backend/    # NestJS API (port 3000 by default)
  frontend/   # React app (port 5173 by default)
```

## Environment variables

### Backend (`backend/.env`)

Create `backend/.env` (you can copy from `backend/.env.example`):

- **DATABASE_HOST**: MySQL host (default `localhost`)
- **DATABASE_PORT**: MySQL port (default `3306`)
- **DATABASE_USER**: MySQL user (default `root`)
- **DATABASE_PASSWORD**: MySQL password
- **DATABASE_NAME**: DB name (default `user_management`)
- **JWT_SECRET**: secret used for access tokens (**required**)
- **JWT_EXPIRATION**: access token TTL (example: `15m`, `24h`)
- **JWT_REFRESH_EXPIRATION**: refresh token TTL (example: `7d`)
- **PORT**: API port (default `3000`)
- **FRONTEND_URL**: allowed CORS origin (default `http://localhost:5173`)

Notes:
- Refresh tokens use `JWT_REFRESH_SECRET` if set, otherwise they fall back to `JWT_SECRET`.
- TypeORM is configured with `synchronize: true` for local development (don’t use that in production).

### Frontend (`frontend/.env`)

Create `frontend/.env` (you can copy from `frontend/.env.example`):

- **VITE_API_URL**: backend base URL (default `http://localhost:3000`)

## Local setup (recommended)

### 1) Create the database

Create a MySQL database (name must match `DATABASE_NAME`):

```sql
CREATE DATABASE user_management;
```

### 2) Start the backend (NestJS)

```bash
cd backend
npm install
copy .env.example .env
npm run start:dev
```

Backend runs on `http://localhost:3000` by default.

Optional: seed sample users (admin + user):

```bash
cd backend
npm run seed
```

Seed credentials:
- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

### 3) Start the frontend (React)

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## API overview

Base URL: `http://localhost:3000`

### Auth

- **POST** `/auth/register`
- **POST** `/auth/login`
  - returns: `access_token`, `refresh_token`, and `user`
- **POST** `/auth/refresh`
  - body: `{ "refresh_token": "..." }`
  - returns rotated `access_token` + `refresh_token`
- **POST** `/auth/logout`
  - requires Bearer access token

### Users (requires Bearer access token)

- **GET** `/users` — list users
- **GET** `/users/:id` — get user by id
- **POST** `/users` — **admin only**
- **PATCH** `/users/:id` — **self or admin**
  - non-admin users cannot change their own role
- **DELETE** `/users/:id` — **admin only**
  - users cannot delete their own account

Authentication header:

```text
Authorization: Bearer <access_token>
```

## Tests

Frontend:

```bash
cd frontend
npm run test
```

Backend:

```bash
cd backend
npm run test
```

## Troubleshooting

- **CORS errors**: set `FRONTEND_URL` in `backend/.env` to match the frontend URL (default `http://localhost:5173`).
- **DB connection errors**: verify MySQL is running and `DATABASE_*` variables are correct.
- **401 loops**: the frontend will attempt a refresh token flow; if refresh fails it clears tokens and redirects to `/login`.

