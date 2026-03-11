import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // If 401, redirect to login
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('userRole');
            localStorage.removeItem('isSuperuser');
            // Only redirect if not already on login page
            if (!window.location.hash.includes('/login')) {
                window.location.href = '/#/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
