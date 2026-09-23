import { useState, useEffect } from "react";
import { registerAuthService, loginAuthService, getSessionAuthService } from "../services/authServices";
import { useConnect } from "../customHooks/useConnect";
import { getBrowserDeviceInfo } from "../lib/deviceInfo";

export default function SessionModal({ isOpen, onClose, addToast }) {
    const { onAuth, setOnAuth, currentUser, setCurrentUser, logout } = useConnect();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [logoutAllLoading, setLogoutAllLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        displayName: "",
        rememberMe: true,
    });

    // Reset errors and password visibility when modal opens or tab changes
    useEffect(() => {
        if (isOpen) {
            setErrorMsg("");
            setShowPassword(false);
        }
    }, [isOpen, isLogin]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen && !loading && !logoutAllLoading) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, loading, logoutAllLoading, onClose]);

    const handleSwitchTab = (loginTab) => {
        setIsLogin(loginTab);
        setErrorMsg("");
        setFormData({ email: "", password: "", displayName: "", rememberMe: true });
    };

    const authRegisterForm = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        try {
            const fetchdata = await registerAuthService(formData);
            if (fetchdata) {
                setFormData({
                    email: "",
                    password: "",
                    displayName: "",
                    rememberMe: true,
                });
                try {
                    const { data } = await getSessionAuthService();
                    if (data?.user) setCurrentUser?.(data.user);
                } catch { }

                setOnAuth(true);
                addToast?.("¡Cuenta creada e inicio de sesión exitoso!", "success");
                onClose();
            }
        } catch (err) {
            const msg = err.message || "Error al registrar la cuenta";
            setErrorMsg(msg);
            addToast?.(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const authLoginForm = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        try {
            const fetchdata = await loginAuthService({
                email: formData.email.trim(),
                password: formData.password,
                rememberMe: formData.rememberMe,
            });

            if (fetchdata?.status === 200 || fetchdata?.data?.status === 200 || fetchdata?.data?.ok) {
                setFormData({
                    displayName: "",
                    email: "",
                    password: "",
                    rememberMe: true,
                });
                try {
                    const { data } = await getSessionAuthService();
                    if (data?.user) setCurrentUser?.(data.user);
                } catch { }

                setOnAuth(true);
                addToast?.("¡Sesión iniciada con éxito! Bienvenido.", "success");
                onClose();
            }
        } catch (err) {
            const msg = err.message || "Error al iniciar sesión";
            setErrorMsg(msg);
            addToast?.(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async (allDevices = false) => {
        if (allDevices) {
            const confirmLogout = window.confirm("¿Seguro que deseas cerrar la sesión en TODOS los dispositivos y escáneres vinculados a esta cuenta?");
            if (!confirmLogout) return;
            setLogoutAllLoading(true);
        } else {
            setLoading(true);
        }

        try {
            await logout(allDevices);
            addToast?.(
                allDevices
                    ? "Sesiones cerradas en todos los dispositivos"
                    : "Sesión cerrada en este dispositivo",
                "success"
            );
            onClose();
        } catch (err) {
            addToast?.(err.message || "Error al cerrar sesión", "error");
        } finally {
            setLoading(false);
            setLogoutAllLoading(false);
        }
    };

    if (!isOpen) return null;

    const currentDeviceName = getBrowserDeviceInfo();

    return (
        <div
            onClick={() => !loading && !logoutAllLoading && onClose()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-[#0e1726] border border-[#1e3a5f] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-200"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e3a5f]/60 bg-[#121e33]/50">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            <UserHeaderIcon />
                        </div>
                        <h2 className="text-base font-semibold text-slate-100">
                            {onAuth ? "Perfil de Usuario" : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={() => !loading && !logoutAllLoading && onClose()}
                        disabled={loading || logoutAllLoading}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1e3a5f]/40 transition-colors disabled:opacity-40 cursor-pointer"
                        aria-label="Cerrar modal"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-6">
                    {/* If user is ALREADY authenticated: show profile info & logout options */}
                    {onAuth ? (
                        <div className="space-y-5">
                            <div className="p-4 rounded-xl bg-[#14233c]/60 border border-[#1e3a5f]/80 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-linear-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0">
                                    {(currentUser?.displayName || currentUser?.email || "U")[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-100 truncate">
                                            {currentUser?.displayName || "Usuario Operador"}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            En línea
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                        {currentUser?.email || "Sesión activa"}
                                    </p>
                                    {currentUser?.officeId && (
                                        <p className="text-[11px] font-mono-guide text-cyan-400/80 truncate mt-0.5">
                                            Oficina: {currentUser.officeId}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Device indicator banner */}
                            <div className="px-3.5 py-2.5 rounded-xl bg-[#080f1a] border border-[#1e3a5f]/50 flex items-center gap-2 text-xs text-slate-300">
                                <DevicesIcon />
                                <span className="text-slate-400">Dispositivo actual:</span>
                                <span className="text-cyan-300 font-medium truncate">{currentDeviceName}</span>
                            </div>

                            <div className="flex flex-col gap-2.5 pt-2">
                                <button
                                    type="button"
                                    disabled={loading || logoutAllLoading}
                                    onClick={() => handleLogout(false)}
                                    className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <LogoutIcon />
                                    )}
                                    <span>Cerrar Sesión en este dispositivo</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={loading || logoutAllLoading}
                                    onClick={() => handleLogout(true)}
                                    className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-amber-300/90 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                    title="Revoca todas las sesiones y refresh tokens en todos los dispositivos"
                                >
                                    {logoutAllLoading ? (
                                        <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <ShieldLockIcon />
                                    )}
                                    <span>Cerrar sesión en todos los dispositivos</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={loading || logoutAllLoading}
                                    onClick={() => {
                                        logout(false);
                                        setIsLogin(true);
                                    }}
                                    className="w-full py-2 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-slate-200 hover:bg-[#1e3a5f]/30 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    Cambiar de cuenta
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Login / Register Forms */
                        <>
                            {/* Tab selector */}
                            <div className="flex p-1 mb-5 bg-[#080f1a] rounded-xl border border-[#1e3a5f]/60">
                                <button
                                    type="button"
                                    onClick={() => handleSwitchTab(true)}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                        isLogin
                                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                                            : "text-slate-400 hover:text-slate-200"
                                    }`}
                                >
                                    Iniciar Sesión
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSwitchTab(false)}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                        !isLogin
                                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                                            : "text-slate-400 hover:text-slate-200"
                                    }`}
                                >
                                    Registro
                                </button>
                            </div>

                            {/* Error Alert Box */}
                            {errorMsg && (
                                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                                    <div className="shrink-0 mt-0.5 text-red-400">
                                        <AlertIcon />
                                    </div>
                                    <span className="flex-1 leading-relaxed">{errorMsg}</span>
                                </div>
                            )}

                            <form onSubmit={isLogin ? authLoginForm : authRegisterForm} className="space-y-4">
                                {/* Office / Display Name (Register only) */}
                                {!isLogin && (
                                    <div>
                                        <label htmlFor="displayName" className="block text-xs font-medium text-slate-300 mb-1.5">
                                            Nombre de Oficina / Operador
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                                <OfficeIcon />
                                            </div>
                                            <input
                                                id="displayName"
                                                type="text"
                                                required
                                                disabled={loading}
                                                value={formData.displayName}
                                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                                placeholder="Ej: Oficina Central / Sucursal 01"
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#080f1a] border border-[#1e3a5f] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                            <MailIcon />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            disabled={loading}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="operador@ejemplo.com"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#080f1a] border border-[#1e3a5f] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                {/* Password Field with Toggle */}
                                <div>
                                    <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1.5">
                                        Contraseña
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                            <LockIcon />
                                        </div>
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            disabled={loading}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#080f1a] border border-[#1e3a5f] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-50"
                                        />
                                        {/* Eye Toggle Button */}
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                                            title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                            aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                        >
                                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember Me Checkbox */}
                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.rememberMe}
                                            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                                            className="w-4 h-4 rounded bg-[#080f1a] border-[#1e3a5f] text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 focus:ring-1 cursor-pointer"
                                        />
                                        <span className="text-xs text-slate-300 font-medium">
                                            Recordar este dispositivo
                                        </span>
                                    </label>
                                    <span className="text-[10px] text-slate-400">
                                        {formData.rememberMe ? "90 días" : "24 horas"}
                                    </span>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-slate-900 bg-linear-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-[0_4px_16px_rgba(34,211,238,0.25)] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                            <span>{isLogin ? "Iniciando sesión…" : "Registrando…"}</span>
                                        </>
                                    ) : (
                                        <span>{isLogin ? "Iniciar Sesión" : "Crear Cuenta"}</span>
                                    )}
                                </button>
                            </form>

                            {/* Footer switch */}
                            <p className="mt-5 text-center text-xs text-slate-400">
                                {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}{" "}
                                <button
                                    type="button"
                                    onClick={() => handleSwitchTab(!isLogin)}
                                    className="text-cyan-400 hover:underline font-semibold cursor-pointer ml-1"
                                >
                                    {isLogin ? "Regístrate aquí" : "Inicia sesión"}
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Icons ─────────────────────────────────────────────────────────────

function UserHeaderIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function MailIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function OfficeIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
            <path d="M9 7h2" />
            <path d="M13 7h2" />
            <path d="M9 11h2" />
            <path d="M13 11h2" />
            <path d="M9 15h2" />
            <path d="M13 15h2" />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
    );
}

function AlertIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}

function ShieldLockIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
        </svg>
    );
}

function DevicesIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400 shrink-0">
            <rect x="4" y="2" width="16" height="12" rx="2" />
            <path d="M2 18h20" />
            <path d="M12 14v4" />
        </svg>
    );
}