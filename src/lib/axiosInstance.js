import axios from "axios";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export async function responseTest() {
    try {
        const response = await axiosInstance.get("/api/test");
        console.log("Response test:", response.data);
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        throw error;
    }
}
