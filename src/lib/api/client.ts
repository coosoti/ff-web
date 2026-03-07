// src/lib/api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
    cache?: boolean;
    cacheTTL?: number;
  }
}

interface CacheEntry {
  data: any;
  expiry: number;
}

class ApiClient {
  private client;
  private cache: Map<string, CacheEntry> = new Map();
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Add auth token
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Check cache for GET requests
        if (config.method?.toLowerCase() === 'get' && config.cache) {
          const cacheKey = this.getCacheKey(config);
          const cached = this.cache.get(cacheKey);
          
          if (cached && cached.expiry > Date.now()) {
            return {
              ...config,
              adapter: () => {
                return Promise.resolve({
                  data: cached.data,
                  status: 200,
                  statusText: 'OK',
                  headers: config.headers,
                  config,
                  request: {},
                });
              },
            };
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Cache successful GET responses
        if (response.config.method?.toLowerCase() === 'get' && response.config.cache) {
          const cacheKey = this.getCacheKey(response.config);
          this.cache.set(cacheKey, {
            data: response.data,
            expiry: Date.now() + (response.config.cacheTTL || 5 * 60 * 1000), // 5 min default
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for token refresh
            const token = await new Promise<string>((resolve) => {
              this.refreshSubscribers.push(resolve);
            });
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.client(originalRequest);
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.refreshSubscribers.forEach((cb) => cb(newToken));
            this.refreshSubscribers = [];
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getCacheKey(config: InternalAxiosRequestConfig): string {
    return `${config.method}:${config.url}:${JSON.stringify(config.params)}`;
  }

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      { token: refreshToken }
    );
    
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    return accessToken;
  }

  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Public methods
  get clientInstance() {
    return this.client;
  }

  clearCache() {
    this.cache.clear();
  }

  invalidateCache(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    // Invalidate cache entries that match pattern
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient.clientInstance;