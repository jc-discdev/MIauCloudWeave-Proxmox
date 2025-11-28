import React, { useState } from 'react';
import {
    createProxmoxVM,
    createCluster,
    type CreateProxmoxRequest,
    type ClusterCreateRequest
} from '../services/api';

export default function ClusterCreator() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Common state
    const [clusterName, setClusterName] = useState('my-cluster');
    const [nodeCount, setNodeCount] = useState(3);
    const [password, setPassword] = useState('');

    // VM Configuration
    const [vmType, setVmType] = useState<'qemu' | 'lxc'>('lxc');
    const [cores, setCores] = useState(2);
    const [memory, setMemory] = useState(2048);
    const [diskSize, setDiskSize] = useState(10);

    // Cluster type
    const [clusterType, setClusterType] = useState<string>('docker-swarm');
    const [useClusterMode, setUseClusterMode] = useState(true);

    const handleCreate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            let res;

            if (useClusterMode && clusterType === 'docker-swarm') {
                // Create Docker Swarm cluster with manager + workers
                const clusterPayload: ClusterCreateRequest = {
                    manager: {
                        name: `${clusterName}-manager`,
                        vm_type: vmType,
                        cores: cores,
                        memory: memory,
                        disk_size: diskSize
                    },
                    workers: [{
                        name: `${clusterName}-worker`,
                        vm_type: vmType,
                        cores: cores,
                        memory: memory,
                        disk_size: diskSize,
                        count: nodeCount - 1 // -1 because manager is separate
                    }]
                };

                res = await createCluster(clusterPayload);
            } else {
                // Create multiple standalone VMs
                const payload: CreateProxmoxRequest = {
                    name: clusterName,
                    vm_type: vmType,
                    cores: cores,
                    memory: memory,
                    disk_size: diskSize,
                    count: nodeCount,
                    password: password || undefined,
                    cluster_type: useClusterMode ? clusterType : undefined,
                    start: true
                };

                res = await createProxmoxVM(payload);
            }

            console.log('Create Result:', res);
            setResult(res);
        } catch (err: any) {
            setError(err.message || "Ha ocurrido un error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Crear Nuevo Cluster</h2>

            <div className="space-y-6">
                {/* Cluster Mode Toggle */}
                <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useClusterMode}
                            onChange={(e) => setUseClusterMode(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Configurar software de cluster automáticamente
                        </span>
                    </label>
                </div>

                {/* Basic Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre del Cluster</label>
                        <input
                            type="text"
                            value={clusterName}
                            onChange={(e) => setClusterName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                            placeholder="my-cluster"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Número de Nodos</label>
                        <input
                            type="number"
                            value={nodeCount}
                            onChange={(e) => setNodeCount(parseInt(e.target.value))}
                            min="1"
                            max="10"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                        />
                    </div>
                </div>

                {/* Cluster Type */}
                {useClusterMode && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Cluster (Software)</label>
                        <select
                            value={clusterType}
                            onChange={(e) => setClusterType(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                        >
                            <option value="docker-swarm">Docker Swarm</option>
                            <option value="kubernetes">Kubernetes (K3s)</option>
                            <option value="redis">Redis Cluster</option>
                            <option value="portainer">Portainer</option>
                        </select>
                    </div>
                )}

                {/* VM Type */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Virtualización</label>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setVmType('qemu')}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all ${vmType === 'qemu'
                                ? 'bg-blue-50 border-2 border-blue-500 text-blue-700 shadow-sm'
                                : 'bg-gray-50 border-2 border-transparent text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            🖥️ VM (QEMU)
                        </button>
                        <button
                            onClick={() => setVmType('lxc')}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all ${vmType === 'lxc'
                                ? 'bg-purple-50 border-2 border-purple-500 text-purple-700 shadow-sm'
                                : 'bg-gray-50 border-2 border-transparent text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            📦 Contenedor (LXC)
                        </button>
                    </div>
                </div>

                {/* Resource Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">CPU Cores</label>
                        <select
                            value={cores}
                            onChange={(e) => setCores(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                        >
                            {[1, 2, 4, 8, 16].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Memoria (MB)</label>
                        <select
                            value={memory}
                            onChange={(e) => setMemory(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                        >
                            {[512, 1024, 2048, 4096, 8192, 16384].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Disco (GB)</label>
                        <select
                            value={diskSize}
                            onChange={(e) => setDiskSize(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                        >
                            {[8, 10, 20, 40, 80, 100].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>

                {/* Optional Password */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Contraseña (Opcional)</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Se generará automáticamente si se deja vacío"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                    />
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleCreate}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg text-white font-bold text-lg shadow-lg transform transition-all hover:-translate-y-0.5 ${loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creando...
                        </span>
                    ) : 'Crear Cluster'}
                </button>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm">
                    {error}
                </div>
            )}

            {result && (
                <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg border border-green-100 text-sm">
                    <p className="font-bold mb-2">¡Cluster creado correctamente!</p>

                    {result.success && (
                        <div className="space-y-2">
                            {result.vmid && <p><strong>VM ID:</strong> {result.vmid}</p>}
                            {result.name && <p><strong>Nombre:</strong> {result.name}</p>}
                            {result.ip && <p><strong>IP:</strong> {result.ip}</p>}
                            {result.password && (
                                <p><strong>Contraseña:</strong> <code className="bg-green-100 px-2 py-1 rounded">{result.password}</code></p>
                            )}
                        </div>
                    )}

                    {/* Debug output */}
                    <details className="mt-3">
                        <summary className="cursor-pointer text-xs text-green-600 hover:text-green-800">Ver detalles completos</summary>
                        <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-60">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    );
}
