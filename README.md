# StockLeague - Fantasy Stock Market

## 🚀 Waitlist Launch Platform

This repository contains the full stack application for the StockLeague pre-launch waitlist.
It features a high-performance React frontend and a robust Node.js/PostgreSQL backend.

### Project Structure
- `/frontend` - React + Vite application
- `/backend`  - Node.js + Express application

---

## 💻 Local Development Setup

### 1. Database Setup
1. Ensure PostgreSQL is installed and running locally.
2. Create a local database named `stockleague`.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. The `.env` file is already created. Make sure your `DATABASE_URL` matches your local Postgres credentials (default is `postgresql://postgres:postgres@localhost:5432/stockleague`).
4. Start the server:
   ```bash
   npm run dev
   ```
   The backend will run on http://localhost:3001 and automatically create the `waitlist` table.

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:5173. The Vite config automatically proxies `/api` requests to the local backend.

---

## 🛠️ Admin Dashboard
To view the admin dashboard locally:
1. Navigate to `http://localhost:5173/admin`
2. Enter the password defined in your Vite `.env` (or whatever you set for `VITE_ADMIN_PASSWORD`).

For deployment instructions, see `DEPLOY.md`.
