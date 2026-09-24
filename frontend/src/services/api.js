const API_BASE = '/api';

export const api = {
  // System & Status
  getSystemStatus: async () => {
    const res = await fetch(`${API_BASE}/system/status`);
    return res.json();
  },
  getSystemResources: async () => {
    const res = await fetch(`${API_BASE}/system/resources`);
    return res.json();
  },

  // Devices
  getDevices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/devices?${query}`);
    return res.json();
  },
  getDeviceDetail: async (id) => {
    const res = await fetch(`${API_BASE}/devices/${id}`);
    return res.json();
  },
  deviceAction: async (id, action, reason = '') => {
    const res = await fetch(`${API_BASE}/devices/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason }),
    });
    return res.json();
  },

  // Traffic
  getTraffic: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/traffic?${query}`);
    return res.json();
  },

  // Threats & Risk
  getThreats: async () => {
    const res = await fetch(`${API_BASE}/threats`);
    return res.json();
  },
  getRiskAnalysis: async () => {
    const res = await fetch(`${API_BASE}/risk`);
    return res.json();
  },

  // Alerts
  getAlerts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/alerts?${query}`);
    return res.json();
  },
  updateAlertStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/alerts/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // Configurable Rules
  getRules: async () => {
    const res = await fetch(`${API_BASE}/rules`);
    return res.json();
  },
  toggleRule: async (id) => {
    const res = await fetch(`${API_BASE}/rules/${id}/toggle`, {
      method: 'POST',
    });
    return res.json();
  },
  updateRule: async (id, data) => {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Firewall / nftables
  getFirewallRules: async () => {
    const res = await fetch(`${API_BASE}/firewall/rules`);
    return res.json();
  },
  blockHost: async (ip, comment = '') => {
    const res = await fetch(`${API_BASE}/firewall/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, comment }),
    });
    return res.json();
  },
  unblockHost: async (ip) => {
    const res = await fetch(`${API_BASE}/firewall/unblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip }),
    });
    return res.json();
  },
  addCustomFirewallRule: async (ruleData) => {
    const res = await fetch(`${API_BASE}/firewall/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData),
    });
    return res.json();
  },
  deleteFirewallRule: async (ruleId) => {
    const res = await fetch(`${API_BASE}/firewall/rules/${ruleId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Audit Logs
  getLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/logs?${query}`);
    return res.json();
  },

  // Demo Scenarios Controls
  setDemoMode: async (enabled) => {
    const res = await fetch(`${API_BASE}/demo/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    return res.json();
  },
  simulateNormal: async () => {
    const res = await fetch(`${API_BASE}/demo/simulate-normal`, { method: 'POST' });
    return res.json();
  },
  simulatePortScan: async () => {
    const res = await fetch(`${API_BASE}/demo/simulate-port-scan`, { method: 'POST' });
    return res.json();
  },
  simulateSynBurst: async () => {
    const res = await fetch(`${API_BASE}/demo/simulate-syn-burst`, { method: 'POST' });
    return res.json();
  },
  simulateArpConflict: async () => {
    const res = await fetch(`${API_BASE}/demo/simulate-arp-conflict`, { method: 'POST' });
    return res.json();
  },
  simulateUnknownDevice: async () => {
    const res = await fetch(`${API_BASE}/demo/simulate-unknown-device`, { method: 'POST' });
    return res.json();
  },
  simulateSuspiciousTraffic: async () => {
    const res = await fetch(`${API_BASE}/demo/simulate-suspicious-traffic`, { method: 'POST' });
    return res.json();
  },
  clearDemoEvents: async () => {
    const res = await fetch(`${API_BASE}/demo/clear`, { method: 'POST' });
    return res.json();
  },
};
