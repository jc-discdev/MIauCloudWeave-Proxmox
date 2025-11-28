// Proxmox VM/LXC Interfaces
export interface ProxmoxVM {
    vmid: number;
    name: string;
    node: string;
    type: 'qemu' | 'lxc';
    status: 'running' | 'stopped';
    cpu: number;
    memory: number;
    disk: number;
    uptime?: number;
    ip: string | null;
    template?: boolean;
}

export interface CreateProxmoxRequest {
    name: string;
    vm_type: 'qemu' | 'lxc';
    cores: number;
    memory: number;
    disk_size: number;
    node?: string;
    template?: number;
    iso?: string;
    lxc_template?: string;
    storage?: string;
    bridge?: string;
    cluster_type?: string;
    count?: number;
    ssh_key?: string;
    password?: string;
    start?: boolean;
}

export interface ProxmoxCredentials {
    username: string;
    password: string;
    ip: string;
    provider: 'proxmox';
    node: string;
    vmid: number;
    type: 'qemu' | 'lxc';
}

export interface CreateResponse {
    success: boolean;
    vmid?: number;
    name?: string;
    ip?: string;
    password?: string;
    created?: any[];
    result?: any;
    error?: string;
}

export interface ListResponse {
    success: boolean;
    count: number;
    vms: ProxmoxVM[];
    message?: string;
}

export interface ClusterCreateRequest {
    manager: {
        name: string;
        vm_type: 'qemu' | 'lxc';
        cores: number;
        memory: number;
        disk_size: number;
    };
    workers: Array<{
        name: string;
        vm_type: 'qemu' | 'lxc';
        cores: number;
        memory: number;
        disk_size: number;
        count: number;
    }>;
}

const API_BASE = '/api';

// List all VMs and LXC containers
export async function listProxmoxVMs(): Promise<ListResponse> {
    const res = await fetch(`${API_BASE}/proxmox/list`);
    return res.json();
}

// Create a VM or LXC container
export async function createProxmoxVM(payload: CreateProxmoxRequest): Promise<CreateResponse> {
    const res = await fetch(`${API_BASE}/proxmox/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
}

// Delete a VM or container
export async function deleteProxmoxVM(name: string, force: boolean = true): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/proxmox/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, force }),
    });
    return res.json();
}

// Start a VM or container
export async function startProxmoxVM(name: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/proxmox/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    return res.json();
}

// Stop a VM or container
export async function stopProxmoxVM(name: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/proxmox/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    return res.json();
}

// Restart a VM or container
export async function restartProxmoxVM(name: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/proxmox/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    return res.json();
}

// Create a Docker Swarm cluster
export async function createCluster(payload: ClusterCreateRequest): Promise<CreateResponse> {
    const res = await fetch(`${API_BASE}/cluster/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
}

// Get credentials for instances
export async function getCredentials(instanceName?: string): Promise<any> {
    const url = instanceName
        ? `${API_BASE}/credentials?instance_name=${instanceName}`
        : `${API_BASE}/credentials`;
    const res = await fetch(url);
    return res.json();
}

// AI Assistant functions
export async function askAi(prompt: string): Promise<{ response: string | { command: string, parameters: any } }> {
    const res = await fetch(`${API_BASE}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });
    return res.json();
}

export async function executeAi(command: any): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
    });
    return res.json();
}
