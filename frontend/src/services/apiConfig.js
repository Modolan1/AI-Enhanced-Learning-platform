function normalizeApiBaseUrl(rawValue) {
  let value = String(rawValue || '').trim().replace(/^['"]|['"]$/g, '');

  // Remove accidental whitespace that can become %20 in network calls.
  value = value.replace(/\s+/g, '');

  // Handle accidental leading slash before host, e.g. /api.example.com.
  value = value.replace(/^\/+/, '');

  if (!value) return '';

  // Default to https for deployed environments if scheme is missing.
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  value = value.replace(/\/+$/, '');

  if (!/\/api$/i.test(value)) {
    value = `${value}/api`;
  }

  return value;
}

export const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
export const apiOrigin = apiBaseUrl.replace(/\/api$/i, '');
