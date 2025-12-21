import { apiRequest } from './index';

export const getAdmins = () => apiRequest({ method: 'get', url: '/api/v1/user/admins' }).then((res) => ({ data: res }));

export const createAdmin = (payload) => apiRequest({ method: 'post', url: '/api/v1/user/admin/addnew', data: payload }).then((res) => ({ data: res }));
