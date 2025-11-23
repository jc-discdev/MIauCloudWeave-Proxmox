import React, { useState, useEffect } from 'react';
import {
    listGcpInstances,
    listAwsInstances,
    deleteGcpInstance,
    deleteAwsInstance,
    startInstance,
    stopInstance,
    type Instance
} from '../services/api';
import CredentialsModal from './CredentialsModal';

// ...



interface Cluster {
    name: string;
    provider: 'gcp' | 'aws';
    instances: Instance[];
    status: 'active' | 'mixed' | 'stopped';
    cpuTotal: number;
    ramTotal: number;
}

export default function ClusterManager() {
    const [clusters, setClusters] = useState<Cluster[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
    const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [gcpRes, awsRes] = await Promise.all([
                    listGcpInstances(),
                    listAwsInstances()
                ]);

                const newClusters: Cluster[] = [];

                // Process GCP
                if (gcpRes.success && gcpRes.instances) {
                    const grouped = groupInstances(gcpRes.instances, 'gcp');
                    newClusters.push(...grouped);
                }

                // Process AWS
                // AWS list endpoint returns array directly if success, or check structure
                // Based on api.ts: listAwsInstances returns ListResponse { success, count, instances }
                if (awsRes.success && awsRes.instances) {
                    const grouped = groupInstances(awsRes.instances, 'aws');
                    newClusters.push(...grouped);
                }

                setClusters(newClusters);

                // Update selected cluster if it exists
                if (selectedCluster) {
                    const updated = newClusters.find(c => c.name === selectedCluster.name && c.provider === selectedCluster.provider);
                    setSelectedCluster(updated || null);
                }
            } catch (err) {
                console.error("Failed to load clusters", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [refreshKey]);

    const groupInstances = (instances: Instance[], provider: 'gcp' | 'aws'): Cluster[] => {
        const groups: { [key: string]: Instance[] } = {};

        instances.forEach(inst => {
            // Extract cluster name from instance name (e.g., "t3-mycluster-1" -> "t3-mycluster")
            // Assumption: Cluster name is the prefix before the last hyphen if it ends in a number,
            // or just the name if it doesn't match that pattern.
            // Simpler approach: Group by base name (removing trailing digits/hyphens)
            let baseName = inst.name || inst.Name || 'unknown';
            // Remove trailing "-N" or just numbers
            baseName = baseName.replace(/-\d+$/, '').replace(/\d+$/, '');

            if (!groups[baseName]) groups[baseName] = [];
            groups[baseName].push(inst);
        });

        return Object.keys(groups).map(name => {
            const group = groups[name];
            // Calculate totals (approximate)
            // GCP: machine_type (e.g. e2-medium -> 2 vCPU, 4GB) - need mapping or parsing
            // AWS: InstanceType (e.g. t3.micro -> 2 vCPU, 1GB)
            // For now, just counting nodes
            return {
                name,
                provider,
                instances: group,
                status: 'active', // Simplified
                cpuTotal: group.reduce((sum, inst) => sum + (inst.cpu || 0), 0),
                ramTotal: group.reduce((sum, inst) => sum + (inst.ram || 0), 0)
            };
        });
    };

    const refresh = () => setRefreshKey(k => k + 1);

    const handleDeleteCluster = async (cluster: Cluster) => {
        if (!confirm(`Are you sure you want to delete cluster "${cluster.name}" (${cluster.instances.length} nodes)?`)) return;

        try {
            const promises = cluster.instances.map(inst => {
                if (cluster.provider === 'gcp') {
                    return deleteGcpInstance(inst.name, inst.zone);
                } else {
                    return deleteAwsInstance(inst.InstanceId!, undefined); // Region inferred by backend if not passed, or we need to store it
                }
            });
            await Promise.all(promises);
            refresh();
            setSelectedCluster(null);
        } catch (err) {
            alert("Error deleting cluster");
        }
    };

    return (
        <div className="flex h-full bg-gray-100 rounded-lg overflow-hidden shadow-xl border border-gray-200">
            {/* Sidebar List */}
            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-700">Mis Clústers</h2>
                    <button onClick={refresh} className="text-blue-600 hover:text-blue-800 text-sm">
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {clusters.length === 0 && !loading && (
                        <p className="text-center text-gray-400 text-sm py-4">No hay clusters activos</p>
                    )}
                    {clusters.map(cluster => (
                        <div
                            key={`${cluster.provider}-${cluster.name}`}
                            onClick={() => setSelectedCluster(cluster)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${selectedCluster === cluster
                                ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-300'
                                : 'hover:bg-gray-50 border border-transparent'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-semibold text-gray-800">{cluster.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${cluster.provider === 'gcp' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                    {cluster.provider.toUpperCase()}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">{cluster.instances.length} nodos · {cluster.status}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail View */}
            <div className="w-2/3 bg-gray-50 p-6 overflow-y-auto">
                {selectedCluster ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{selectedCluster.name}</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Proveedor: <span className="font-medium text-gray-700">{selectedCluster.provider.toUpperCase()}</span>
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleDeleteCluster(selectedCluster)}
                                    className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Eliminar Cluster
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <span className="block text-xs text-gray-500 uppercase">Nodos</span>
                                <span className="text-xl font-bold text-gray-800">{selectedCluster.instances.length}</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <span className="block text-xs text-gray-500 uppercase">CPUs</span>
                                <span className="text-xl font-bold text-gray-800">{selectedCluster.cpuTotal}</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <span className="block text-xs text-gray-500 uppercase">RAM</span>
                                <span className="text-xl font-bold text-gray-800">{selectedCluster.ramTotal} GB</span>
                            </div>
                        </div>

                        <h3 className="font-bold text-gray-800 mb-4">Instancias</h3>
                        <div className="space-y-3">
                            {selectedCluster.instances.map((inst, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100 text-sm">
                                    <div>
                                        <p className="font-medium text-gray-700">{inst.name || inst.Name || inst.InstanceId}</p>
                                        <p className="text-xs text-gray-500 font-mono">{inst.external_ips?.join(', ') || inst.PublicIpAddress || 'Sin IP'}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded text-xs ${(inst.status === 'RUNNING' || inst.State?.Name === 'running')
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {inst.status || inst.State?.Name}
                                        </span>

                                        {/* Start Button */}
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    if (selectedCluster.provider === 'gcp') {
                                                        await startInstance('gcp', inst.name, inst.zone);
                                                    } else {
                                                        await startInstance('aws', inst.InstanceId!, inst.zone);
                                                    }
                                                    refresh();
                                                } catch (err) {
                                                    alert("Failed to start instance");
                                                }
                                            }}
                                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                            title="Start Instance"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        </button>

                                        {/* Stop Button */}
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!confirm(`Stop instance ${inst.name || inst.InstanceId}?`)) return;
                                                try {
                                                    if (selectedCluster.provider === 'gcp') {
                                                        await stopInstance('gcp', inst.name, inst.zone);
                                                    } else {
                                                        await stopInstance('aws', inst.InstanceId!, inst.zone);
                                                    }
                                                    refresh();
                                                } catch (err) {
                                                    alert("Failed to stop instance");
                                                }
                                            }}
                                            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                                            title="Stop Instance"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path></svg>
                                        </button>

                                        {/* Credentials Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedInstanceName(inst.name || inst.Name || inst.InstanceId || '');
                                                setCredentialsModalOpen(true);
                                            }}
                                            className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                            title="Ver Credenciales SSH"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!confirm(`Delete instance ${inst.name || inst.InstanceId}?`)) return;
                                                try {
                                                    if (selectedCluster.provider === 'gcp') {
                                                        await deleteGcpInstance(inst.name, inst.zone);
                                                    } else {
                                                        await deleteAwsInstance(inst.InstanceId!);
                                                    }
                                                    refresh();
                                                } catch (err) {
                                                    alert("Failed to delete instance");
                                                }
                                            }}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title="Delete Instance"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        <p>Selecciona un cluster para ver los detalles</p>
                    </div>
                )}
            </div>

            {/* Credentials Modal */}
            <CredentialsModal
                instanceName={selectedInstanceName}
                isOpen={credentialsModalOpen}
                onClose={() => setCredentialsModalOpen(false)}
            />
        </div>
    );
}
