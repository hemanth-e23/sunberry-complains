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

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh the token by re-authenticating
                const username = localStorage.getItem('username');
                const password = localStorage.getItem('temp_password');

                if (username && password) {
                    const formData = new FormData();
                    formData.append('username', username);
                    formData.append('password', password);

                    const response = await api.post('/users/token', formData);
                    const newToken = response.data.access_token;

                    localStorage.setItem('token', newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;

                    return api(originalRequest);
                }
            } catch (refreshError) {
                // If refresh fails, logout
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                localStorage.removeItem('temp_password');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
