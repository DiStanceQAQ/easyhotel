import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { ResponseEnvelope } from '../types/api';

export class ApiError extends Error {
  code: number;
  status?: number;
  requestId?: string;

  constructor(message: string, code: number, status?: number, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

const fallbackBaseUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackBaseUrl;

const http = axios.create({
  baseURL,
  timeout: 15000,
});

http.interceptors.response.use(
  (response) => {
    const payload = response.data as ResponseEnvelope<unknown> | undefined;
    if (
      payload &&
      typeof payload === 'object' &&
      typeof payload.code === 'number'
    ) {
      if (payload.code !== 0) {
        throw new ApiError(
          payload.message || '业务请求失败',
          payload.code,
          response.status,
          payload.requestId,
        );
      }
      response.data = payload.data;
    }

    return response;
  },
  (error: AxiosError<ResponseEnvelope<unknown>>) => {
    const payload = error.response?.data;
    if (payload && typeof payload.code === 'number') {
      throw new ApiError(
        payload.message || '业务请求失败',
        payload.code,
        error.response?.status,
        payload.requestId,
      );
    }

    const message = error.message || '网络错误，请稍后重试';
    throw new ApiError(message, -1, error.response?.status);
  },
);

export async function getData<T>(
  url: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const response = await http.get<T>(url, { params });
  return response.data;
}

export default http;
