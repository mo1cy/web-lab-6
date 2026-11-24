import { HttpError } from './errors.js';

const ALIAS_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;
const RESERVED = new Set(['api', 'docs', 'health']);
const MAX_URL_LENGTH = 2048;

export function parseUrl(value) {
  const invalid = () =>
    new HttpError(400, 'INVALID_URL', 'Адреса має бути абсолютною і починатися з http:// або https://');

  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_URL_LENGTH) {
    throw invalid();
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw invalid();
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw invalid();
  return url.href;
}

export function checkAlias(value) {
  if (typeof value !== 'string' || !ALIAS_PATTERN.test(value)) {
    throw new HttpError(400, 'INVALID_ALIAS', 'Alias: 3–32 символи, лише латиниця, цифри, _ і -');
  }
  if (RESERVED.has(value.toLowerCase())) {
    throw new HttpError(409, 'ALIAS_TAKEN', 'Цей alias зарезервований');
  }
  return value;
}