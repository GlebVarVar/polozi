// Resolved once per worker. In Docker these point at compose service names
// (http://app, http://backoffice, http://api:3001); locally they default to
// the host-published dev ports.
export const APP_URL = process.env.APP_URL ?? "http://localhost:3002";
export const BO_URL = process.env.BO_URL ?? "http://localhost:3003";
export const API_URL = process.env.API_URL ?? "http://localhost:3001";
