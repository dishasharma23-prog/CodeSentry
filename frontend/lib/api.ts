import { API_URL } from "./constants";

async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errBody.message || `Request failed: ${res.status}`);
  }
  const json = await res.json();
  // Backend wraps responses in { success, data }
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Repositories
  getRepositories: () => fetchJson(`${API_URL}/api/repositories`),
  getRepository: (id: string) => fetchJson(`${API_URL}/api/repositories/${id}`),
  createRepository: (url: string) => fetchJson(`${API_URL}/api/repositories`, {
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify({url})
  }),
  getRepositoryStatus: (id: string) => fetchJson(`${API_URL}/api/repositories/${id}/status`),
  
  // Files
  getFiles: (id: string, path?: string) => fetchJson(`${API_URL}/api/repositories/${id}/files${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  getFileContent: (id: string, filePath: string) => fetchJson(`${API_URL}/api/repositories/${id}/files/${filePath}`),
  
  // Query
  queryRepository: (id: string, query: string) => fetchJson(`${API_URL}/api/repositories/${id}/query`, {
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify({query})
  }),
  
  // Security
  runSecurityAnalysis: (id: string) => fetchJson(`${API_URL}/api/repositories/${id}/security-analysis`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  }),
  getFindings: (id: string) => fetchJson(`${API_URL}/api/repositories/${id}/findings`),
};
