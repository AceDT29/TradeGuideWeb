import { axiosInstance } from "../lib/axiosInstance";
import { getBrowserDeviceInfo } from "../lib/deviceInfo";

/**
 * Guarda las credenciales de sesión en localStorage y notifica eventos de auth.
 */
function persistSessionData(data) {
    if (data?.token || data?.accessToken) {
        localStorage.setItem("token", data.accessToken || data.token);
    }
    if (data?.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
    }
    if (data?.officeId) {
        localStorage.setItem("officeId", data.officeId);
    }
}

/**
 * Limpia los datos de sesión locales.
 */
export function clearSessionData() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("officeId");
}

/**
 * Registro de nuevo usuario / oficina.
 */
export async function registerAuthService(formData) {
    const { email, password, displayName, rememberMe } = formData;
    try {
        const response = await axiosInstance.post("/api/auth/register", {
            email,
            password,
            displayName,
            rememberMe: Boolean(rememberMe),
            deviceInfo: getBrowserDeviceInfo(),
        });

        if ((response.status === 201 || response.status === 200) && response.data?.ok) {
            persistSessionData(response.data);
        }
        return response;
    } catch (error) {
        console.error("Error al registrar al usuario:", error);
        const errorMsg =
            error.response?.data?.message ||
            error.response?.data?.error ||
            (error.response?.status === 500 ? "Error interno del servidor" : "Error al registrar la cuenta");
        const customError = new Error(errorMsg);
        customError.response = error.response;
        throw customError;
    }
}

/**
 * Inicio de sesión con soporte para multi-dispositivo y rememberMe.
 */
export async function loginAuthService(data) {
    const { email, password, rememberMe } = data;
    try {
        const response = await axiosInstance.post("/api/auth/login", {
            email,
            password,
            rememberMe: Boolean(rememberMe),
            deviceInfo: getBrowserDeviceInfo(),
        });

        if (response.data?.ok) {
            persistSessionData(response.data);
        }
        return response;
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        const errorMsg =
            error.response?.data?.message ||
            error.response?.data?.error ||
            (error.response?.status === 500 ? "Error interno del servidor" : "Error al iniciar sesión");
        const customError = new Error(errorMsg);
        customError.response = error.response;
        throw customError;
    }
}

/**
 * Obtiene los datos del perfil del usuario actual autenticado.
 */
export async function getSessionAuthService() {
    try {
        const response = await axiosInstance.get("/api/auth/return-user");
        return response;
    } catch (error) {
        console.error("Error al obtener la sesión:", error);
        throw error;
    }
}

/**
 * Cierra la sesión revocando el refreshToken de este dispositivo en el servidor.
 */
export async function logoutAuthService() {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
        if (refreshToken) {
            await axiosInstance.post("/api/auth/logout", { refreshToken });
        }
    } catch (err) {
        console.warn("Error enviando logout al servidor:", err.message);
    } finally {
        clearSessionData();
    }
}

/**
 * Cierra la sesión en TODOS los dispositivos asociados a la cuenta del usuario.
 */
export async function logoutAllDevicesAuthService() {
    try {
        const response = await axiosInstance.post("/api/auth/logout-all");
        return response.data;
    } catch (err) {
        console.error("Error en logout-all:", err);
        throw err;
    } finally {
        clearSessionData();
    }
}