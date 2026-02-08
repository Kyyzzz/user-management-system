# User Management System

A full-stack user administration app with role-based access control, built using **React**, **TypeScript**, **NestJS**, and **MySQL**.

## 📋 Description

The User Management Portal is a modern, secure platform for managing users, featuring separate dashboards for administrators and standard users, plus authentication, authorization, and CRUD workflows designed with security, usability, and clean architecture in mind.

## ✨ Features

### Authentication & Authorization

- **User Registration**: Create an account with email and strong password requirements
- **Secure Login**: JWT-based authentication (access token + refresh token)
- **Token Refresh**: Refresh token rotation supported via `/auth/refresh`
- **Role-Based Access Control**: `admin` and `user` roles
- **Protected Routes**: Unauthenticated users are redirected to `/login`

### Admin Dashboard

- **User Management**: Create, view, edit, and delete users
- **Search & Pagination**: Filter users by name/email/role and page through results
- **Profile Management**: Admin can edit their own profile and change password
- **Secure Actions**: Prevents deleting your own account (backend enforced)

### User Dashboard

- **Profile Viewing**: View personal information
- **Profile Editing**: Update name, email, phone, address, and gender
- **Password Management**: Change password

### Security Features

- **JWT Token Authentication**: Secure API communication using Bearer tokens
- **Refresh Token Storage**: Refresh tokens are stored **hashed** in the database
- **Input Validation**: Server-side DTO validation with `class-validator`
- **Password Strength Requirements (Registration)**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (`@$!%*?&#`)

## 🧰 Technologies Used

### Frontend

- **React** (Vite) + **TypeScript**
- **React Router DOM**
- **Axios**
- **Tailwind CSS**
- **React Hook Form**
- **Vitest** + Testing Library

### Backend

- **NestJS** + **TypeScript**
- **TypeORM**
- **MySQL**
- **Passport JWT**
- **bcrypt**
- **class-validator** / **class-transformer**
- **Jest**

## 📁 Project structure

```text
UserManagementSystem/
  backend/    # NestJS API (default http://localhost:3000)
  frontend/   # React app (default http://localhost:5173)
```

## ⚙️ Installation / Setup

### Prerequisites

- Node.js (recommended: latest LTS)
- MySQL (local or remote)

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

- Copy the example file:
  - **Windows (PowerShell)**: `copy .env.example .env`
  - **macOS/Linux**: `cp .env.example .env`

`backend/.env` (variables used by this codebase):

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_mysql_password
DATABASE_NAME=user_management

JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

PORT=3000
FRONTEND_URL=http://localhost:5173

# optional (if set, refresh tokens use this instead of JWT_SECRET)
# JWT_REFRESH_SECRET=your_refresh_secret_key_here
```

4. Create the MySQL database:

```sql
CREATE DATABASE user_management;
```

5. Start the backend server:

```bash
npm run start:dev
```

Backend will run on `http://localhost:3000`.

Optional: seed sample users (admin + user):

```bash
npm run seed
```

Seed credentials:
- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables (optional):

- Copy the example file:
  - **Windows (PowerShell)**: `copy .env.example .env`
  - **macOS/Linux**: `cp .env.example .env`

`frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

4. Start the frontend dev server:

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`.

## 🚀 Usage

### First Time Setup

1. Start both backend and frontend servers.
2. Open the app at `http://localhost:5173`.
3. Register a new account and login.

### Admin Features

Easiest way to get an admin account:
- Run `npm run seed` in `backend/` (creates an admin user automatically).

Alternative (manual DB update):

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Admin capabilities:
- Create users (**admin only**)
- Delete users (**admin only**, cannot delete yourself)
- Update any user (**admin**)

### User Features

- View your profile
- Update your profile (only yourself)
- Change password

### Password Requirements

- **Registration (`POST /auth/register`)** enforces the strong password rules listed above.
- **Admin create/update (`POST /users`, `PATCH /users/:id`)** currently enforce **minimum length 6** for password.

## 🧪 Testing

Backend tests:

```bash
cd backend
npm test
```

Frontend tests:

```bash
cd frontend
npm run test
```

## 🔌 API Endpoints

Base URL: `http://localhost:3000`

### Authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh` (body: `{ "refresh_token": "..." }`)
- `POST /auth/logout` (**requires access token**)

### Users (Protected)

All `/users/*` endpoints require:

```text
Authorization: Bearer <access_token>
```

- `GET /users` (authenticated)
- `GET /users/:id` (authenticated)
- `POST /users` (**admin only**)
- `PATCH /users/:id` (**self or admin**)
  - Non-admin users cannot change their own role
- `DELETE /users/:id` (**admin only**, cannot delete yourself)

## 🛠️ Troubleshooting

- **CORS errors**: set `FRONTEND_URL` in `backend/.env` to match the frontend URL (default `http://localhost:5173`).
- **DB connection errors**: verify MySQL is running and `DATABASE_*` values are correct.
- **401 behavior**: the frontend attempts refresh; if refresh fails, it clears tokens and redirects to `/login`.

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

