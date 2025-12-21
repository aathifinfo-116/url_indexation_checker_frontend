import { apiRequest } from "./index";

export const getUrlIndexation = () => 
    apiRequest({ 
        method: 'get', 
        url: '/api/v1/indexation/urls' 
    }).then((res) => ({ data: res }));


export const uploadUrlIndexationExcel = (formData) =>
    apiRequest({
        method: 'post',
        url: '/api/v1/indexation/urls/upload-excel',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then((res) => ({ data: res }));

export const createSingleUrlForIndexation = (formData) => 
    apiRequest({ 
        method: 'post',
        url: '/api/v1/indexation/urls/add-url', 
        data: formData,
    }).then((res) => ({ data: res }));


export const deleteUrlIndexation = (id) => 
    apiRequest({ 
        method: 'delete', 
        url: `/api/v1/indexation/urls/delete-url/${id}` 
    }).then((res) => ({ data: res }));

export const runSingleManualCheck = (id) => 
    apiRequest({ 
        method: 'post', 
        url: `/api/v1/indexation/urls/manual-check/${id}` 
    }).then((res) => ({ data: res }));
