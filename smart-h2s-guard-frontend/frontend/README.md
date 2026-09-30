# SMART-H₂S GUARD — Frontend

React + Vite frontend for the MRPL H₂S Exposure Monitoring & Safety Management System.

## Run standalone (no backend needed)

`src/App.jsx` seeds itself with realistic demo data (workers, badges, scans, alerts,
settings) and runs entirely client-side — good for demos, UI review, and design work.

```bash
npm install
npm run dev
```

Open http://localhost:5173. Demo logins:
- **Admin:** admin@mrpl.co.in / admin123
- **Worker:** arun.kumar@mrpl.co.in / worker123

## Connect to the real backend

The companion `/backend` folder is a Node/Express + MongoDB API implementing the same
data model. To wire this frontend to it:

1. Get the backend running (see `../backend/README.md`) and copy `.env.example` to `.env`
   here, pointing `VITE_API_URL` at it (default `http://localhost:5000/api`).
2. Use `src/api.js` — a REST client whose functions map 1:1 to the backend routes
   (`api.login`, `api.submitScan`, `api.listWorkers`, etc.) — in place of the in-memory
   `makeApi()` mock defined near the top of `App.jsx`. Store the JWT returned from
   `api.login()` with `setAuthToken()` and load initial data via the `list*`/`get*`
   helpers in a `useEffect` after login instead of calling `seedDatabase()`.

## Project structure

```
frontend/
├─ index.html
├─ package.json
├─ vite.config.js
├─ .env.example
└─ src/
   ├─ main.jsx     # React entry point
   ├─ App.jsx       # Full application: layout, pages, mock data + service layer
   └─ api.js        # Real REST client for the live backend (see comments inside)
```

## Design system

- Dark navy sidebar (`#0B2140`), light background (`#EEF3F9`), blue accent (`#1D6FE0`)
- Status colors: SAFE (green), MODERATE (yellow), WARNING (orange), HIGH RISK (red)
- Responsive: sidebar collapses to a drawer under 900px, grids stack to a single column,
  tables scroll horizontally on small screens
