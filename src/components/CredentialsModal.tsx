import React, { useState } from 'react';
import { getCredentials } from '../services/api';

interface CredentialsModalProps {
    instanceName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function CredentialsModal({ instanceName, isOpen, onClose }: CredentialsModalProps) {
    const [credentials, setCredentials] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen && instanceName) {
            fetchCredentials();
        }
    }, [isOpen, instanceName]);

    const fetchCredentials = async () => {
        setLoading(true);
        try {
            const res = await getCredentials(instanceName);
            if (res.success) {
                setCredentials(res.credentials);
            }
        } catch (error) {
            console.error('Error fetching credentials:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                        </svg>
                        Credenciales SSH
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Instance Name */}
                <div className="mb-4 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <p className="text-sm text-purple-300 font-mono">{instanceName}</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                ) : credentials ? (
                    <div className="space-y-3">
                        {/* Username */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Usuario</label>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-white font-mono">{credentials.username}</span>
                                <button
                                    onClick={() => copyToClipboard(credentials.username, 'username')}
                                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                    title="Copiar usuario"
                                >
                                    {copiedField === 'username' ? (
                                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Contraseña</label>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-white font-mono flex-1">
                                    {showPassword ? credentials.password : '••••••••••••'}
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                        title={showPassword ? 'Ocultar' : 'Mostrar'}
                                    >
                                        {showPassword ? (
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                            </svg>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(credentials.password, 'password')}
                                        className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                        title="Copiar contraseña"
                                    >
                                        {copiedField === 'password' ? (
                                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* IP Address */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">IP Pública</label>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-white font-mono">{credentials.ip}</span>
                                <button
                                    onClick={() => copyToClipboard(credentials.ip, 'ip')}
                                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                    title="Copiar IP"
                                >
                                    {copiedField === 'ip' ? (
                                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* SSH Command */}
                        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-3 border border-purple-500/30">
                            <label className="text-xs text-purple-300 uppercase tracking-wider mb-2 block">Comando SSH</label>
                            <div className="flex items-center justify-between gap-2">
                                <code className="text-sm text-white font-mono flex-1 break-all">
                                    ssh {credentials.username}@{credentials.ip}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(`ssh ${credentials.username}@${credentials.ip}`, 'ssh')}
                                    className="p-1.5 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                                    title="Copiar comando SSH"
                                >
                                    {copiedField === 'ssh' ? (
                                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Provider Info */}
                        <div className="mt-4 pt-3 border-t border-white/10">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Proveedor: <span className="text-white font-semibold">{credentials.provider?.toUpperCase()}</span></span>
                                <span>{credentials.zone || credentials.region}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        No se encontraron credenciales
                    </div>
                )}

                {/* Toast for copy feedback */}
                {copiedField && (
                    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        ¡Copiado!
                    </div>
                )}
            </div>
        </div>
    );
}
