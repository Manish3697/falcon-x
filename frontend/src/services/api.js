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
  simulateMLAnomaly: async (packetData = {}) => {
    const defaultData = {
      src_ip: "192.168.1.50",
      dst_ip: "192.168.1.1",
      src_port: 54321,
      dst_port: 8080,
      protocol: "TCP",
      packet_size: 1420,
      tcp_flags: "S",
      mac: "BC:24:11:99:88:77",
      flow_duration: 180000,
      total_fwd_packets: 60,
      total_bwd_packets: 2,
      packets_per_sec: 420.0,
      bytes_per_sec: 596400.0,
      init_fwd_win_bytes: 65535.0,
      is_demo: true,
      evaluate_detection: true,
      ...packetData
    };
    const res = await fetch(`${API_BASE}/ml_predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultData)
    });
    return res.json();
  },
  clearDemoEvents: async () => {
    const res = await fetch(`${API_BASE}/demo/clear`, { method: 'POST' });
    return res.json();
  },

  // Machine Learning Subsystem
  getMLStatus: async () => {
    const res = await fetch(`${API_BASE}/ml/status`);
    return res.json();
  },
  predictML: async (packetMeta) => {
    const res = await fetch(`${API_BASE}/ml_predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packetMeta),
    });
    return res.json();
  },

  // VERA Validation Center
  getValidationStatus: async () => {
    const res = await fetch(`${API_BASE}/validation/status`);
    return res.json();
  },
  getValidationResults: async () => {
    const res = await fetch(`${API_BASE}/validation/results`);
    return res.json();
  },
  runValidation: async () => {
    const res = await fetch(`${API_BASE}/validation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },
  getValidationReport: async (id = 'latest') => {
    const res = await fetch(`${API_BASE}/validation/report?id=${encodeURIComponent(id)}`);
    return res.json();
  },
  getValidationReports: async () => {
    const res = await fetch(`${API_BASE}/validation/reports`);
    return res.json();
  },
  getValidationScenarios: async () => {
    const res = await fetch(`${API_BASE}/validation/scenarios`);
    return res.json();
  },
};
