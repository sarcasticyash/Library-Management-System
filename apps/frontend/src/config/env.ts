/**
 * Cloud-Native Library Management System (LMS)
 * Frontend Environment Configuration
 */

export const env = {
  API_BASE_URL: import.meta.env?.VITE_API_BASE_URL ?? '/api/v1',
  IS_DEV: import.meta.env?.DEV ?? false,
  IS_PROD: import.meta.env?.PROD ?? false,
};
