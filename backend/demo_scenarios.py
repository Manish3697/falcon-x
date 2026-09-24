"""
FALCON-X Test Scenarios Controller
Provides controlled, repeatable, high-impact cybersecurity validation scenarios.
Consistent IP mappings:
- Gateway: 192.168.1.1
- IP Camera: 192.168.1.10
- Industrial Sensor: 192.168.1.11
- POS Terminal: 192.168.1.12
- Admin Laptop: 192.168.1.15
- Unknown / Rogue Host: 192.168.1.22
"""

import time
from datetime import datetime
from database import get_db_connection
from detection_engine import detection_engine
from firewall_manager import FirewallManager

class DemoScenarios:
    @classmethod
    def simulate_normal_traffic(cls):
        """Generates realistic normal IoT traffic between baseline devices"""
        packets = [
            {"src_ip": "192.168.1.10", "dst_ip": "192.168.1.1", "src_port": 554, "dst_port": 51234, "protocol": "RTSP", "packet_size": 1024, "tcp_flags": "PA", "mac": "D8:96:E0:11:22:33", "is_demo": True},
            {"src_ip": "192.168.1.11", "dst_ip": "192.168.1.1", "src_port": 502, "dst_port": 49152, "protocol": "MODBUS", "packet_size": 128, "tcp_flags": "PA", "mac": "B8:27:EB:55:66:77", "is_demo": True},
            {"src_ip": "192.168.1.12", "dst_ip": "192.168.1.1", "src_port": 443, "dst_port": 50100, "protocol": "TLS", "packet_size": 512, "tcp_flags": "A", "mac": "00:0E:C6:88:99:AA", "is_demo": True},
            {"src_ip": "192.168.1.15", "dst_ip": "192.168.1.1", "src_port": 5353, "dst_port": 5353, "protocol": "MDNS", "packet_size": 84, "tcp_flags": "", "mac": "3C:52:82:AA:BB:CC", "is_demo": True}
        ]
        results = []
        for p in packets:
            r = detection_engine.process_packet(p, auto_mitigate=False)
            results.append(r)
        return {"scenario": "NORMAL_TRAFFIC", "status": "COMPLETED", "packets_injected": len(packets)}

    @classmethod
    def simulate_port_scan(cls, auto_mitigate: bool = True):
        """
        Simulate port scan from 192.168.1.15 (Laptop) scanning 192.168.1.10 across 8 ports.
        Triggers RULE-001 -> Risk 8.0 (HIGH) -> Alert -> Isolation.
        """
        attacker_ip = "192.168.1.15"
        attacker_mac = "3C:52:82:AA:BB:CC"
        target_ip = "192.168.1.10"
        scanned_ports = [21, 22, 23, 80, 443, 554, 8080, 9000]
        
        last_result = None
        for port in scanned_ports:
            pkt = {
                "src_ip": attacker_ip,
                "dst_ip": target_ip,
                "src_port": 49100 + port,
                "dst_port": port,
                "protocol": "TCP",
                "packet_size": 60,
                "tcp_flags": "S",
                "mac": attacker_mac,
                "is_demo": True
            }
            last_result = detection_engine.process_packet(pkt, auto_mitigate=auto_mitigate)
            
        return {
            "scenario": "PORT_SCAN",
            "attacker_ip": attacker_ip,
            "target_ip": target_ip,
            "ports_probed": scanned_ports,
            "detections": last_result.get("detections", []) if last_result else [],
            "status": "THREAT_TRIGGERED"
        }

    @classmethod
    def simulate_syn_burst(cls, auto_mitigate: bool = True):
        """
        Simulate aggressive SYN flood burst from 192.168.1.22 (Unknown Device) targeting Gateway.
        Triggers RULE-002 -> Risk 9.0 (CRITICAL) -> Immediate nftables Isolation.
        """
        attacker_ip = "192.168.1.22"
        attacker_mac = "A4:C3:F0:DD:EE:FF"
        target_ip = "192.168.1.1"
        
        last_result = None
        for i in range(25): # 25 SYN packets exceeds threshold of 20
            pkt = {
                "src_ip": attacker_ip,
                "dst_ip": target_ip,
                "src_port": 50000 + i,
                "dst_port": 80,
                "protocol": "TCP",
                "packet_size": 54,
                "tcp_flags": "S",
                "mac": attacker_mac,
                "is_demo": True
            }
            last_result = detection_engine.process_packet(pkt, auto_mitigate=auto_mitigate)
            
        return {
            "scenario": "SYN_BURST",
            "attacker_ip": attacker_ip,
            "target_ip": target_ip,
            "syn_count": 25,
            "detections": last_result.get("detections", []) if last_result else [],
            "status": "CRITICAL_THREAT_TRIGGERED"
        }

    @classmethod
    def simulate_arp_conflict(cls, auto_mitigate: bool = False):
        """
        Simulate rogue ARP spoofing/conflict attempt by 192.168.1.22 claiming Gateway IP.
        Triggers RULE-003 -> Risk 7.5 (HIGH) -> Alert.
        """
        # First register normal mapping
        detection_engine.arp_table["192.168.1.1"] = "00:1A:2B:3C:4D:01"
        
        # Now rogue announcement with conflicting MAC
        pkt = {
            "src_ip": "192.168.1.1",
            "dst_ip": "192.168.1.255",
            "src_port": 0,
            "dst_port": 0,
            "protocol": "ARP",
            "packet_size": 42,
            "tcp_flags": "",
            "mac": "A4:C3:F0:DD:EE:FF", # Conflicting MAC pretending to be Gateway
            "is_demo": True
        }
        res = detection_engine.process_packet(pkt, auto_mitigate=auto_mitigate)
        return {
            "scenario": "ARP_CONFLICT",
            "spoofed_ip": "192.168.1.1",
            "rogue_mac": "A4:C3:F0:DD:EE:FF",
            "detections": res.get("detections", []),
            "status": "ARP_POISON_DETECTED"
        }

    @classmethod
    def simulate_unknown_device(cls):
        """
        Simulate new unapproved device appearing on the subnet.
        Triggers RULE-004 -> Risk 5.0 (MEDIUM) -> Rogue Device Alert.
        """
        new_ip = "192.168.1.99"
        new_mac = "E4:5F:01:23:45:67"
        
        pkt = {
            "src_ip": new_ip,
            "dst_ip": "192.168.1.1",
            "src_port": 68,
            "dst_port": 67,
            "protocol": "DHCP",
            "packet_size": 342,
            "tcp_flags": "",
            "mac": new_mac,
            "is_demo": True
        }
        res = detection_engine.process_packet(pkt, auto_mitigate=False)
        return {
            "scenario": "UNKNOWN_DEVICE",
            "discovered_ip": new_ip,
            "mac": new_mac,
            "detections": res.get("detections", []),
            "status": "NEW_DEVICE_DISCOVERED"
        }

    @classmethod
    def simulate_suspicious_traffic(cls):
        """
        Simulate connection targeting anomalous Trojan/backdoor port 4444.
        Triggers RULE-005 -> Risk 6.0 (MEDIUM) -> Alert.
        """
        pkt = {
            "src_ip": "192.168.1.12",
            "dst_ip": "198.51.100.4",
            "src_port": 51200,
            "dst_port": 4444, # Metasploit default backdoor port
            "protocol": "TCP",
            "packet_size": 850,
            "tcp_flags": "PA",
            "mac": "00:0E:C6:88:99:AA",
            "is_demo": True
        }
        res = detection_engine.process_packet(pkt, auto_mitigate=False)
        return {
            "scenario": "SUSPICIOUS_TRAFFIC",
            "src_ip": "192.168.1.12",
            "dst_port": 4444,
            "detections": res.get("detections", []),
            "status": "SUSPICIOUS_PORT_DETECTED"
        }

    @classmethod
    def clear_demo_events(cls):
        """
        Resets test alerts, threats, firewall rules, and restores all devices to baseline.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM alerts WHERE is_demo = 1")
        cursor.execute("DELETE FROM threats WHERE is_demo = 1")
        cursor.execute("DELETE FROM traffic_events WHERE is_demo = 1")
        cursor.execute("DELETE FROM firewall_rules WHERE is_demo = 1")
        cursor.execute("DELETE FROM devices WHERE ip = '192.168.1.99'") # delete newly added rogue
        
        # Reset baseline device risks
        cursor.execute("""
        UPDATE devices 
        SET risk_score = CASE 
            WHEN ip = '192.168.1.22' THEN 5.0
            WHEN ip = '192.168.1.10' THEN 1.2
            WHEN ip = '192.168.1.15' THEN 1.5
            ELSE 0.2
        END,
        status = CASE 
            WHEN ip = '192.168.1.22' THEN 'SUSPICIOUS'
            ELSE 'ONLINE'
        END
        WHERE is_demo = 1
        """)
        
        cursor.execute("""
        INSERT INTO system_events (event_type, action, result, message, severity, is_demo)
        VALUES ('TEST_STATE_RESET', 'CLEAR_TEST_DATA', 'SUCCESS', 'Test scenario state reset: alerts, threats, and isolation rules cleared. Baseline network state restored.', 'INFO', 1)
        """)
        
        conn.commit()
        conn.close()
        
        # Reset tracker states
        detection_engine.port_scan_tracker.clear()
        detection_engine.syn_burst_tracker.clear()
        
        return {"status": "CLEARED", "message": "Test events cleared and baseline restored successfully"}
