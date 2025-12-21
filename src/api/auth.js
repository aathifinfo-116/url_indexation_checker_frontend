import { apiRequest } from './index';

// Generic logout (legacy endpoint if present)
export const logout = () => apiRequest({ method: 'get', url: '/api/v1/auth/logout' }).then((res) => ({ data: res }));
// Explicit logout helpers for admin routes
export const logoutAdmin = () => apiRequest({ method: 'get', url: '/api/v1/auth/logout' }).then((res) => ({ data: res }));

// Small in-memory cache + in-flight dedupe to speed up repeated calls
const _meCache = {
	admin: { ts: 0, data: null },
};
const _inflight = {
	admin: null,
};
const DEFAULT_TTL_MS = 30 * 1000; // 30 seconds

async function _fetchMe(role) {
	if (role === 'admin') {
		return apiRequest({ method: 'get', url: '/api/v1/user/admin/me' }).then((res) => res);
	}
}

export async function getAdminMe(options = { force: false }) {
	const now = Date.now();
	if (!options.force && _meCache.admin.data && now - _meCache.admin.ts < DEFAULT_TTL_MS) {
		return { data: _meCache.admin.data };
	}

	if (_inflight.admin) {
		// join the in-flight promise
		const data = await _inflight.admin;
		return { data };
	}

	_inflight.admin = _fetchMe('admin').then((d) => {
		_meCache.admin = { ts: Date.now(), data: d };
		_inflight.admin = null;
		return d;
	}).catch((err) => { _inflight.admin = null; throw err; });

	const result = await _inflight.admin;
	return { data: result };
}


export const updateAdmin = (payload) => apiRequest({ method: 'put', url: '/api/v1/user/admin/update', data: payload }).then((res) => ({ data: res }));
