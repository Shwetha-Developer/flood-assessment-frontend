# Flood Assessment App — Frontend PWA

Progressive Web App for field assessors to record flood damage
at chicken farms in Madison County, NC. Built for Ceres.

## Tech Stack
- React 18 + Vite 8
- Tailwind CSS v4
- Dexie.js (IndexedDB — offline storage)
- Axios (API calls)
- React Router v6
- vite-plugin-pwa (Service Worker)

## Requirements
- Node.js 18+
- npm
- Backend API running on localhost:8000

## Installation & Setup

### Step 1 — Clone Repository
```bash
git clone https://github.com/Shwetha-Developer/flood-assessment-frontend.git
cd flood-assessment-frontend
```

### Step 2 — Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 3 — Configure Environment
Create `.env` file in root:
```env
VITE_API_URL=http://127.0.0.1:8000/api
```

### Step 4 — Start Development Server
```bash
npm run dev
```
App runs at: `http://localhost:3000`

### Step 5 — Make Sure Backend is Running
```bash
# In separate terminal
cd flood-assessment-backend
php artisan serve
```

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Supervisor | supervisor@ceres.com | password123 |
| Assessor | assessor@ceres.com | password123 |

## Application Pages

| Page | Route | Role | Description |
|------|-------|------|-------------|
| Login | /login | All | Email/password login |
| Dashboard | / | Assessor | Home + sync status |
| New Assessment | /new-assessment | Assessor | Record farm damage |
| My Records | /assessments | Assessor | View own records |
| Supervisor Dashboard | /supervisor | Supervisor | All farms + export |

## How Offline Works