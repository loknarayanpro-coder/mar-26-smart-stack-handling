import axios from 'axios';

// In dev (Vite), use same-origin /api so the proxy in vite.config.js forwards to Flask (port 5001).
// In production, set VITE_API_BASE_URL e.g. https://your-server.com/api
const baseURL =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? '/api' : 'https://smart-stack-handling.onrender.com/api');

const api = axios.create({
    baseURL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
