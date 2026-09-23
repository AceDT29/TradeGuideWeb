import { createContext, useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import {
    getSessionAuthService,
    logoutAuthService,
    logoutAllDevicesAuthService,
    clearSessionData
} from "../services/authServices";

const socketUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
export const ConectionContext = createContext();

export function ConnectContext({ children }) {
    const [onAuth, setOnAuth] = useState(() => Boolean(localStorage.getItem('token')));
    const [currentUser, setCurrentUser] = useState(null);
    const [socket, setSocket] = useState(null);

    // Escuchar eventos globales del interceptor de autenticación
    useEffect(() => {
        const handleUnauthorized = () => {
            setOnAuth(false);
            setCurrentUser(null);
            if (socket) {
                socket.disconnect();
            }
        };

        const handleTokenRefreshed = (e) => {
            const newToken = e.detail?.token;
            const officeId = e.detail?.officeId || localStorage.getItem('officeId');
            if (socket && socket.auth) {
                socket.auth.token = newToken ? `Bearer ${newToken}` : "";
                if (officeId) socket.auth.officeId = officeId;
            }
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        window.addEventListener('auth:token-refreshed', handleTokenRefreshed);

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
            window.removeEventListener('auth:token-refreshed', handleTokenRefreshed);
        };
    }, [socket]);

    useEffect(() => {
        if (onAuth) {
            const token = localStorage.getItem('token');
            const officeId = localStorage.getItem('officeId');

            // Cargar datos del usuario
            getSessionAuthService()
                .then(res => {
                    if (res?.data?.user) {
                        setCurrentUser(res.data.user);
                    }
                })
                .catch(() => {
                    // Si falla y no pudo refrescarse, el interceptor ya habrá disparado unauthorized
                });

            // Conexión del Socket con credenciales
            const newSocket = io(socketUrl, {
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000,
                timeout: 60000,
                transports: ["websocket", "polling"],
                auth: {
                    token: token ? `Bearer ${token}` : "",
                    officeId: officeId ?? "",
                    serverOffset: 0,
                },
                withCredentials: true
            });

            setSocket(newSocket);
            newSocket.on("connect", () => {
                console.log("[TradeWeb Socket] Conectado al servidor de guías");
            });

            return () => {
                newSocket.disconnect();
                setSocket(null);
            };
        } else {
            if (socket) {
                socket.disconnect();
            }
            setSocket(null);
            setCurrentUser(null);
        }
    }, [onAuth]);

    const logout = useCallback(async (allDevices = false) => {
        try {
            if (allDevices) {
                await logoutAllDevicesAuthService();
            } else {
                await logoutAuthService();
            }
        } catch (err) {
            console.error("Error al cerrar sesión:", err);
            clearSessionData();
        } finally {
            setOnAuth(false);
            setCurrentUser(null);
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [socket]);

    return (
        <ConectionContext.Provider value={{ setOnAuth, onAuth, socket, currentUser, setCurrentUser, logout }}>
            {children}
        </ConectionContext.Provider>
    );
}