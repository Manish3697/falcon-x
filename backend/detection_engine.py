"""
FALCON-X Deterministic & Heuristic Detection Engine
Processes network events at the edge without AI/ML blackboxes.
Rules:
1. Port Scan Detection (multiple unique destination ports per src host)
2. SYN Flood / Burst Detection (abnormal SYN packet spikes)
3. ARP Spoofing / Conflict Detection (IP-to-MAC discrepancy)
4. Unknown / Rogue Device Detection (unrecognized MAC on subnet)
5. Suspicious Traffic Detection (anomalous payload sizes & restricted ports)
"""

from collections import defaultdict
import time
from datetime import datetime
from database import get_db_connection
from risk_engine import RiskEngine
from firewall_manager import FirewallManager

class DetectionEngine:
    def __init__(self):
        # Sliding window state trackers
        self.port_scan_tracker = defaultdict(list) # src_ip -> [(timestamp, dst_port)]
        self.syn_burst_tracker = defaultdict(list) # src_ip -> [timestamp]
        self.arp_table = {}                        # ip -> mac
        
    def process_packet(self, packet_meta: dict, auto_mitigate: bool = True) -> dict:
        """
        Process a single packet metadata dictionary:
        {
            'src_ip': '192.168.1.15',
            'dst_ip': '192.168.1.10',
            'src_port': 49152,
            'dst_port': 80,
            'protocol': 'TCP',
            'packet_size': 64,
            'tcp_flags': 'S',
            'mac': '3C:52:82:AA:BB:CC',
            'is_demo': True
        }
        """
        src_ip = packet_meta.get("src_ip")
        dst_ip = packet_meta.get("dst_ip")
        src_port = packet_meta.get("src_port")
        dst_port = packet_meta.get("dst_port")
        protocol = packet_meta.get("protocol", "TCP").upper()
        packet_size = packet_meta.get("packet_size", 64)
        tcp_flags = packet_meta.get("tcp_flags", "")
        mac = packet_meta.get("mac", "00:00:00:00:00:00")
        is_demo = packet_meta.get("is_demo", True)
        
        now = time.time()
        detections = []
        
        # Fetch active rule configs from DB
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM config_rules WHERE enabled = 1")
        rules = {row["detection_type"]: dict(row) for row in cursor.fetchall()}
        
        # 1. Rule: Unknown / Rogue Device Detection
        if "UNKNOWN_DEVICE" in rules and src_ip and not src_ip.startswith("0.0.0.0"):
            cursor.execute("SELECT * FROM devices WHERE ip = ? OR mac = ?", (src_ip, mac))
            dev = cursor.fetchone()
            if not dev:
                # Discovered new rogue device
                cursor.execute("""
                INSERT INTO devices (ip, mac, hostname, vendor, device_type, status, risk_score, packets_per_sec, bytes_per_sec, is_demo)
                VALUES (?, ?, 'unidentified-device.local', 'Unknown Vendor', 'Unknown Device', 'SUSPICIOUS', 5.0, 1.0, 64.0, ?)
                """, (src_ip, mac, 1 if is_demo else 0))
                
                cursor.execute("""
                INSERT INTO system_events (event_type, device, threat, risk, action, result, message, severity, is_demo)
                VALUES ('DEVICE_DISCOVERED', ?, 'Unknown / Rogue Device', 5.0, 'INVENTORY_ADD', 'LOGGED', ?, 'WARNING', ?)
                """, (src_ip, f"Newly observed host {src_ip} ({mac}) detected on subnet. Added to inventory as Unknown Device.", 1 if is_demo else 0))
                
                detections.append({
                    "threat_type": "Unknown/Rogue Device",
                    "evidence": f"New MAC {mac} and IP {src_ip} observed without pre-authorization.",
                    "risk_score": 5.0,
                    "severity": "MEDIUM",
                    "recommended_action": "Verify hardware authorization and inspect baseline behavior."
                })
            elif dev["device_type"] == "Unknown Device" and dev["status"] != "BLOCKED":
                # Ensure risk reflects unknown status
                cursor.execute("UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE ip = ?", (src_ip,))
        
        # 2. Rule: Port Scan Detection
        if "PORT_SCAN" in rules and protocol == "TCP" and dst_port:
            window = rules["PORT_SCAN"].get("window_sec", 10)
            threshold = rules["PORT_SCAN"].get("threshold", 5)
            
            self.port_scan_tracker[src_ip] = [
                (t, p) for (t, p) in self.port_scan_tracker[src_ip] if now - t <= window
            ]
            self.port_scan_tracker[src_ip].append((now, dst_port))
            
            unique_ports = set(p for (_, p) in self.port_scan_tracker[src_ip])
            if len(unique_ports) >= threshold:
                detections.append({
                    "threat_type": "Port Scan",
                    "evidence": f"Contacted {len(unique_ports)} unique destination ports ({', '.join(str(x) for x in list(unique_ports)[:6])}...) within {window}s window.",
                    "risk_score": 8.0,
                    "severity": "HIGH",
                    "recommended_action": "Isolate host via nftables to prevent active reconnaissance."
                })
                # Reset tracker after detection to prevent alert flooding
                self.port_scan_tracker[src_ip] = []

        # 3. Rule: SYN Flood / Burst Detection
        if "SYN_BURST" in rules and protocol == "TCP" and "S" in tcp_flags and "A" not in tcp_flags:
            window = rules["SYN_BURST"].get("window_sec", 5)
            threshold = rules["SYN_BURST"].get("threshold", 20)
            
            self.syn_burst_tracker[src_ip] = [
                t for t in self.syn_burst_tracker[src_ip] if now - t <= window
            ]
            self.syn_burst_tracker[src_ip].append(now)
            
            if len(self.syn_burst_tracker[src_ip]) >= threshold:
                detections.append({
                    "threat_type": "SYN Flood/Burst",
                    "evidence": f"Abnormal burst of {len(self.syn_burst_tracker[src_ip])} raw TCP SYN packets within {window}s without handshake completion.",
                    "risk_score": 9.0,
                    "severity": "CRITICAL",
                    "recommended_action": "Immediate nftables kernel drop rule to prevent network resource starvation."
                })
                self.syn_burst_tracker[src_ip] = []

        # 4. Rule: ARP Spoofing / Conflict Detection
        if "ARP_CONFLICT" in rules and protocol == "ARP":
            prev_mac = self.arp_table.get(src_ip)
            if prev_mac and prev_mac != mac:
                detections.append({
                    "threat_type": "ARP Spoofing/Conflict",
                    "evidence": f"Conflicting MAC assignment for IP {src_ip}: previous MAC {prev_mac} replaced by unsolicited announcement from {mac}.",
                    "risk_score": 7.5,
                    "severity": "HIGH",
                    "recommended_action": "Verify gateway ARP table integrity and block rogue MAC."
                })
            else:
                self.arp_table[src_ip] = mac

        # 5. Rule: Suspicious Traffic Detection (Restricted Ports / Large anomalous bursts)
        if "SUSPICIOUS_TRAFFIC" in rules:
            suspicious_ports = {4444, 1337, 31337, 6667, 5555}
            if dst_port in suspicious_ports or src_port in suspicious_ports:
                detections.append({
                    "threat_type": "Suspicious Traffic",
                    "evidence": f"Connection attempting communication over known suspicious backdoor/Trojan port {dst_port or src_port}.",
                    "risk_score": 6.0,
                    "severity": "MEDIUM",
                    "recommended_action": "Inspect target application service and quarantine connection."
                })
            elif packet_size > 1450 and protocol == "UDP":
                detections.append({
                    "threat_type": "Suspicious Traffic",
                    "evidence": f"Large UDP datagram ({packet_size} bytes) detected, possible amplification or data exfiltration pattern.",
                    "risk_score": 5.5,
                    "severity": "MEDIUM",
                    "recommended_action": "Monitor bandwidth consumption and inspect payload headers."
                })

        # Process detections into SQLite, Alerts, and Firewall
        response_data = []
        hosts_to_block = []
        
        for det in detections:
            # 1. Look up device
            cursor.execute("SELECT * FROM devices WHERE ip = ?", (src_ip,))
            device_row = cursor.fetchone()
            device_id = device_row["device_id"] if device_row else None
            device_mac = device_row["mac"] if device_row else mac
            
            # 2. Insert into threats
            cursor.execute("""
            INSERT INTO threats (device_id, device_ip, threat_type, evidence, risk_score, severity, status, recommended_action, current_action, is_demo)
            VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, 'ISOLATION PENDING', ?)
            """, (device_id, src_ip, det["threat_type"], det["evidence"], det["risk_score"], det["severity"], det["recommended_action"], 1 if is_demo else 0))
            threat_id = cursor.lastrowid
            
            # 3. Create Alert
            action_taken = "BLOCKED" if (auto_mitigate and det["risk_score"] >= 8.0) else "MONITORED"
            cursor.execute("""
            INSERT INTO alerts (device_id, device_ip, mac_address, threat_id, threat_type, message, evidence, risk_score, severity, action, status, is_demo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)
            """, (device_id, src_ip, device_mac, threat_id, det["threat_type"], f"{det['threat_type']} detected on host {src_ip}", det["evidence"], det["risk_score"], det["severity"], action_taken, 1 if is_demo else 0))
            alert_id = cursor.lastrowid
            
            # 4. Update Device Risk Score & Status
            cursor.execute("""
            UPDATE devices
            SET risk_score = ?, status = CASE WHEN ? = 'BLOCKED' THEN 'BLOCKED' ELSE 'SUSPICIOUS' END
            WHERE ip = ?
            """, (det["risk_score"], action_taken, src_ip))
            
            # 5. Log System Audit Events
            cursor.execute("""
            INSERT INTO system_events (event_type, device, threat, risk, action, result, message, severity, is_demo)
            VALUES ('THREAT_DETECTED', ?, ?, ?, 'HEURISTIC_RULE_MATCH', 'ALERT_GENERATED', ?, ?, ?)
            """, (src_ip, det["threat_type"], det["risk_score"], f"Heuristic detection triggered for {det['threat_type']}: {det['evidence']}", det["severity"], 1 if is_demo else 0))
            
            cursor.execute("""
            INSERT INTO system_events (event_type, device, threat, risk, action, result, message, severity, is_demo)
            VALUES ('ALERT_CREATED', ?, ?, ?, ?, 'DISPATCHED_TO_UI', ?, ?, ?)
            """, (src_ip, det["threat_type"], det["risk_score"], action_taken, f"Alert #{alert_id} dispatched for {src_ip} (Risk {det['risk_score']}/10)", det["severity"], 1 if is_demo else 0))
            
            if auto_mitigate and det["risk_score"] >= 8.0:
                hosts_to_block.append((src_ip, f"Auto-mitigation: {det['threat_type']} (Risk {det['risk_score']}/10)"))
                
            det["threat_id"] = threat_id
            det["alert_id"] = alert_id
            det["action_taken"] = action_taken
            response_data.append(det)

        # Log traffic event metadata (never payload content)
        cursor.execute("""
        INSERT INTO traffic_events (src_ip, dst_ip, src_port, dst_port, protocol, packet_size, tcp_flags, risk_score, action, is_demo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (src_ip, dst_ip, src_port, dst_port, protocol, packet_size, tcp_flags, response_data[0]["risk_score"] if response_data else 0.0, "BLOCKED" if any(d.get("action_taken") == "BLOCKED" for d in response_data) else "FORWARDED", 1 if is_demo else 0))
        
        conn.commit()
        conn.close()
        
        # Execute firewall block actions after closing open database handle
        for block_ip, comment in hosts_to_block:
            FirewallManager.block_host(block_ip, comment=comment, is_demo=is_demo)
        
        return {
            "processed": True,
            "detections": response_data,
            "packet_logged": True
        }

# Singleton instance
detection_engine = DetectionEngine()
