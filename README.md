# Flood Assessment App — Frontend

Progressive Web App (PWA) for field assessors to record 
flood damage at chicken farms in Madison County, NC.

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- Dexie.js (IndexedDB offline storage)
- Axios (API calls)
- React Router v6
- PWA (Service Worker + Web Manifest)

## Key Features
- Works fully offline (PWA)
- GPS location auto-detection
- Photo capture from camera
- Automatic sync when internet returns
- Role-based views (Assessor / Supervisor)
- CSV export for supervisor

## Setup Instructions

### Requirements
- Node.js 18+
- npm

### Installation

1. Clone the repository
```bash
   git clone https://github.com/YOUR_USERNAME/flood-assessment-frontend.git
   cd flood-assessment-frontend
```

2. Install dependencies
```bash
   npm install --legacy-peer-deps
```

3. Configure environment
```bash
   cp .env.example .env
```
   Update `.env`:
```env
   VITE_API_URL=http://127.0.0.1:8000/api
```

4. Start development server
```bash
   npm run dev
```

5. Open browser