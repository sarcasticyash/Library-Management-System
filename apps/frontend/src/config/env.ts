/**
 * Cloud-Native Library Management System (LMS)
 * Frontend Environment Configuration
 */

function getNormalizedApiBaseUrl(): string {
  let url = import.meta.env?.VITE_API_BASE_URL;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '/api/v1';
  }
  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
}

export const env = {
  API_BASE_URL: getNormalizedApiBaseUrl(),
  IS_DEV: import.meta.env?.DEV ?? false,
  IS_PROD: import.meta.env?.PROD ?? false,
};
