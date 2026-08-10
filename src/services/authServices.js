import { axiosInstance } from "../lib/axiosInstance";

export async function registerAuthService(formData) {
    const { email, password, displayName } = formData;
    try {
        const response = await axiosInstance.post("/api/auth/register", {
            email,
            password,
            displayName
        });
        if (response.status === 201) {
            localStorage.setItem("token", response.data.token);
            console.log("beta guardado!")
        }
        return response;
    } catch (error) {
        console.error("Error al registrar al usuario:", error);
        throw error;
    }
}

export async function loginAuthService(data) {
    try {
        const response = await axiosInstance.post("/api/auth/login", data);
        if (response.data?.token) {
            localStorage.setItem("token", response.data.token);
        }
        return response;
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        throw error;
    }
}


export function getSessionAuthService() {
    try {
        const response = axiosInstance.get("/api/auth/return-user");
        return response;
    } catch (error) {
        console.error("Error al obtener la sesión:", error);
        throw error;
    }
}