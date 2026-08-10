import { useEffect, useState } from "react";
import { registerAuthService, loginAuthService, getSessionAuthService } from "../services/authServices";
import { useConnect } from "../customHooks/useConnect";

export default function SessionModal({ isOpen, onClose }) {

    const { setOnAuth } = useConnect();
    const [isLogin, setIsLogin] = useState(true);

    const [formData, setFormdata] = useState({
        email: "",
        password: "",
        displayName: "",
    });

    const authRegisterForm = async (e) => {
        e.preventDefault();
        try {
            console.log(formData);
            const fetchdata = await registerAuthService(formData);
            if (fetchdata) {
                setFormdata({
                    email: "",
                    password: "",
                    displayName: "",
                });
                const { data } = await getSessionAuthService();
                setOnAuth(true);
                onClose(false);
                return data;
            }
        } catch (e) {
            console.log(e);
        }
    }

    const authLoginForm = async (e) => {
        e.preventDefault();
        try {
            const fetchdata = await loginAuthService({ email: formData.email, password: formData.password });
            if (fetchdata?.status === 200 || fetchdata?.data?.status === 200) {
                setFormdata({
                    displayName: "",
                    email: "",
                    password: ""
                });
                const { data } = await getSessionAuthService();
                setOnAuth(true);
                onClose(false);
                return data;
            }
        } catch (e) {
            console.log(e);
        }
    }

    if (!isOpen) return null;

    return (
        <div onClick={() => onClose(false)} className="fixed inset-0 bg-linear-to-t from-slate-900/75 to-slate-400/70 flex justify-center items-center z-50">
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg drop-shadow-2xl p-8 max-w-md w-full">
                {/* Modal Header with Conditional Switch */}
                <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsLogin(true)}
                            className={`text-xl font-bold cursor-pointer transition-colors ${isLogin
                                    ? "text-blue-600 border-b-2 border-blue-600 pb-0.5"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            Iniciar Sesión
                        </button>
                        <span className="text-xl text-gray-300 font-bold">/</span>
                        <button
                            type="button"
                            onClick={() => setIsLogin(false)}
                            className={`text-xl font-bold cursor-pointer transition-colors ${!isLogin
                                    ? "text-blue-600 border-b-2 border-blue-600 pb-0.5"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            Registro
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <form onSubmit={isLogin ? authLoginForm : authRegisterForm}>
                    {/* Campo solo visible en Registro */}
                    {!isLogin && (
                        <div className="mb-4">
                            <label htmlFor="office" className="block text-gray-700 text-sm font-bold mb-2">
                                Oficina
                            </label>
                            <input
                                type="text"
                                id="office"
                                value={formData.displayName}
                                onChange={(e) => setFormdata({ ...formData, displayName: e.target.value })}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormdata({ ...formData, email: e.target.value })}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={(e) => setFormdata({ ...formData, password: e.target.value })}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer"
                        >
                            {isLogin ? "Iniciar Sesión" : "Registrarse"}
                        </button>
                    </div>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}{" "}
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                        {isLogin ? "Regístrate aquí" : "Inicia sesión aquí"}
                    </button>
                </p>
            </div>
        </div>
    );
}