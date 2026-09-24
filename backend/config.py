import os

class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    DB_PATH = os.path.join(BASE_DIR, "falconx.db")
    
    # Network Monitoring Defaults
    DEFAULT_INTERFACE = "eth0"
    DEFAULT_SUBNET = "192.168.1.0/24"
    DEFAULT_GATEWAY = "192.168.1.1"
    
    # Heuristic Detection Thresholds
    PORT_SCAN_THRESHOLD = 5         # Unique ports in 10-second window
    PORT_SCAN_WINDOW_SEC = 10
    
    SYN_BURST_THRESHOLD = 20        # SYN packets in 5-second window
    SYN_BURST_WINDOW_SEC = 5
    
    SUSPICIOUS_PACKET_SIZE_MIN = 1400 # Bytes (potential fragmentation/exfiltration)
    SUSPICIOUS_PORTS = [4444, 1337, 31337, 6667, 5555, 9999, 8888]
    
    # Risk Weight Multipliers (0-10 scale)
    RISK_WEIGHT_PORT_SCAN = 8.0
    RISK_WEIGHT_SYN_BURST = 9.0
    RISK_WEIGHT_ARP_CONFLICT = 7.5
    RISK_WEIGHT_UNKNOWN_DEVICE = 5.0
    RISK_WEIGHT_SUSPICIOUS_TRAFFIC = 6.0
    
    # Demo Mode
    DEFAULT_DEMO_MODE = True
    STREAM_INTERVAL_SEC = 1.0
