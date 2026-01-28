// lib/api.ts
// Custom fetch wrapper with automatic auth header injection

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    details?: unknown;
  };
  timestamp: string;
};

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: Record<string, unknown> | unknown[] | string | null;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }

  async fetch<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    // Add auth header if token exists
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      body: undefined,
    };

    // Handle body serialization
    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    const startTime = performance.now();

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data: ApiResponse<T> = await response.json();

      const duration = Math.round(performance.now() - startTime);

      // Log response time for debugging (helps demonstrate Redis cache)
      console.log(
        `[API] ${options.method || "GET"} ${endpoint} - ${duration}ms`
      );

      return data;
    } catch (error) {
      // Network error or JSON parse error
      console.error(`[API Error] ${endpoint}:`, error);
      return {
        success: false,
        message: "Network error. Please check your connection.",
        data: null as T,
        error: {
          code: "NETWORK_ERROR",
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Convenience methods
  get<T>(endpoint: string, options?: FetchOptions) {
    return this.fetch<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(
    endpoint: string,
    body?: FetchOptions["body"],
    options?: FetchOptions
  ) {
    return this.fetch<T>(endpoint, { ...options, method: "POST", body });
  }

  put<T>(
    endpoint: string,
    body?: FetchOptions["body"],
    options?: FetchOptions
  ) {
    return this.fetch<T>(endpoint, { ...options, method: "PUT", body });
  }

  delete<T>(endpoint: string, options?: FetchOptions) {
    return this.fetch<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export types for use in components
export type { ApiResponse };
