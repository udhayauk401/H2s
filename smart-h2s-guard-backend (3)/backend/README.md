# SMART-H₂S GUARD — MRPL H₂S Exposure Monitoring & Safety Management System

## What's included

1. **Interactive frontend demo** (`smart-h2s-guard.jsx`, delivered separately as an artifact) —
   a complete, fully clickable Admin + Worker dashboard covering every page in the brief
   (Dashboard, Workers, Scan & Analysis, Exposure Records, Real-Time Monitoring, Device
   Management, Badge Management, Reports, Safety Alerts, User Management, Settings, Help —
   plus the Worker-side Dashboard, Profile, Scan & Analyze, Exposure History, Alerts,
   Settings). It runs entirely in the browser against an in-memory store shaped exactly
   like the MongoDB collections below, through a small `api` service layer whose function
   signatures mirror the REST endpoints here — so wiring it to this real backend is a
   matter of swapping each `api.*` function body for a `fetch()` call.

2. **This `/backend` folder** — a real Node.js + Express + Mongoose API against MongoDB,
   implementing the same data model, authentication, RBAC and scan-processing logic.

## Data flow

```
Passive Bi(III) strip  →  barcode scan  →  RGB sensor scan (reusable reader)
      →  POST /api/scans  →  resolve badge → worker
      →  colourIndex from RGB  →  estimatedH2Sppm from active CalibrationModel
      →  exposureDuration = time since worker's last scan
      →  cumulativeDosePpmHours += estimatedH2Sppm * exposureDuration * doseFactor
      →  safetyStatus from configurable Settings.thresholds
      →  Scan + ExposureRecord saved, Alert raised if WARNING/HIGH RISK
      →  Admin & Worker dashboards read from MongoDB
```

The disposable strip stays 100% passive — no battery, no ESP32, no BLE. All computation
happens in the reusable reader and/or this backend once RGB + barcode data reach the API.

## Collections / Models

| Collection        | Purpose                                                              |
|--------------------|-----------------------------------------------------------------------|
| `users`            | Login accounts, role = ADMIN or WORKER                               |
| `workers`          | Worker profile, references one `badge`                               |
| `badges`           | Passive strip identity — badgeId, barcode, status, expiry            |
| `devices`          | Reusable reader units (barcode + RGB scanner hardware)               |
| `scans`            | Raw capture: RGB, colour index, temp/humidity, computed exposure     |
| `exposureRecords`  | Reportable ledger entry generated 1:1 with each scan                 |
| `alerts`           | Raised automatically when a scan is WARNING or HIGH RISK             |
| `departments`      | Department list                                                      |
| `settings`         | Org info, configurable safety thresholds, notification prefs         |
| `calibrationModels`| Versioned colour→ppm calibration, one active at a time                |

## Running locally

```bash
cd backend
cp .env.example .env      # edit MONGODB_URI / JWT_SECRET
npm install
npm run seed               # creates settings, calibration model, admin + 2 demo workers
npm run dev                 # starts the API on http://localhost:5000
```

Demo logins after seeding:
- **Admin:** admin@mrpl.co.in / admin123
- **Worker:** arun.kumar@mrpl.co.in / worker123

## Key endpoints

- `POST /api/auth/login` — returns a JWT + user/role
- `GET /api/workers`, `POST /api/workers`, `PATCH /api/workers/:workerId` (Worker ID is immutable)
- `GET /api/badges`, `POST /api/badges`, `PATCH /api/badges/:badgeId`, `POST /api/badges/:badgeId/replace`
- `GET /api/badges/lookup/:code` — barcode/QR identification step
- `POST /api/scans` — the full scan → exposure → alert pipeline described above
- `GET /api/exposure-records` — filterable exposure history/reporting
- `GET /api/alerts`, `PATCH /api/alerts/:id/resolve`
- `GET/PATCH /api/settings` — configurable thresholds & calibration
- `GET/POST /api/devices`, `GET/POST /api/users`

All write routes are protected by JWT (`requireAuth`) and role checks (`requireRole`).
Workers can only read/write their own worker record, scans, exposure records and alerts.

## Connecting a real reader

`POST /api/scans` accepts `{ barcode | badgeId, rgb: {r,g,b}, temperature?, humidity?, readerDeviceId? }`.
A production reader (or a Bluetooth/serial gateway service) can call this endpoint directly
once it has read the barcode and captured the RGB response — no frontend changes required.
