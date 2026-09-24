import sqlite3
import datetime
import os
import json
from config import Config

def get_db_connection():
    conn = sqlite3.connect(Config.DB_PATH, timeout=10.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=5000;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Devices table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS devices (
        device_id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT UNIQUE NOT NULL,
        mac TEXT UNIQUE NOT NULL,
        hostname TEXT,
        vendor TEXT,
        device_type TEXT DEFAULT 'UNKNOWN',
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'ONLINE', -- ONLINE, OFFLINE, SUSPICIOUS, BLOCKED
        risk_score REAL DEFAULT 0.0,
        packets_per_sec REAL DEFAULT 0.0,
        bytes_per_sec REAL DEFAULT 0.0,
        is_demo BOOLEAN DEFAULT 0
    )
    """)
    
    # 2. Traffic events table (metadata only - no sensitive payloads)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS traffic_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        src_ip TEXT NOT NULL,
        dst_ip TEXT NOT NULL,
        src_port INTEGER,
        dst_port INTEGER,
        protocol TEXT,
        packet_size INTEGER,
        tcp_flags TEXT,
        risk_score REAL DEFAULT 0.0,
        action TEXT DEFAULT 'FORWARDED',
        is_demo BOOLEAN DEFAULT 0
    )
    """)
    
    # 3. Threats table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS threats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        device_id INTEGER,
        device_ip TEXT NOT NULL,
        threat_type TEXT NOT NULL, -- Port Scan, SYN Flood/Burst, ARP Spoofing/Conflict, Unknown/Rogue Device, Suspicious Traffic
        evidence TEXT NOT NULL,
        risk_score REAL NOT NULL,
        severity TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
        status TEXT DEFAULT 'ACTIVE', -- ACTIVE, MITIGATED, RESOLVED, IGNORED
        recommended_action TEXT,
        current_action TEXT DEFAULT 'MONITORING',
        is_demo BOOLEAN DEFAULT 0,
        FOREIGN KEY(device_id) REFERENCES devices(device_id)
    )
    """)
    
    # 4. Alerts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        device_id INTEGER,
        device_ip TEXT NOT NULL,
        mac_address TEXT,
        threat_id INTEGER,
        threat_type TEXT NOT NULL,
        message TEXT NOT NULL,
        evidence TEXT,
        risk_score REAL NOT NULL,
        severity TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
        action TEXT DEFAULT 'NONE', -- NONE, BLOCKED, MONITORED, ISOLATED
        status TEXT DEFAULT 'OPEN', -- OPEN, ACKNOWLEDGED, RESOLVED
        is_demo BOOLEAN DEFAULT 0,
        FOREIGN KEY(device_id) REFERENCES devices(device_id),
        FOREIGN KEY(threat_id) REFERENCES threats(id)
    )
    """)
    
    # 5. Firewall / nftables rules table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS firewall_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_id TEXT UNIQUE NOT NULL,
        source_ip TEXT NOT NULL,
        destination TEXT DEFAULT 'any',
        protocol TEXT DEFAULT 'all',
        port TEXT DEFAULT 'any',
        action TEXT DEFAULT 'BLOCK', -- BLOCK, ALLOW
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'ACTIVE', -- ACTIVE, DISABLED, REMOVED
        mechanism TEXT DEFAULT 'nftables',
        comment TEXT,
        is_demo BOOLEAN DEFAULT 0
    )
    """)
    
    # 6. System / Audit events table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        event_type TEXT NOT NULL, -- DEVICE_DISCOVERED, DEVICE_OFFLINE, THREAT_DETECTED, RISK_UPDATED, ALERT_CREATED, HOST_BLOCKED, HOST_UNBLOCKED, RULE_CREATED, RULE_REMOVED, SYSTEM_STARTED, SYSTEM_STOPPED, CAPTURE_STARTED, CAPTURE_STOPPED
        device TEXT,
        threat TEXT,
        risk REAL,
        action TEXT,
        result TEXT,
        message TEXT,
        severity TEXT DEFAULT 'INFO',
        is_demo BOOLEAN DEFAULT 0
    )
    """)
    
    # 7. Configurable Rule Engine Rules
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS config_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_code TEXT UNIQUE NOT NULL,
        rule_name TEXT NOT NULL,
        description TEXT NOT NULL,
        detection_type TEXT NOT NULL,
        threshold INTEGER NOT NULL,
        window_sec INTEGER DEFAULT 10,
        severity TEXT NOT NULL,
        weight REAL NOT NULL,
        enabled BOOLEAN DEFAULT 1
    )
    """)
    
    # Create indexes for fast querying
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON traffic_events(timestamp DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_traffic_src ON traffic_events(src_ip)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_threats_timestamp ON threats(timestamp DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_timestamp ON system_events(timestamp DESC)")
    
    conn.commit()
    conn.close()
    
    seed_default_rules()
    seed_coherent_demo_devices()

def seed_default_rules():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    default_rules = [
        ("RULE-001", "Port Scan Detection", "Detects multiple destination port connections from a single host within a sliding time window.", "PORT_SCAN", 5, 10, "HIGH", 8.0, 1),
        ("RULE-002", "SYN Burst Detection", "Detects abnormal TCP SYN packet spikes without connection completion (potential SYN flood/DoS).", "SYN_BURST", 20, 5, "CRITICAL", 9.0, 1),
        ("RULE-003", "ARP Conflict Detection", "Detects conflicting MAC-to-IP pairings or unsolicited gratuitous ARP announcements.", "ARP_CONFLICT", 2, 15, "HIGH", 7.5, 1),
        ("RULE-004", "Unknown Device Detection", "Detects newly observed MAC addresses unlisted in verified baseline inventory.", "UNKNOWN_DEVICE", 1, 0, "MEDIUM", 5.0, 1),
        ("RULE-005", "Suspicious Traffic Detection", "Detects communication targeting anomalous ports or oversized payload profiles.", "SUSPICIOUS_TRAFFIC", 1, 10, "MEDIUM", 6.0, 1)
    ]
    
    for rule in default_rules:
        cursor.execute("""
        INSERT OR IGNORE INTO config_rules (rule_code, rule_name, description, detection_type, threshold, window_sec, severity, weight, enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, rule)
        
    conn.commit()
    conn.close()

