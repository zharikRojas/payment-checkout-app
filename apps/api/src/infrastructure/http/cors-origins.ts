/** Comma-separated WEB_ORIGIN → CORS allowlist. Default: Vite local. */
export function parseWebOrigins(raw?: string): string[] {
  const list = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : ['http://localhost:5173'];
}
