// Re-export API_BASE_URL from a dedicated config to avoid circular imports
export { API_BASE_URL } from "./config";

import apiClient, {
  apiRequest,
  setAuthToken,
  clearAuthToken,
  setRefreshTokenHandler,
  setLogging,
  normalizeError,
} from "./api/index";

export {
  apiClient,
  apiRequest,
  setAuthToken,
  clearAuthToken,
  setRefreshTokenHandler,
  setLogging,
  normalizeError,
};
export default apiClient;
