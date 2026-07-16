import { io } from "socket.io-client";
import { useState, useEffect } from "react"

const socketUrl = import.meta.env.VITE_API_URL

export const socket = io(socketUrl, {
    reconnection: true,
    reconnectionAttempts: Infinity, // Seguir intentando sin rendirse
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000, // Máximo 10 segundos entre intentos
    timeout: 60000, // Darle 60 segundos al servidor para responder (Render free tier)
    transports: ["websocket", "polling"],
    auth: {
        serverOffset: 0,
    },
});

export function useSocket() {
    const [onLine, setOnLine] = useState(false);

    useEffect(() => {
        socket.on("connect", () => {
            console.log("Connected to AdminGuideServer");
            setOnLine(true);
        });

        socket.on("connect_error", (err) => {
            console.log("Error connecting to AdminGuideServer:", err.message);
            setOnLine(false);
        });

        socket.on("disconected", (username) => {
            console.log("Usuario desconectado:", username);
        });
    }, []);

    return { socket, onLine }
}

