export function getApiUrl(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  return raw.replace(/\/$/, '');
}
