# ERP System Hosting & Deployment Guide

This guide walks you through deploying the **Manufacturing ERP System** with:
- **Backend (NestJS + TypeORM)** on **[Render](https://render.com)**
- **Frontend (React + Vite)** on **[Vercel](https://vercel.com)**
- **Database (MySQL)** on a Cloud MySQL provider

---

## Architecture Overview

```
┌─────────────────────────────────┐
│     Vercel (React Frontend)     │
│   https://your-erp.vercel.app   │
└────────────────┬────────────────┘
                 │  HTTPS / API Requests (Bearer JWT)
                 ▼
┌─────────────────────────────────┐
│     Render (NestJS Backend)     │
│ https://your-backend.onrender.com│
└────────────────┬────────────────┘
                 │  MySQL (SSL encrypted)
                 ▼
┌─────────────────────────────────┐
│     Cloud MySQL Database        │
│  (Aiven / Railway / TiDB / RDS) │
└─────────────────────────────────┘
```

---

## Step 1: Cloud MySQL Database Setup

Render does not offer a free managed MySQL service natively. You can use any cloud MySQL provider (such as **Aiven for MySQL**, **Railway**, **Clever Cloud**, or **TiDB Cloud**).

### 1.1 Create MySQL Instance
1. Sign up for a MySQL database service (e.g., [Aiven](https://aiven.io), [Railway](https://railway.app), or [Clever Cloud](https://www.clever-cloud.com)).
2. Note your connection details:
   - **Host**: e.g., `mysql-xxxx.aivencloud.com`
   - **Port**: e.g., `12345` (default 3306)
   - **User**: e.g., `avnadmin` or `root`
   - **Password**: `your_secure_password`
   - **Database Name**: `barcode` (or create a database named `barcode`)

### 1.2 Import Initial Database Schema & Data
Import the included `Dump20260919.sql` file into your cloud database.

**Option A — Using MySQL CLI:**
```bash
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p <DB_NAME> < Dump20260919.sql
```

**Option B — Using DBeaver / MySQL Workbench:**
1. Connect to your cloud database in DBeaver or MySQL Workbench.
2. Select database `barcode` (or create it: `CREATE DATABASE barcode; USE barcode;`).
3. Open `Dump20260919.sql` and run the script (Execute All / Import).

---

## Step 2: Deploy Backend on Render

You can deploy the backend using the included **Render Blueprint (`render.yaml`)** or create a **Web Service** manually.

### Manual Setup (Recommended for first-time setup):

1. **Sign in to Render**: Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub / GitLab repository containing this project.
4. Fill in the configuration:
   - **Name**: `erp-barcode-backend` (or your choice)
   - **Region**: Choose the region closest to your database (e.g., Frankfurt, Oregon, Singapore)
   - **Branch**: `main` (or your active branch, e.g., `samarth`)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or higher)

5. **Advanced Settings**:
   - **Health Check Path**: `/api/health`

6. **Environment Variables**:
   Under the **Environment Variables** section, add:

   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | Production environment flag |
   | `PORT` | `10000` | Render sets this automatically, but you can define it |
   | `DB_HOST` | `your-mysql-host.com` | From Step 1 |
   | `DB_PORT` | `3306` (or your provider's port) | From Step 1 |
   | `DB_USER` | `your_db_username` | From Step 1 |
   | `DB_PASS` | `your_db_password` | From Step 1 |
   | `DB_NAME` | `barcode` | Database name |
   | `DB_SSL` | `true` | Required by cloud MySQL providers (Aiven, Railway, etc.) |
   | `JWT_SECRET` | `generate_a_random_32_character_string` | Secret key for JWT auth |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` | Set after deploying Vercel in Step 3 |

   > **Note**: If your provider gives you a full connection string like `mysql://user:pass@host:port/dbname`, you can simply set `DATABASE_URL` instead of individual `DB_*` variables!

7. Click **Create Web Service**.
8. Once built and deployed, copy your Render service URL (e.g., `https://erp-barcode-backend.onrender.com`).
9. Verify by opening `https://erp-barcode-backend.onrender.com/api/health` in your browser. You should see:
   ```json
   {"status":"ok","service":"erp-barcode-backend","uptime":...}
   ```

---

## Step 3: Deploy Frontend on Vercel

1. **Sign in to Vercel**: Go to [vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Configure the project settings:
   - **Project Name**: `erp-barcode-frontend` (or your choice)
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend`
   - **Build and Output Settings**:
     - Build Command: `npm run build` (default)
     - Output Directory: `dist` (default)
     - Install Command: `npm install` (default)

5. **Environment Variables**:
   Add the following environment variable:

   | Key | Value | Notes |
   |-----|-------|-------|
   | `VITE_API_URL` | `https://your-backend.onrender.com` | Your Render backend URL from Step 2 |

6. Click **Deploy**.
7. Once deployment is complete, Vercel gives you your production URL (e.g. `https://erp-barcode-frontend.vercel.app`).

---

## Step 4: Final Linkage & Verification

1. **Update Backend CORS**:
   - Go back to your Render Dashboard -> `erp-barcode-backend` -> **Environment Variables**.
   - Set `FRONTEND_URL` to your Vercel URL: `https://erp-barcode-frontend.vercel.app`.
   - Render will automatically re-deploy with the updated CORS rule.

2. **Verify Frontend**:
   - Open your Vercel domain: `https://erp-barcode-frontend.vercel.app`.
   - Log in using your ERP credentials (default admin credentials from database: `admin@talbros.com` / `admin123` or your configured user).
   - Test navigating to different pages (e.g. `/part_stock`, `/create_invoice`, `/erp_users`) and refresh the page to confirm SPA rewrites work seamlessly without 404s.

---

## Troubleshooting & FAQ

### 1. CORS Errors in Browser Console
- Ensure `FRONTEND_URL` on Render matches your exact Vercel URL (e.g. `https://your-frontend.vercel.app` without a trailing slash).
- Note: The backend includes automatic wildcard support for `*.vercel.app` preview branches, so preview deployments will work seamlessly.

### 2. Database Connection Fails (ETIMEDOUT / Handshake)
- Make sure `DB_SSL=true` is set on Render if your provider requires SSL.
- Ensure your cloud database allows connections from all IPs (`0.0.0.0/0`), as Render free/starter instances use dynamic outgoing IP addresses.

### 3. Page Refresh Returns 404 on Vercel
- The repository includes [frontend/vercel.json](frontend/vercel.json) with SPA rewrites `{"source": "/(.*)", "destination": "/index.html"}`. Make sure your Vercel project's **Root Directory** is set to `frontend`.

### 4. Render Free Tier Spin-Down
- Render free tier web services spin down after 15 minutes of inactivity. When a request comes in, it may take ~30-50 seconds to wake up (cold start). For production uptime, consider upgrading Render to the Starter tier or using an uptime monitor (e.g., UptimeRobot) pinging `/api/health` every 10 minutes.
