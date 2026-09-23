import axios from "axios";
import { getBrowserDeviceInfo } from "./deviceInfo";

const BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor de Petición: adjuntar Access Token Bearer si existe
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Variables para gestionar la cola de refresco silencioso
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Interceptor de Respuesta: capturar 401 y realizar rotación de token silenciosa
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Si no hay respuesta o la ruta es de autenticación básica, no intentar refrescar
        if (
            !error.response ||
            originalRequest.url?.includes('/api/auth/login') ||
            originalRequest.url?.includes('/api/auth/register') ||
            originalRequest.url?.includes('/api/auth/refresh') ||
            originalRequest.url?.includes('/api/auth/logout')
        ) {
            return Promise.reject(error);
        }

        // Si recibimos 401 (ej. TOKEN_EXPIRED) y no se ha reintentado aún
        if (error.response.status === 401 && !originalRequest._retry) {
            const refreshToken = localStorage.getItem('refreshToken');

            // Si no tenemos refreshToken, la sesión caducó por completo
            if (!refreshToken) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('officeId');
                window.dispatchEvent(new Event('auth:unauthorized'));
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Encolar peticiones mientras se completa el refresco activo
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosInstance(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Petición directa con axios base para evitar bucles de interceptores
                const res = await axios.post(`${BASE_URL}/api/auth/refresh`, {
                    refreshToken,
                    deviceInfo: getBrowserDeviceInfo(),
                });

                if (res.data?.ok && res.data?.accessToken) {
                    const newAccessToken = res.data.accessToken;
                    const newRefreshToken = res.data.refreshToken;

                    localStorage.setItem('token', newAccessToken);
                    if (newRefreshToken) {
                        localStorage.setItem('refreshToken', newRefreshToken);
                    }
                    if (res.data.officeId) {
                        localStorage.setItem('officeId', res.data.officeId);
                    }

                    // Notificar a otros módulos (ej. Socket.io) del nuevo token
                    window.dispatchEvent(new CustomEvent('auth:token-refreshed', {
                        detail: { token: newAccessToken, officeId: res.data.officeId }
                    }));

                    processQueue(null, newAccessToken);
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return axiosInstance(originalRequest);
                } else {
                    throw new Error('REFRESH_FAILED');
                }
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('officeId');
                window.dispatchEvent(new Event('auth:unauthorized'));
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);