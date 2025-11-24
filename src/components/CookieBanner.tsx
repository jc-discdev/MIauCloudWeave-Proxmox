import React, { useState, useEffect } from 'react';

export default function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const getCookie = (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
    };

    const setCookie = (name: string, value: string, days: number) => {
        if (typeof document === 'undefined') return;
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    };

    useEffect(() => {
        const consent = getCookie('cookieConsent');
        if (!consent) {
            setShowBanner(true);
        }
    }, []);

    const acceptCookies = () => {
        setCookie('cookieConsent', 'accepted', 365);
        setShowBanner(false);
    };

    const rejectCookies = () => {
        setCookie('cookieConsent', 'rejected', 365);
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"></div>

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full pointer-events-auto animate-slideUp">
                    {/* Header */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">🍪 Política de Cookies</h2>
                                <p className="text-sm text-gray-400">Personaliza tu experiencia</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Utilizamos cookies para mejorar tu experiencia de navegación y recordar tus preferencias.
                            Al aceptar, nos ayudas a ofrecerte un mejor servicio.
                        </p>

                        {/* Dropdown */}
                        <div className="border border-white/10 rounded-lg overflow-hidden mt-2">
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between text-left"
                            >
                                <span className="text-sm font-medium text-white">¿Qué cookies guardamos?</span>
                                <svg
                                    className={`w-5 h-5 text-gray-400 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>

                            {showDetails && (
                                <div className="px-4 py-3 bg-black/20 space-y-3 text-sm">
                                    <div className="flex gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                        <div>
                                            <p className="font-medium text-white">Consentimiento (cookieConsent)</p>
                                            <p className="text-gray-400 text-xs mt-2">Guarda tu preferencia de cookies (365 días)</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                        <div>
                                            <p className="font-medium text-white">Burbuja de chat (chatBubbleDismissed)</p>
                                            <p className="text-gray-400 text-xs mt-2">Recuerda si has cerrado el mensaje del asistente (30 días)</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 pt-0 flex gap-3">
                        <button
                            onClick={rejectCookies}
                            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Rechazar
                        </button>
                        <button
                            onClick={acceptCookies}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all text-sm font-medium shadow-lg"
                        >
                            Aceptar todas
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </>
    );
}
