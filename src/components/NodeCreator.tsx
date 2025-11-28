import React, { useState } from 'react';
import {
  createProxmoxVM,
  type CreateProxmoxRequest
} from '../services/api';

export default function NodeCreator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // State
  const [name, setName] = useState('my-vm');
  const [vmType, setVmType] = useState<'qemu' | 'lxc'>('qemu');
  const [count, setCount] = useState(1);
  const [cores, setCores] = useState(2);
  const [memory, setMemory] = useState(2048);
  const [diskSize, setDiskSize] = useState(10);
  const [password, setPassword] = useState('');

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: CreateProxmoxRequest = {
        name,
        vm_type: vmType,
        cores,
        memory,
        disk_size: diskSize,
        count,
        password: password || undefined,
        start: true
      };

      const res = await createProxmoxVM(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Desplegar Nuevas Instancias</h2>

      <div className="space-y-6">
        {/* VM Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Virtualización</label>
          <div className="flex space-x-4">
            <button
              onClick={() => setVmType('qemu')}
              className={`flex-1 py-3 px-4 rounded-md transition-colors font-medium ${vmType === 'qemu'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              🖥️ VM (QEMU)
            </button>
            <button
              onClick={() => setVmType('lxc')}
              className={`flex-1 py-3 px-4 rounded-md transition-colors font-medium ${vmType === 'lxc'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              📦 Contenedor (LXC)
            </button>
          </div>
        </div>

        {/* Basic Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="my-vm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              max="10"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Resource Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPU Cores</label>
            <select
              value={cores}
              onChange={(e) => setCores(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 4, 8, 16].map(n => (
                <option key={n} value={n}>{n} vCPU</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Memoria (MB)</label>
            <select
              value={memory}
              onChange={(e) => setMemory(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[512, 1024, 2048, 4096, 8192, 16384].map(n => (
                <option key={n} value={n}>{n} MB</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disco (GB)</label>
            <select
              value={diskSize}
              onChange={(e) => setDiskSize(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[8, 10, 20, 40, 80, 100].map(n => (
                <option key={n} value={n}>{n} GB</option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña (Opcional)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Se generará automáticamente si se deja vacío"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button
            onClick={handleCreate}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md text-white font-bold text-lg transition-colors ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : vmType === 'qemu'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
          >
            {loading ? 'Creando...' : `Crear ${count} Instancia${count > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-md border border-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Success Message */}
      {result && (
        <div className="mt-6 p-4 bg-green-50 text-green-800 rounded-md border border-green-200">
          <h3 className="font-bold mb-2">¡Éxito!</h3>

          {result.success && (
            <div className="space-y-1 text-sm">
              {result.vmid && <p><strong>VM ID:</strong> {result.vmid}</p>}
              {result.name && <p><strong>Nombre:</strong> {result.name}</p>}
              {result.ip && <p><strong>IP:</strong> {result.ip}</p>}
              {result.password && (
                <p><strong>Contraseña:</strong> <code className="bg-green-100 px-2 py-1 rounded">{result.password}</code></p>
              )}
            </div>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-green-600 hover:text-green-800">Ver respuesta completa</summary>
            <pre className="mt-2 text-xs overflow-auto max-h-60 bg-white p-2 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