def seed_coherent_demo_devices():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if devices exist
    cursor.execute("SELECT COUNT(*) as count FROM devices")
    if cursor.fetchone()["count"] == 0:
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        earlier = (datetime.datetime.now() - datetime.timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")
        
        # Coherent IoT Network per Prompt Specification
        coherent_devices = [
            ("192.168.1.1", "00:1A:2B:3C:4D:01", "gw-edge-router.local", "Cisco Systems", "Gateway", earlier, now, "ONLINE", 0.0, 42.5, 38400.0, 1),
            ("192.168.1.10", "D8:96:E0:11:22:33", "cam-entry-ptz.local", "Hikvision Digital", "IP Camera", earlier, now, "ONLINE", 1.2, 14.2, 128000.0, 1),
            ("192.168.1.11", "B8:27:EB:55:66:77", "sensor-temp-modbus.local", "Texas Instruments", "Industrial Sensor", earlier, now, "ONLINE", 0.5, 2.1, 1400.0, 1),
            ("192.168.1.12", "00:0E:C6:88:99:AA", "pos-checkout-01.local", "Verifone", "POS Terminal", earlier, now, "ONLINE", 0.8, 5.6, 6800.0, 1),
            ("192.168.1.15", "3C:52:82:AA:BB:CC", "admin-thinkpad.local", "Lenovo", "Laptop", earlier, now, "ONLINE", 1.5, 22.8, 45200.0, 1),
            ("192.168.1.22", "A4:C3:F0:DD:EE:FF", "unknown-esp32-node.local", "Espressif Inc.", "Unknown Device", earlier, now, "SUSPICIOUS", 5.0, 8.4, 9200.0, 1),
            ("192.168.1.30", "00:80:F4:12:34:56", "plc-siemens-s7.local", "Siemens AG", "PLC", earlier, now, "ONLINE", 0.2, 3.1, 2400.0, 1),
            ("192.168.1.45", "70:B3:D5:77:88:99", "smart-meter-fl01.local", "Schneider Electric", "Smart Meter", earlier, now, "ONLINE", 0.4, 1.8, 1100.0, 1),
            ("192.168.1.50", "BC:24:11:99:88:77", "workstation-lab.local", "Dell Inc.", "Laptop", earlier, now, "ONLINE", 1.0, 18.2, 29000.0, 1)
        ]
        
        for dev in coherent_devices:
            cursor.execute("""
            INSERT INTO devices (ip, mac, hostname, vendor, device_type, first_seen, last_seen, status, risk_score, packets_per_sec, bytes_per_sec, is_demo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, dev)
            
        # Add initial system event
        cursor.execute("""
        INSERT INTO system_events (event_type, message, severity, result, is_demo)
        VALUES ('SYSTEM_STARTED', 'FALCON-X Edge Cybersecurity Engine initialized', 'INFO', 'SUCCESS', 1)
        """)
        
        conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
