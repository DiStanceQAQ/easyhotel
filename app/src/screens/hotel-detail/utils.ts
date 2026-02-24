import { FACILITY_LABELS } from './constants';
import { Platform } from 'react-native';

const fallbackApiBaseUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl;

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
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${apiOrigin}${normalizedPath}`;
}
