import { FACILITY_LABELS } from './constants';
import { Platform } from 'react-native';

const fallbackApiBaseUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl;

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();

  if (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '10.0.2.2' ||
    normalized.endsWith('.local')
  ) {
    return true;
  }

  const ipv4Match = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) {
    return false;
  }

  const first = Number(ipv4Match[1]);
  const second = Number(ipv4Match[2]);
  if (first === 10 || first === 127) {
    return true;
  }
  if (first === 172 && second >= 16 && second <= 31) {
    return true;
  }
  if (first === 192 && second === 168) {
    return true;
  }
  if (first === 169 && second === 254) {
    return true;
  }

  return false;
}

function preferSecureHttpUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' && !isPrivateHostname(parsed.hostname)) {
      parsed.protocol = 'https:';
      return parsed.toString();
    }
  } catch {
    return url;
  }

  return url;
}

function resolveApiOrigin(baseUrl: string) {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    return fallbackApiBaseUrl;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

const apiOrigin = resolveApiOrigin(apiBaseUrl);

export function getFacilityLabels(facilities: unknown): string[] {
  if (Array.isArray(facilities)) {
    return facilities.filter((item): item is string => typeof item === 'string');
  }

  if (facilities && typeof facilities === 'object') {
    return Object.entries(facilities as Record<string, unknown>)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => FACILITY_LABELS[key] ?? key);
  }

  return [];
}

export function getOpenedYear(openedAt?: string) {
  if (!openedAt) {
    return null;
  }

  const timestamp = new Date(openedAt).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp).getFullYear();
}

export function normalizeRemoteMediaUrl(url?: string | null): string | null {
  if (typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('file:')) {
    return preferSecureHttpUrl(trimmed);
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${apiOrigin}${normalizedPath}`;
}
