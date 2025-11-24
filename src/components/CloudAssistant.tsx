import React, { useState, useRef, useEffect } from 'react';
import { askAi, executeAi } from '../services/api';

interface Message {
    role: 'user' | 'ai';
    content: string;
    command?: any; // JSON command if present
}

export default function CloudAssistant() {
    // Cookie helper functions
    const getCookie = (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
    };

    const setCookie = (name: string, value: string, days: number) => {
        if (typeof document === 'undefined') return;
        // Check if user has accepted cookies
        const consent = getCookie('cookieConsent');
        if (consent !== 'accepted') return; // Don't save cookies if not accepted

        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    };

    const [isOpen, setIsOpen] = useState(false);
    const [showNotification, setShowNotification] = useState(true);
    const [showBubble, setShowBubble] = useState(false);

    // Check cookie after component mounts (client-side only)
    useEffect(() => {
        const dismissed = getCookie('chatBubbleDismissed');
        if (dismissed !== 'true') {
            setShowBubble(true);
        }
    }, []);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Hola! Soy tu asistente de infraestructuras en el Cloud. ¿En qué puedo ayudarte hoy?' },
        { role: 'ai', content: 'Puedes pedirme que cree un cluster o una máquina virtual. Por ejemplo: "Crea un cluster con 3 máquinas" o "Crea una máquina virtual con 2 vCPUs y 4 GB de RAM".' },
        { role: 'ai', content: 'Actualmente funciono con AWS y Google Cloud Platform.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await askAi(userMsg);
            let aiMsg: Message = { role: 'ai', content: '' };

            // The backend returns { response: "..." } where response can be:
            // 1. A JSON string (command) - needs parsing
            // 2. Plain text string
            // 3. Already an object (shouldn't happen but handle it)

            if (typeof res.response === 'string') {
                try {
                    const parsedResponse = JSON.parse(res.response);

                    // Check if it's an ACTIONABLE command (not just informational)
                    // Only show confirmation card for commands that modify infrastructure
                    const actionableCommands = ['create_cluster', 'delete_cluster', 'delete_instance', 'start_cluster', 'stop_cluster'];

                    if (parsedResponse.command && actionableCommands.includes(parsedResponse.command)) {
                        aiMsg.content = `📋 ${(parsedResponse as any).explanation || 'He preparado una propuesta para ti basada en tu solicitud.'}`;
                        aiMsg.command = parsedResponse;
                    } else {
                        // It's JSON but not an actionable command, or it's informational
                        // Just show the explanation or the raw response
                        if (parsedResponse.explanation) {
                            aiMsg.content = (parsedResponse as any).explanation;
                        } else if (parsedResponse.result) {
                            // If there's a result field, format it nicely
                            aiMsg.content = typeof parsedResponse.result === 'string'
                                ? parsedResponse.result
                                : JSON.stringify(parsedResponse.result, null, 2);
                        } else {
                            aiMsg.content = res.response;
                        }
                    }
                } catch (e) {
                    // If parsing fails, it's plain text
                    aiMsg.content = res.response;
                }
            } else if (typeof res.response === 'object' && res.response.command) {
                // Already an object with command
                const actionableCommands = ['create_cluster', 'delete_cluster', 'delete_instance', 'start_cluster', 'stop_cluster'];

                if (actionableCommands.includes(res.response.command)) {
                    aiMsg.content = `📋 ${(res.response as any).explanation || 'He preparado una propuesta para ti basada en tu solicitud.'}`;
                    aiMsg.command = res.response;
                } else {
                    aiMsg.content = (res.response as any).explanation || "Comando recibido";
                }
            } else {
                aiMsg.content = "Lo siento, no he entendido la respuesta del servidor.";
            }

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'ai', content: "Lo siento, ha ocurrido un error al conectar con el cerebro." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteCommand = async (command: any) => {
        setLoading(true);
        setMessages(prev => [...prev, {
            role: 'ai',
            content: '⚙️ Ejecutando operación...'
        }]);

        try {
            // Call /ai/execute with the full command object
            const res = await executeAi(command);

            if (res.success) {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: `✅ ${res.explanation || '¡Operación completada exitosamente!'}`
                }]);

                // Specific actions based on command type
                if (command.command === 'create_cluster') {
                    setMessages(prev => [...prev, {
                        role: 'ai',
                        content: 'Redirigiendo a la página de gestión...'
                    }]);
                    // Navigate to gestio page after 1.5 seconds
                    setTimeout(() => {
                        window.location.href = '/gestio';
                    }, 1500);
                }
            } else {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: `❌ Error: ${res.error || 'No se pudo ejecutar la operación'}`
                }]);
            }

        } catch (error) {
            console.error('Error executing command:', error);
            setMessages(prev => [...prev, {
                role: 'ai',
                content: `❌ Error al ejecutar el comando: ${error instanceof Error ? error.message : String(error)}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <div
                className={`
                    pointer-events-auto
                    bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl
                    w-[350px] h-[460px] mb-4 flex flex-col overflow-hidden
                    transition-all duration-300 origin-bottom-right
                    ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}
                `}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <h3 className="font-bold text-white">Cloud Assistant AI</h3>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div
                                className={`
                                    max-w-[85%] p-3 rounded-2xl text-sm
                                    ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'}
                                `}
                            >
                                {msg.content}
                            </div>

                            {/* Command Card */}
                            {msg.command && (
                                <div className="mt-2 w-[85%] bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-purple-500/40 rounded-xl p-4 shadow-2xl overflow-hidden backdrop-blur-sm">
                                    <div className="text-xs font-bold text-purple-400 uppercase mb-2 tracking-wider flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        Propuesta de Cluster
                                    </div>
                                    <div className="text-sm text-gray-200 mb-3 space-y-2">
                                        {msg.command.parameters.gcp && (
                                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                                                <p className="font-semibold text-blue-400 mb-1">☁️ GCP</p>
                                                <p className="text-xs text-gray-300">
                                                    • {msg.command.parameters.gcp.count || 1} nodo(s)<br />
                                                    • Tipo: {msg.command.parameters.gcp.machine_type}<br />
                                                    • Zona: {msg.command.parameters.gcp.zone}
                                                </p>
                                            </div>
                                        )}
                                        {msg.command.parameters.aws && (
                                            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2">
                                                <p className="font-semibold text-orange-400 mb-1">☁️ AWS</p>
                                                <p className="text-xs text-gray-300">
                                                    • {msg.command.parameters.aws.min_count || 1} nodo(s)<br />
                                                    • Tipo: {msg.command.parameters.aws.instance_type}<br />
                                                    • Región: {msg.command.parameters.aws.region}
                                                </p>
                                            </div>
                                        )}
                                        {msg.command.parameters.cluster_type && (
                                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                                                <p className="text-xs text-purple-300">
                                                    🔧 Software: <span className="font-semibold">{msg.command.parameters.cluster_type}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleExecuteCommand(msg.command)}
                                            disabled={loading}
                                            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1 shadow-lg"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            {loading ? 'Desplegando...' : 'Confirmar y Desplegar'}
                                        </button>
                                        <button
                                            disabled={loading}
                                            className="px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white/60 hover:text-white/80 text-xs font-bold rounded-lg transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-start">
                            <div className="bg-white/5 rounded-2xl rounded-bl-none p-3 flex gap-1">
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-75"></div>
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 bg-gray-900/50 border-t border-white/10">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Escribe un comando..."
                            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all text-sm"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        </button>
                    </form>
                </div>
            </div>

            {/* Message Bubble */}
            {showBubble && showNotification && !isOpen && (
                <div className="mb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto animate-bounce">
                    <span className="text-sm font-medium">¡Tienes un mensaje!</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowBubble(false);
                            setCookie('chatBubbleDismissed', 'true', 30); // Cookie expires in 30 days
                        }}
                        className="text-white/80 hover:text-white transition-colors" >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        setShowNotification(false);
                        setShowBubble(false);
                        setCookie('chatBubbleDismissed', 'true', 30); // Cookie expires in 30 days
                    }
                }}
                className={`
                    pointer-events-auto
                    w-14 h-14 rounded-full shadow-2xl flex items-center justify-center
                    transition-all duration-300 hover:scale-110 active:scale-95
                    ${isOpen ? 'bg-red-500 rotate-45' : 'bg-gradient-to-r from-blue-600 to-purple-600'}
                    relative
                `}
            >
                {showNotification && !isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-gray-900"></span>
                    </span>
                )}
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
            </button>
        </div>
    );
}
