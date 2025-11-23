export interface GcpInstanceType {
    name: string;
    cpus: number;
    ram_gb: number;
    description?: string;
}

export interface AwsInstanceType {
    instance_type: string;
    vcpus: number;
    memory_gb: number;
}

export interface Instance {
    name: string;
    status?: string;
    machine_type?: string;
    creation_timestamp?: string;
    zone?: string;
    internal_ips?: string[];
    external_ips?: string[];
    cpu?: number;
    ram?: number;
    // AWS specific
    InstanceId?: string;
    Name?: string;
    PublicIpAddress?: string;
    State?: { Name: string };
}

export interface CreateGcpRequest {
    credentials?: string;
    zone: string;
    name: string;
    machine_type: string;
    count?: number;
    image_project?: string;
    image_family?: string;
    image?: string;
    password?: string;
}

export interface CreateAwsRequest {
    region: string;
    name?: string;
    instance_type: string;
    min_count?: number;
    max_count?: number;
    image_id?: string;
    password?: string;
}

export interface CreateResponse {
    success: boolean;
    created?: any[];
    result?: any;
    error?: string;
}

export interface ListResponse {
    success: boolean;
    count: number;
    instances: Instance[];
    message?: string;
}

const API_BASE = '/api';

export async function getGcpInstanceTypes(zone: string, cpus: number, ram_gb: number): Promise<GcpInstanceType[]> {
    const params = new URLSearchParams({ zone, cpus: cpus.toString(), ram_gb: ram_gb.toString() });
    const res = await fetch(`${API_BASE}/instance-types/gcp?${params}`);
    const data = await res.json();
    return data.instance_types || [];
}

export async function getAwsInstanceTypes(region: string, min_vcpus: number, min_memory_gb: number): Promise<AwsInstanceType[]> {
    const params = new URLSearchParams({
        region,
        min_vcpus: min_vcpus.toString(),
        min_memory_gb: min_memory_gb.toString()
    });
    const res = await fetch(`${API_BASE}/instance-types/aws?${params}`);
    const data = await res.json();
    return data.instance_types || [];
}

export async function createGcpInstance(payload: CreateGcpRequest): Promise<CreateResponse> {
    const res = await fetch(`${API_BASE}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: './credentials.json', ...payload }),
    });
    return res.json();
}

export async function createAwsInstance(payload: CreateAwsRequest): Promise<CreateResponse> {
    const res = await fetch(`${API_BASE}/aws/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
}

export async function listGcpInstances(zone?: string): Promise<ListResponse> {
    const params = new URLSearchParams();
    if (zone) params.append('zone', zone);
    const res = await fetch(`${API_BASE}/list?${params}`);
    return res.json();
}

export async function listAwsInstances(region?: string): Promise<ListResponse> {
    const params = new URLSearchParams();
    if (region) params.append('region', region);
    const res = await fetch(`${API_BASE}/aws/list?${params}`);
    return res.json();
}

export async function deleteGcpInstance(name: string, zone?: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: './credentials.json', name, zone }),
    });
    return res.json();
}

export async function deleteAwsInstance(instanceId: string, region?: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/aws/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: instanceId, region }),
    });
    return res.json();
}

export async function startInstance(provider: 'gcp' | 'aws', id: string, zoneOrRegion?: string): Promise<{ success: boolean }> {
    const payload: any = { provider, id };
    if (provider === 'gcp') payload.zone = zoneOrRegion;
    else payload.region = zoneOrRegion;

    const res = await fetch(`${API_BASE}/action/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: './credentials.json', ...payload }),
    });
    return res.json();
}

export async function stopInstance(provider: 'gcp' | 'aws', id: string, zoneOrRegion?: string): Promise<{ success: boolean }> {
    const payload: any = { provider, id };
    if (provider === 'gcp') payload.zone = zoneOrRegion;
    else payload.region = zoneOrRegion;

    const res = await fetch(`${API_BASE}/action/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: './credentials.json', ...payload }),
    });
    return res.json();
}

export async function createAllInstances(payload: { gcp?: CreateGcpRequest, aws?: CreateAwsRequest, cluster_type?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/all/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
}

export async function askAi(prompt: string): Promise<{ response: string | { command: string, parameters: any } }> {
    const res = await fetch(`${API_BASE}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });
    return res.json();
}

export async function getCredentials(instanceName?: string): Promise<any> {
    const url = instanceName
        ? `${API_BASE}/credentials?instance_name=${instanceName}`
        : `${API_BASE}/credentials`;
    const res = await fetch(url);
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
