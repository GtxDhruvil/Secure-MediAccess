import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // const response = await axios.post('/api/auth/refresh-token', {
          //   refreshToken
          const response = await api.post(endpoints.auth.refreshToken, {
                refreshToken
          });
          
          const newToken = response.data.token;
          localStorage.setItem('token', newToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.data?.error) {
      const errorMessage = error.response.data.error;
      
      // Don't show toast for validation errors
      if (error.response.status !== 422) {
        toast.error(errorMessage);
      }
    } else if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.');
    } else {
      toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    profile: '/api/auth/profile',
    changePassword: '/api/auth/change-password',
    refreshToken: '/api/auth/refresh-token',
  },
  
  // OTP
  otp: {
    requestAccess: '/api/otp/request-access',
    verifyOTP: '/api/otp/verify-otp',
    denyAccess: '/api/otp/deny-access',
    resendOTP: '/api/otp/resend-otp',
    pendingRequests: '/api/otp/pending-requests',
    requestDetails: (id) => `/api/otp/request/${id}`,
    cancelRequest: (id) => `/api/otp/request/${id}`,
    stats: '/api/otp/stats',
  },
  
  // Patient
  patient: {
    records: '/api/patient/records',
    uploadRecord: '/api/patient/records/upload',
    recordDetails: (id) => `/api/patient/records/${id}`,
    updateRecord: (id) => `/api/patient/records/${id}`,
    deleteRecord: (id) => `/api/patient/records/${id}`,
    searchRecords: '/api/patient/records/search',
    accessHistory: '/api/patient/access-history',
  },
  
  // Doctor
  doctor: {
    patients: '/api/doctor/patients',
    patientRecords: (patientId) => `/api/doctor/patients/${patientId}/records`,
    addPrescription: (patientId) => `/api/doctor/patients/${patientId}/prescriptions`,
    accessRequests: '/api/doctor/access-requests',
    patientSearch: '/api/doctor/patients/search',
  },
  
  // Files
  files: {
    upload: '/api/files/upload',
    download: (id) => `/api/files/${id}/download`,
    delete: (id) => `/api/files/${id}`,
  },
  
  // Audit
  audit: {
    logs: '/api/audit/logs',
    userActivity: (userId) => `/api/audit/user/${userId}`,
    securityEvents: '/api/audit/security',
    exportLogs: '/api/audit/export',
  },
};

// Helper functions
export const apiHelpers = {
  // Handle file uploads
  uploadFile: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post(endpoints.files.upload, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },
  
  // Handle file downloads
  downloadFile: async (fileId, filename) => {
    const response = await api.get(endpoints.files.download(fileId), {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  
  // Handle pagination
  getPaginatedData: async (endpoint, page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    
    return api.get(`${endpoint}?${params}`);
  },
  
  // Handle search with debouncing
  debouncedSearch: (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  },
};

export { api };
export default api;

