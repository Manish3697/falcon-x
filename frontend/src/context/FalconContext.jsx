import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const FalconContext = createContext();

export const FalconProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState(null);
  const [systemResources, setSystemResources] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  
  // Real-time KPI Data
  const [kpis, setKpis] = useState({
    devices: { total: 9, online: 8, unknown: 1 },
    traffic: { packets_per_sec: 38.4, bytes_per_sec: 41200, status: 'NORMAL' },
    threats: { detected: 0, unresolved: 0, critical: 0 },
    blocked: { blocked_hosts: 0, active_rules: 0 },
    risk: { highest_risk: 1.5, avg_risk: 0.8, severity: 'LOW' },
    system: { cpu_percent: 12.5, ram_percent: 34.2, uptime: '1h 24m 10s' }
  });
  
  // Traffic series history for graphs
  const [trafficHistory, setTrafficHistory] = useState([]);
  const [recentTraffic, setRecentTraffic] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  
  // Global action notifications / toast
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Fetch baseline data
  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getSystemStatus();
      setSystemStatus(data);
    } catch (err) {
      console.error("Failed to fetch system status", err);
    }
  }, []);

  const fetchResources = useCallback(async () => {
    try {
      const data = await api.getSystemResources();
      setSystemResources(data);
    } catch (err) {
      console.error("Failed to fetch system resources", err);
    }
  }, []);

  // SSE Stream subscription
  useEffect(() => {
    fetchStatus();
    fetchResources();
    
    const eventSource = new EventSource('/api/stream');
    
    eventSource.onopen = () => {
      setIsStreaming(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.kpis) {
          setKpis(payload.kpis);
          setLastUpdate(payload.timestamp || new Date().toLocaleTimeString());
          
          if (payload.traffic_events) {
            setRecentTraffic(payload.traffic_events);
          }
          if (payload.latest_alerts) {
            setRecentAlerts(payload.latest_alerts);
          }

          // Append to traffic history graph (keep last 30 points)
          setTrafficHistory(prev => {
            const newPoint = {
              time: payload.timestamp || new Date().toLocaleTimeString(),
              packets_per_sec: payload.kpis.traffic.packets_per_sec,
              kbytes_per_sec: Math.round(payload.kpis.traffic.bytes_per_sec / 1024),
              risk_level: payload.kpis.risk.highest_risk
            };
            const updated = [...prev, newPoint];
            return updated.slice(-30);
          });
        }
      } catch (err) {
        console.error("SSE parsing error", err);
      }
    };

    eventSource.onerror = () => {
      setIsStreaming(false);
    };

    // Polling interval for system resources
    const resInterval = setInterval(fetchResources, 3000);

    return () => {
      eventSource.close();
      clearInterval(resInterval);
    };
  }, [fetchStatus, fetchResources]);

  // Scenario Triggers with Notifications
  const triggerSimulation = async (scenarioType) => {
    try {
      let res;
      switch (scenarioType) {
        case 'NORMAL':
          res = await api.simulateNormal();
          setActiveScenario(null);
          showNotification('Normal Network Traffic active across baseline hosts', 'info');
          break;
        case 'PORT_SCAN':
          res = await api.simulatePortScan();
          setActiveScenario('PORT SCAN');
          showNotification('Test Scenario: Port Scan detected on 192.168.1.15 (Risk 8.0/10 - HIGH)', 'warning');
          break;
        case 'SYN_BURST':
          res = await api.simulateSynBurst();
          setActiveScenario('SYN BURST');
          showNotification('Test Scenario: SYN Flood Burst detected on 192.168.1.22 (Risk 9.0/10 - CRITICAL) • Host Isolated via nftables', 'critical');
          break;
        case 'ARP_CONFLICT':
          res = await api.simulateArpConflict();
          setActiveScenario('ARP CONFLICT');
          showNotification('Test Scenario: Suspicious ARP Conflict behavior detected from 192.168.1.22 (Risk 7.5/10 - HIGH)', 'warning');
          break;
        case 'UNKNOWN_DEVICE':
          res = await api.simulateUnknownDevice();
          setActiveScenario('UNKNOWN DEVICE');
          showNotification('Test Scenario: New unauthorized device 192.168.1.99 detected and added to inventory', 'info');
          break;
        case 'SUSPICIOUS_TRAFFIC':
          res = await api.simulateSuspiciousTraffic();
          setActiveScenario('SUSPICIOUS TRAFFIC');
          showNotification('Test Scenario: Suspicious backdoor traffic on port 4444 detected (Risk 6.0/10)', 'warning');
          break;
        case 'ML_ANOMALY':
          res = await api.simulateMLAnomaly();
          setActiveScenario('ML FLOW ANOMALY');
          const probPct = res?.anomaly_probability !== undefined ? (res.anomaly_probability * 100).toFixed(1) : 'N/A';
          const lat = res?.inference_time_ms !== undefined ? `${res.inference_time_ms}ms` : '< 3ms';
          const pred = res?.prediction !== undefined ? res.prediction : 1;
          showNotification(`ML DETECTION: Random Forest Flow Classifier on 192.168.1.50 • Pred: ${pred} • Anomaly Prob: ${probPct}% • Latency: ${lat}`, 'warning');
          break;
        case 'CLEAR':
          res = await api.clearDemoEvents();
          setActiveScenario(null);
          showNotification('Test state cleared: alerts and isolation rules reset to clean baseline', 'info');
          break;
        default:
          break;
      }
      fetchStatus();
      return res;
    } catch (err) {
      showNotification(`Scenario execution error: ${err.message}`, 'critical');
    }
  };

  return (
    <FalconContext.Provider
      value={{
        activeTab,
        setActiveTab,
        systemStatus,
        systemResources,
        activeScenario,
        isStreaming,
        lastUpdate,
        kpis,
        trafficHistory,
        recentTraffic,
        recentAlerts,
        notification,
        showNotification,
        triggerSimulation,
        refreshStatus: fetchStatus,
        refreshResources: fetchResources
      }}
    >
      {children}
    </FalconContext.Provider>
  );
};

export const useFalcon = () => useContext(FalconContext);
