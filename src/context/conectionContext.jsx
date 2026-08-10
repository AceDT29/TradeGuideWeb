import { createContext, useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
export const ConectionContext = createContext();

export function ConnectContext({ children }) {
    const [onAuth, setOnAuth] = useState(false);
    const [socket, setSocket] = useState(null);

    console.log('onAuth', onAuth);

    useEffect(() => {
        if (onAuth) {
            const token = localStorage.getItem('token');
            const newSocket = io(socketUrl, {
                reconnection: true,
                reconnectionAttempts: Infinity, // Seguir intentando sin rendirse
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000, // Máximo 10 segundos entre intentos
                timeout: 60000, // Darle 60 segundos al servidor para responder (Render free tier)
                transports: ["websocket", "polling"],
                auth: {
                    token: token ? `Bearer ${token}` : "",
                    serverOffset: 0,
                },
            });
            setSocket(newSocket);
            newSocket.on("connect", () => {
                console.log("Connected to AdminGuideServer");
            });
            return () => {
                newSocket.disconnect();
                setSocket(null);
            };
        } else {
            setSocket(null);
        }
    }, [onAuth]);

    return (
        <ConectionContext.Provider value={{ setOnAuth, onAuth, socket }}>
            {children}
        </ConectionContext.Provider>
    )
}