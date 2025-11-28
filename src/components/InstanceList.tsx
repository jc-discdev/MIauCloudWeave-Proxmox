import React, { useState, useEffect } from 'react';
import {
    listProxmoxVMs,
    deleteProxmoxVM,
    startProxmoxVM,
    stopProxmoxVM,
    type ProxmoxVM
} from '../services/api';

export default function InstanceList() {
    const [vms, setVms] = useState<ProxmoxVM[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await listProxmoxVMs();
                if (res.success) {
                    setVms(res.vms || []);
                }
            } catch (err) {
                console.error("Failed to load VMs", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [refreshKey]);

    const refresh = () => setRefreshKey(k => k + 1);

    const handleDelete = async (name: string) => {
        if (!confirm(`¿Eliminar la VM/contenedor ${name}?`)) return;
        try {
            await deleteProxmoxVM(name);
            refresh();
        } catch (err) {
            alert("Error al eliminar la instancia");
        }
    };

    const handleStart = async (name: string) => {
        try {
            await startProxmoxVM(name);
            refresh();
        } catch (err) {
            alert("Error al iniciar la instancia");
        }
    };

    const handleStop = async (name: string) => {
        if (!confirm(`¿Detener ${name}?`)) return;
        try {
            await stopProxmoxVM(name);
            refresh();
        } catch (err) {
            alert("Error al detener la instancia");
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-6xl mx-auto my-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">VMs y Contenedores Activos</h2>
                <button
                    onClick={refresh}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                    Actualizar
                </button>
            </div>

            {loading && <p className="text-gray-500 text-center py-4">Cargando instancias...</p>}

            {vms.length === 0 && !loading ? (
                <p className="text-gray-400 italic text-center py-8">No hay instancias activas.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RAM</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disco</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nodo</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {vms.map((vm) => (
                                <tr key={vm.vmid} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="text-lg mr-2">{vm.type === 'qemu' ? '🖥️' : '📦'}</span>
                                            <span className="font-medium text-gray-900">{vm.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${vm.type === 'qemu'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-purple-100 text-purple-800'
                                            }`}>
                                            {vm.type === 'qemu' ? 'VM' : 'LXC'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${vm.status === 'running'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {vm.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {vm.cpu} vCPU
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {vm.memory} MB
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {vm.disk} GB
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                        {vm.ip || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {vm.node}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            {vm.status === 'running' ? (
                                                <button
                                                    onClick={() => handleStop(vm.name)}
                                                    className="text-yellow-600 hover:text-yellow-900"
                                                    title="Detener"
                                                >
                                                    ⏸️
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleStart(vm.name)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Iniciar"
                                                >
                                                    ▶️
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(vm.name)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
