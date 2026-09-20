import { createContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import { getSessionAuthService } from "../services/authServices";

const socketUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
export const ConectionContext = createContext();

export function ConnectContext({ children }) {
    const [onAuth, setOnAuth] = useState(() => Boolean(localStorage.getItem('token')));
    const [currentUser, setCurrentUser] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (onAuth) {
            const token = localStorage.getItem('token');
            const officeId = localStorage.getItem('officeId');

            getSessionAuthService()
                .then(res => {
                    if (res?.data?.user) {
                        setCurrentUser(res.data.user);
                    }
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('officeId');
                    setOnAuth(false);
                    setCurrentUser(null);
                });

            const newSocket = io(socketUrl, {
                reconnection: true,
                reconnectionAttempts: Infinity, // Seguir intentando sin rendirse
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000, // Máximo 10 segundos entre intentos
                timeout: 60000, // Darle 60 segundos al servidor para responder (Render free tier)
                transports: ["websocket", "polling"],
                auth: {
                    // El servidor valida el token y cross-valida que officeId
                    // coincide con el firmado en el token antes de unir a la sala.
                    token: token ? `Bearer ${token}` : "",
                    officeId: officeId ?? "",
                    serverOffset: 0,
                },
                withCredentials: true
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
            setCurrentUser(null);
        }
    }, [onAuth]);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('officeId');
        setOnAuth(false);
        setCurrentUser(null);
    };

    return (
        <ConectionContext.Provider value={{ setOnAuth, onAuth, socket, currentUser, setCurrentUser, logout }}>
            {children}
        </ConectionContext.Provider>
    );
}