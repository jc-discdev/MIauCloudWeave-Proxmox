import React, { useState, useEffect } from 'react';
import {
    getGcpInstanceTypes,
    getAwsInstanceTypes,
    createGcpInstance,
    createAwsInstance,
    createAllInstances,
    type GcpInstanceType,
    type AwsInstanceType
} from '../services/api';

// ... (rest of imports)

// ... inside component ...



export default function ClusterCreator() {
    const [provider, setProvider] = useState<'gcp' | 'aws'>('gcp');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Common state
    const [count, setCount] = useState(1);
    const [password, setPassword] = useState('');

    // GCP state
    const [gcpZone, setGcpZone] = useState('europe-west1-b');
    const [gcpCpus, setGcpCpus] = useState(2);
    const [gcpRam, setGcpRam] = useState(4);
    const [gcpTypes, setGcpTypes] = useState<GcpInstanceType[]>([]);
    const [gcpSelectedType, setGcpSelectedType] = useState('');
    const [gcpImageProject, setGcpImageProject] = useState('ubuntu-os-cloud');
    const [gcpImageFamily, setGcpImageFamily] = useState('ubuntu-2204-lts');
    const [gcpName, setGcpName] = useState('gcp-cluster');

    // AWS state
    const [awsRegion, setAwsRegion] = useState('us-west-2');
    const [awsVcpus, setAwsVcpus] = useState(2);
    const [awsMemory, setAwsMemory] = useState(4);
    const [awsTypes, setAwsTypes] = useState<AwsInstanceType[]>([]);
    const [awsSelectedType, setAwsSelectedType] = useState('');
    const [awsImageId, setAwsImageId] = useState('ami-03c1f788292172a4e');
    const [awsName, setAwsName] = useState('aws-cluster');

    // Hybrid and cluster type state
    const [clusterType, setClusterType] = useState<string>('');
    const [isHybrid, setIsHybrid] = useState(false);


    useEffect(() => {
        async function loadTypes() {
            try {
                if (isHybrid) {
                    // Parallel loading for hybrid mode - MUCH faster!
                    const [gcpTypesRaw, awsTypesRaw] = await Promise.all([
                        getGcpInstanceTypes(gcpZone, gcpCpus, gcpRam),
                        getAwsInstanceTypes(awsRegion, awsVcpus, awsMemory)
                    ]);

                    // Process GCP types
                    const x86GcpTypes = gcpTypesRaw.filter(t => !t.name.startsWith('t2a-'));
                    setGcpTypes(x86GcpTypes);
                    if (x86GcpTypes.length > 0) {
                        setGcpSelectedType(prev => x86GcpTypes.find(t => t.name === prev) ? prev : x86GcpTypes[0].name);
                    } else {
                        setGcpSelectedType('');
                    }

                    // Process AWS types
                    let x86AwsTypes = awsTypesRaw.filter(t => !t.instance_type.includes('g.'));
                    x86AwsTypes.sort((a, b) => {
                        if (a.vcpus !== b.vcpus) return a.vcpus - b.vcpus;
                        return a.memory_gb - b.memory_gb;
                    });
                    setAwsTypes(x86AwsTypes);
                    if (x86AwsTypes.length > 0) {
                        setAwsSelectedType(prev => x86AwsTypes.find(t => t.instance_type === prev) ? prev : x86AwsTypes[0].instance_type);
                    } else {
                        setAwsSelectedType('');
                    }
                } else if (provider === 'gcp') {
                    const types = await getGcpInstanceTypes(gcpZone, gcpCpus, gcpRam);
                    // Filter out ARM instances (t2a) as we are using x86 images by default
                    const x86Types = types.filter(t => !t.name.startsWith('t2a-'));
                    setGcpTypes(x86Types);

                    // Always select the first one if current selection is invalid or empty
                    if (x86Types.length > 0) {
                        setGcpSelectedType(prev => x86Types.find(t => t.name === prev) ? prev : x86Types[0].name);
                    } else {
                        setGcpSelectedType('');
                    }
                } else {
                    const types = await getAwsInstanceTypes(awsRegion, awsVcpus, awsMemory);
                    // Filter out ARM instances (graviton/a1/t4g etc) if needed, but for now just t2a on GCP was the issue.
                    // AWS t3 is x86. t4g is ARM. Let's filter t4g just in case to be safe if we use x86 AMIs.
                    let x86AwsTypes = types.filter(t => !t.instance_type.includes('g.'));

                    // Sort by vCPU then Memory to ensure smallest are first
                    x86AwsTypes.sort((a, b) => {
                        if (a.vcpus !== b.vcpus) return a.vcpus - b.vcpus;
                        return a.memory_gb - b.memory_gb;
                    });

                    setAwsTypes(x86AwsTypes);

                    // Always select the first one if current selection is invalid or empty
                    if (x86AwsTypes.length > 0) {
                        setAwsSelectedType(prev => x86AwsTypes.find(t => t.instance_type === prev) ? prev : x86AwsTypes[0].instance_type);
                    } else {
                        setAwsSelectedType('');
                    }
                }
            } catch (err) {
                console.error("Failed to load instance types", err);
            }
        }
        loadTypes();
    }, [provider, gcpZone, gcpCpus, gcpRam, awsRegion, awsVcpus, awsMemory, isHybrid]);

    const handleCreate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            let res;
            if (isHybrid) {
                // Hybrid creation
                res = await createAllInstances({
                    gcp: {
                        zone: gcpZone,
                        name: gcpName,
                        machine_type: gcpSelectedType,
                        count: count,
                        image_project: gcpImageProject,
                        image_family: gcpImageFamily,
                        password: password || undefined
                    },
                    aws: {
                        region: awsRegion,
                        name: awsName,
                        instance_type: awsSelectedType,
                        min_count: count,
                        max_count: count,
                        image_id: awsImageId,
                        password: password || undefined
                    },
                    cluster_type: clusterType || undefined
                });
            } else if (provider === 'gcp') {
                res = await createGcpInstance({
                    zone: gcpZone,
                    name: gcpName,
                    machine_type: gcpSelectedType,
                    count: count,
                    image_project: gcpImageProject,
                    image_family: gcpImageFamily,
                    password: password || undefined,
                    // @ts-ignore
                    cluster_type: clusterType || undefined
                });
            } else {
                res = await createAwsInstance({
                    region: awsRegion,
                    name: awsName,
                    instance_type: awsSelectedType,
                    min_count: count,
                    max_count: count,
                    image_id: awsImageId,
                    password: password || undefined,
                    // @ts-ignore
                    cluster_type: clusterType || undefined
                });
            }
            console.log('Create Result:', res);
            setResult(res);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Crear Nuevo Cluster</h2>

            {/* Mode Toggle */}
            <div className="flex justify-center mb-6">
                <div className="bg-gray-100 p-1 rounded-xl flex space-x-1">
                    <button
                        onClick={() => setIsHybrid(false)}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${!isHybrid ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Proveedor Único
                    </button>
                    <button
                        onClick={() => setIsHybrid(true)}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${isHybrid ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Híbrido (Multi-Cloud)
                    </button>
                </div>
            </div>

            {/* Provider Selector (Only if not hybrid) */}
            {!isHybrid && (
                <div className="flex space-x-4 mb-8">
                    <button
                        onClick={() => setProvider('gcp')}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${provider === 'gcp'
                            ? 'bg-blue-50 border-2 border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-gray-50 border-2 border-transparent text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        GCP
                    </button>
                    <button
                        onClick={() => setProvider('aws')}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${provider === 'aws'
                            ? 'bg-orange-50 border-2 border-orange-500 text-orange-700 shadow-sm'
                            : 'bg-gray-50 border-2 border-transparent text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        AWS
                    </button>
                </div>
            )}

            <div className="space-y-6">
                {/* Common Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre del Cluster</label>
                        <input
                            type="text"
                            value={isHybrid ? gcpName : (provider === 'gcp' ? gcpName : awsName)}
                            onChange={(e) => {
                                if (isHybrid) {
                                    setGcpName(e.target.value);
                                    setAwsName(e.target.value);
                                } else if (provider === 'gcp') setGcpName(e.target.value);
                                else setAwsName(e.target.value);
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                            placeholder="my-cluster"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Número de Nodos</label>
                        <input
                            type="number"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value))}
                            min="1"
                            max="10"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                        />
                    </div>
                </div>

                {/* Cluster Type */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Cluster (Software)</label>
                    <select
                        value={clusterType}
                        onChange={(e) => setClusterType(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                    >
                        <option value="">Ninguno (Solo OS)</option>
                        <option value="kubernetes">Kubernetes (K3s)</option>
                        <option value="docker-swarm">Docker Swarm</option>
                        <option value="redis">Redis Cluster</option>
                        <option value="portainer">Portainer</option>
                    </select>
                </div>

                {/* GCP Config */}
                {(provider === 'gcp' || isHybrid) && (
                    <div className={`space-y-4 ${isHybrid ? 'p-4 border border-blue-100 rounded-xl bg-blue-50/30' : ''}`}>
                        {isHybrid && <h3 className="font-bold text-blue-800">Configuración GCP</h3>}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">vCPUs</label>
                                <select value={gcpCpus} onChange={(e) => setGcpCpus(Number(e.target.value))} className="w-full px-4 py-2 rounded-lg bg-white border-gray-200">
                                    {[1, 2, 4, 8].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Memoria (GB)</label>
                                <select value={gcpRam} onChange={(e) => setGcpRam(Number(e.target.value))} className="w-full px-4 py-2 rounded-lg bg-white border-gray-200">
                                    {[1, 2, 4, 8, 16, 32].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Instancia</label>
                            <select
                                value={gcpSelectedType}
                                onChange={(e) => setGcpSelectedType(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                            >
                                {gcpTypes.length === 0 && <option value="">Cargando...</option>}
                                {gcpTypes.map(t => (
                                    <option key={t.name} value={t.name}>{t.name} ({t.cpus} vCPU, {t.ram_gb} GB)</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* AWS Config */}
                {(provider === 'aws' || isHybrid) && (
                    <div className={`space-y-4 ${isHybrid ? 'p-4 border border-orange-100 rounded-xl bg-orange-50/30' : ''}`}>
                        {isHybrid && <h3 className="font-bold text-orange-800">Configuración AWS</h3>}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">vCPUs</label>
                                <select value={awsVcpus} onChange={(e) => setAwsVcpus(Number(e.target.value))} className="w-full px-4 py-2 rounded-lg bg-white border-gray-200">
                                    {[1, 2, 4, 8].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Memoria (GB)</label>
                                <select value={awsMemory} onChange={(e) => setAwsMemory(Number(e.target.value))} className="w-full px-4 py-2 rounded-lg bg-white border-gray-200">
                                    {[0.5, 1, 2, 4, 8, 16, 32].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Instancia</label>
                            <select
                                value={awsSelectedType}
                                onChange={(e) => setAwsSelectedType(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                            >
                                {awsTypes.length === 0 && <option value="">Cargando...</option>}
                                {awsTypes.map(t => (
                                    <option key={t.instance_type} value={t.instance_type}>{t.instance_type} ({t.vcpus} vCPU, {t.memory_gb} GB)</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

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
                    <p className="font-bold mb-2">Cluster creado correctamente!</p>

                    {/* GCP Result */}
                    {result.name && (
                        <div className="mb-2">
                            <p><strong>Nombre:</strong> {result.name}</p>
                            <p><strong>IP:</strong> {result.public_ip}</p>
                            {result.password && <p><strong>Contraseña:</strong> <code className="bg-green-100 px-1 rounded">{result.password}</code></p>}
                        </div>
                    )}

                    {/* AWS Result */}
                    {result.created && Array.isArray(result.created) && (
                        <div className="space-y-3">
                            {result.created.map((inst: any, idx: number) => (
                                <div key={idx} className="p-2 bg-white/50 rounded border border-green-200">
                                    <p><strong>ID:</strong> {inst.InstanceId || inst.id || inst.instance_id || inst.name || 'N/A'}</p>
                                    <p><strong>IP:</strong> {inst.PublicIpAddress || inst.public_ip || inst.ip || 'Pending'}</p>
                                    {(inst.Password || inst.password) && <p><strong>Contraseña:</strong> <code className="bg-green-100 px-1 rounded">{inst.Password || inst.password}</code></p>}
                                    {/* Debug raw item if empty or missing ID */}
                                    {(!inst.InstanceId && !inst.id && !inst.instance_id) && (
                                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                            <p className="font-bold text-red-500">Debug Data:</p>
                                            <pre>{JSON.stringify(inst, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Warning if no types found */}
            {((provider === 'gcp' && gcpTypes.length === 0) || (provider === 'aws' && awsTypes.length === 0)) && !loading && (
                <div className="mt-2 text-xs text-orange-600">
                    No se encontraron tipos de instancia con estos recursos. Intenta reducir CPU/RAM.
                </div>
            )}
        </div>
    );
}
