# Deployment Guide

This application is designed to be deployed with the **Frontend on Vercel** and the **Backend on Render (Free Tier)**.

## 1. Backend (Render + PostgreSQL)

1. Create a new repository on GitHub and push this code.
2. Go to [Render](https://render.com) and sign in.
3. **Database Setup**:
   - Create a new "PostgreSQL" instance.
   - Choose a name (e.g., `stockleague-db`).
   - Copy the "Internal Database URL" (for Render-to-Render) or "External Database URL" to your clipboard.
4. **Web Service Setup**:
   - Create a new "Web Service" and connect your GitHub repository.
   - Set the Root Directory to `backend`.
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment Variables:
     - `PORT` = `3001`
     - `DATABASE_URL` = [Paste your Postgres URL here]
     - `FRONTEND_URL` = `https://your-vercel-app-url.vercel.app`
     - `ADMIN_SECRET` = `[Generate a secure 64 char string]`
     - `OWNER_EMAIL` = `your@email.com`
     - `EMAIL_PROVIDER` = `resend` (or `gmail`)
     - `RESEND_API_KEY` = `[Your Resend Key]`
     - `ZAPIER_WEBHOOK_URL` = `[Your Zapier Hook URL]`
     - `NODE_ENV` = `production`
5. Deploy the backend. Copy the Render URL (e.g., `https://stockleague-backend.onrender.com`).

## 2. Frontend (Vercel)

1. Go to [Vercel](https://vercel.com) and import your GitHub repository.
2. Set the Root Directory to `frontend`.
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   - `VITE_API_URL` = `https://your-render-backend-url.onrender.com/api`
   - `VITE_ADMIN_PASSWORD` = `[Your Chosen Admin Password]`
   - `VITE_ADMIN_SECRET` = `[Must match ADMIN_SECRET from Backend]`
7. Deploy the frontend.

## 3. Webhooks & Integrations (Zapier)

To automatically send new signups to Google Sheets:
1. Create a new Zap in Zapier.
2. Trigger: **Webhooks by Zapier (Catch Hook)**.
3. Copy the generated Webhook URL.
4. Add it to your Render environment variables as `ZAPIER_WEBHOOK_URL` and redeploy the backend.
5. Action: **Google Sheets (Add Row)**.
6. Map the incoming payload (`email`, `name`, `marketExperience`, `position`, `createdAt`) to your Sheet columns.

## Important Notes
- **Render Free Tier Spin Down**: The backend will spin down after 15 minutes of inactivity. The first request after a spin-down will take ~30 seconds. Render uses `/api/health` to keep it alive if you set up an external cron job.
