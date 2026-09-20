import { axiosInstance } from "../lib/axiosInstance";

export async function registerAuthService(formData) {
    const { email, password, displayName } = formData;
    try {
        const response = await axiosInstance.post("/api/auth/register", {
            email,
            password,
            displayName
        });
        if (response.status === 201 && response.data?.token) {
            localStorage.setItem("token", response.data.token);
            if (response.data.officeId) {
                localStorage.setItem("officeId", response.data.officeId);
            }
        }
        return response;
    } catch (error) {
        console.error("Error al registrar al usuario:", error);
        const errorMsg = error.response?.data?.message || error.response?.data?.error || (error.response?.status === 500 ? "Error interno del servidor" : "Error al registrar la cuenta");
        const customError = new Error(errorMsg);
        customError.response = error.response;
        throw customError;
    }
}

export async function loginAuthService(data) {
    try {
        const response = await axiosInstance.post("/api/auth/login", data);
        if (response.data?.token) {
            localStorage.setItem("token", response.data.token);
            if (response.data.officeId) {
                localStorage.setItem("officeId", response.data.officeId);
            }
        }
        return response;
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        const errorMsg = error.response?.data?.message || error.response?.data?.error || (error.response?.status === 500 ? "Error interno del servidor" : "Error al iniciar sesión");
        const customError = new Error(errorMsg);
        customError.response = error.response;
        throw customError;
    }
}

export async function getSessionAuthService() {
    try {
        const response = await axiosInstance.get("/api/auth/return-user");
        return response;
    } catch (error) {
        console.error("Error al obtener la sesión:", error);
        throw error;
    }
}