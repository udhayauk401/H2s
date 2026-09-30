/**
 * Real REST client for the SMART-H2S GUARD backend (see /backend).
 *
 * App.jsx currently runs against an in-memory mock store (see `makeApi`
 * inside App.jsx) so the UI works standalone with zero setup. To connect it
 * to the live MongoDB-backed API instead:
 *   1. Start the backend (see /backend/README.md) and set VITE_API_URL below
 *      (or in a .env file) to point at it, e.g. http://localhost:5000/api
 *   2. Replace the `makeApi` mock in App.jsx with calls into this module,
 *      and load initial data (workers/badges/scans/alerts/settings) via the
 *      GET helpers below in a useEffect on login instead of `seedDatabase()`.
 *
 * Every function here matches a real backend route 1:1.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let authToken = null;
export function setAuthToken(token) { authToken = token; }

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // ---- auth ----
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me"),

  // ---- workers ----
  listWorkers: (params = {}) => request(`/workers?${new URLSearchParams(params)}`),
  myWorker: () => request("/workers/me"),
  getWorker: (workerId) => request(`/workers/${workerId}`),
  createWorker: (payload) => request("/workers", { method: "POST", body: payload }),
  updateWorker: (workerId, patch) => request(`/workers/${workerId}`, { method: "PATCH", body: patch }),

  // ---- badges ----
  listBadges: () => request("/badges"),
  lookupBadge: (code) => request(`/badges/lookup/${encodeURIComponent(code)}`),
  createBadge: (payload) => request("/badges", { method: "POST", body: payload }),
  updateBadge: (badgeId, patch) => request(`/badges/${badgeId}`, { method: "PATCH", body: patch }),
  replaceBadge: (badgeId, payload) => request(`/badges/${badgeId}/replace`, { method: "POST", body: payload }),

  // ---- scans (the core barcode -> RGB -> exposure pipeline) ----
  submitScan: (payload) => request("/scans", { method: "POST", body: payload }),
  listScans: (params = {}) => request(`/scans?${new URLSearchParams(params)}`),

  // ---- exposure records / reports ----
  listExposureRecords: (params = {}) => request(`/exposure-records?${new URLSearchParams(params)}`),

  // ---- alerts ----
  listAlerts: (params = {}) => request(`/alerts?${new URLSearchParams(params)}`),
  resolveAlert: (alertId) => request(`/alerts/${alertId}/resolve`, { method: "PATCH" }),

  // ---- devices ----
  listDevices: () => request("/devices"),
  createDevice: (payload) => request("/devices", { method: "POST", body: payload }),
  updateDevice: (deviceId, patch) => request(`/devices/${deviceId}`, { method: "PATCH", body: patch }),

  // ---- settings ----
  getSettings: () => request("/settings"),
  updateSettings: (patch) => request("/settings", { method: "PATCH", body: patch }),
  listCalibrationModels: () => request("/settings/calibration-models"),
  createCalibrationModel: (payload) => request("/settings/calibration-models", { method: "POST", body: payload }),

  // ---- users ----
  listUsers: () => request("/users"),
  createUser: (payload) => request("/users", { method: "POST", body: payload }),
  updateUser: (userId, patch) => request(`/users/${userId}`, { method: "PATCH", body: patch }),
};
