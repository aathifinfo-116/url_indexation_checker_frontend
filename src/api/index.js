/*
+--------------------------------------------------------------------------+
| Production-grade shared axios instance for all API modules               |
| Features:                                                                |
|  - Centralized baseURL and headers                                       |
|  - Request/response logging (toggleable)                                 |
|  - Automatic refresh token handling (pluggable refresh handler)          |
|  - Retry logic with exponential backoff for transient/network errors     |
|  - Utility to normalize errors for consistent consumption                |
+--------------------------------------------------------------------------+
 */

import axios from "axios";
import { API_BASE_URL } from "../config";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000, // 15s default timeout to avoid hanging requests
});

// --- Configuration / runtime state ---
let refreshTokenHandler = null; // async function that should return a new access token string
let isRefreshing = false;
let refreshSubscribers = [];
let enableLogging = process.env.NODE_ENV !== "production";
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 300;

function log(...args) {
  if (enableLogging) console.debug("[api]", ...args);
}

export function setLogging(enabled) {
  enableLogging = !!enabled;
}

export function setRefreshTokenHandler(fn) {
  refreshTokenHandler = fn;
}

export function setAuthToken(token) {
  if (token)
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete apiClient.defaults.headers.common["Authorization"];
}

export function clearAuthToken() {
  delete apiClient.defaults.headers.common["Authorization"];
}

// Helper to call all queued subscribers after refresh completes
function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Normalize axios/other errors into a lightweight structure while preserving original error
export function normalizeError(err) {
  const normalized = {
    message:
      (err &&
        (err.message ||
          (err.response && err.response.data && err.response.data.message))) ||
      "Unknown error",
    status: err && err.response ? err.response.status : null,
    code: err && err.code ? err.code : null,
    details:
      err && err.response && err.response.data ? err.response.data : null,
    originalError: err,
  };
  return normalized;
}

// Interceptor: request logging
apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };
    log("req →", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    log("req err →", error);
    return Promise.reject(error);
  }
);

// Interceptor: response handling with retry + refresh logic
apiClient.interceptors.response.use(
  (response) => {
    // attach timing info
    if (response.config && response.config.metadata) {
      response.config.metadata.endTime = new Date();
      response.duration =
        response.config.metadata.endTime - response.config.metadata.startTime;
      log(
        "res ←",
        response.status,
        response.config.url,
        `${response.duration}ms`
      );
    }
    return response;
  },
  async (error) => {
    const { config, response } = error || {};

    // If no config (non-request error), just forward
    if (!config) return Promise.reject(error);

    // Ensure we have a retry counter
    config.__retryCount = config.__retryCount || 0;

    // 1) Handle 401 Unauthorized by attempting refresh-handler if provided
    if (
      response &&
      response.status === 401 &&
      typeof refreshTokenHandler === "function"
    ) {
      // Prevent infinite loops
      if (config.__isRetryRequest) return Promise.reject(error);

      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token) => {
            if (token) {
              config.headers["Authorization"] = `Bearer ${token}`;
            }
            config.__isRetryRequest = true;
            resolve(apiClient.request(config));
          });
        });
      }

      try {
        isRefreshing = true;
        const newToken = await refreshTokenHandler();
        if (newToken) {
          setAuthToken(newToken);
          onRefreshed(newToken);
          config.headers["Authorization"] = `Bearer ${newToken}`;
          config.__isRetryRequest = true;
          const result = await apiClient.request(config);
          return result;
        }
      } catch (refreshError) {
        // Refresh failed — clear queued requests and forward original error
        refreshSubscribers = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 2) Retry logic for transient errors (network errors, timeouts, 5xx)
    const shouldRetry =
      !response ||
      (response.status >= 500 && response.status <= 599) ||
      error.code === "ECONNABORTED";
    if (shouldRetry && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, config.__retryCount - 1);
      log(
        `retrying ${config.url} attempt ${config.__retryCount} after ${delay}ms`
      );
      await wait(delay);
      return apiClient.request(config);
    }

    // 3) No recovery — attach normalized info and forward
    error.normalized = normalizeError(error);
    log(
      "res err ←",
      error.normalized.status,
      config.url,
      error.normalized.message
    );
    return Promise.reject(error);
  }
);

// Convenience helper: perform a request and return response.data or throw normalized error
export async function apiRequest(config) {
  try {
    const res = await apiClient.request(config);
    return res.data;
  } catch (err) {
    // If axios produced a normalized error via interceptor, use it; otherwise normalize now
    const normalized =
      err && err.normalized ? err.normalized : normalizeError(err);
    const e = new Error(normalized.message);
    e.status = normalized.status;
    e.code = normalized.code;
    e.details = normalized.details;
    e.original = normalized.originalError || err;
    throw e;
  }
}

export default apiClient;
