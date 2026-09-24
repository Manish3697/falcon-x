"""
FALCON-X REST API Server & Real-time SSE Stream
Flask Backend for Edge IoT Cybersecurity Monitoring
"""

import json
import time
from datetime import datetime
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

from config import Config
from database import init_db, get_db_connection
from risk_engine import RiskEngine
from detection_engine import detection_engine
from firewall_manager import FirewallManager
from system_monitor import SystemMonitor
from packet_capture import packet_capture_mgr
from demo_scenarios import DemoScenarios

app = Flask(__name__)
CORS(app)

# Track current global demo mode state
GLOBAL_STATE = {
    "demo_mode": True,
    "network_subnet": Config.DEFAULT_SUBNET,
    "gateway_ip": Config.DEFAULT_GATEWAY,
    "monitoring_interface": Config.DEFAULT_INTERFACE,
    "monitoring_active": True,
    "auto_mitigate": True
}

# ==========================================
# 1. SYSTEM & STATUS APIS
# ==========================================

@app.route("/api/system/status", methods=["GET"])
def get_system_status():
    specs = SystemMonitor.get_host_specs()
    services = SystemMonitor.get_services_status(demo_mode=GLOBAL_STATE["demo_mode"])
    return jsonify({
        "status": "ONLINE",
        "monitoring": "ACTIVE" if GLOBAL_STATE["monitoring_active"] else "STOPPED",
        "demo_mode": GLOBAL_STATE["demo_mode"],
        "network_subnet": GLOBAL_STATE["network_subnet"],
        "gateway_ip": GLOBAL_STATE["gateway_ip"],
        "interface": GLOBAL_STATE["monitoring_interface"],
        "last_update": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "host_specs": specs,
        "services": services
    })

@app.route("/api/system/resources", methods=["GET"])
def get_system_resources():
    metrics = SystemMonitor.get_realtime_metrics()
    return jsonify(metrics)

# ==========================================
# 2. DEVICES APIS
# ==========================================

@app.route("/api/devices", methods=["GET"])
def get_devices():
    status_filter = request.args.get("status")
    type_filter = request.args.get("type")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM devices WHERE 1=1"
    params = []
    
    if status_filter:
        query += " AND status = ?"
        params.append(status_filter.upper())
    if type_filter:
        query += " AND device_type = ?"
        params.append(type_filter)
        
    query += " ORDER BY risk_score DESC, last_seen DESC"
    cursor.execute(query, params)
    devices = [dict(row) for row in cursor.fetchall()]
    
    # Calculate summary KPIs
    total = len(devices)
    online = sum(1 for d in devices if d["status"] in ("ONLINE", "SUSPICIOUS"))
    unknown = sum(1 for d in devices if d["device_type"] == "Unknown Device")
    blocked = sum(1 for d in devices if d["status"] == "BLOCKED")
    suspicious = sum(1 for d in devices if d["status"] == "SUSPICIOUS")
    
    conn.close()
    return jsonify({
        "devices": devices,
        "summary": {
            "total": total,
            "online": online,
            "unknown": unknown,
            "blocked": blocked,
            "suspicious": suspicious
        }
    })

@app.route("/api/devices/<int:device_id>", methods=["GET"])
def get_device_detail(device_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM devices WHERE device_id = ?", (device_id,))
    dev = cursor.fetchone()
    if not dev:
        conn.close()
        return jsonify({"error": "Device not found"}), 404
        
    device_data = dict(dev)
    dev_ip = device_data["ip"]
    
    # Fetch recent traffic for this device
    cursor.execute("""
    SELECT * FROM traffic_events 
    WHERE src_ip = ? OR dst_ip = ? 
    ORDER BY timestamp DESC LIMIT 20
    """, (dev_ip, dev_ip))
    recent_traffic = [dict(r) for r in cursor.fetchall()]
    
    # Fetch threats for this device
    cursor.execute("SELECT * FROM threats WHERE device_ip = ? ORDER BY timestamp DESC", (dev_ip,))
    threats = [dict(r) for r in cursor.fetchall()]
    
    # Fetch alerts
    cursor.execute("SELECT * FROM alerts WHERE device_ip = ? ORDER BY timestamp DESC", (dev_ip,))
    alerts = [dict(r) for r in cursor.fetchall()]
    
    # Fetch firewall status
    cursor.execute("SELECT * FROM firewall_rules WHERE source_ip = ? AND status = 'ACTIVE'", (dev_ip,))
    fw_rule = cursor.fetchone()
    
    # Top destination IPs
    cursor.execute("""
    SELECT dst_ip, COUNT(*) as count, SUM(packet_size) as total_bytes 
    FROM traffic_events WHERE src_ip = ? 
    GROUP BY dst_ip ORDER BY count DESC LIMIT 5
    """, (dev_ip,))
    top_destinations = [dict(r) for r in cursor.fetchall()]
    
    # Top destination ports / protocols
    cursor.execute("""
    SELECT protocol, dst_port, COUNT(*) as count 
    FROM traffic_events WHERE src_ip = ? 
    GROUP BY protocol, dst_port ORDER BY count DESC LIMIT 5
    """, (dev_ip,))
    top_ports = [dict(r) for r in cursor.fetchall()]
    
    # Calculate detailed risk breakdown
    risk_info = RiskEngine.calculate_device_risk(threats, device_data.get("device_type", "UNKNOWN"))
    
    conn.close()
    return jsonify({
        "device": device_data,
        "is_blocked": fw_rule is not None,
        "firewall_rule": dict(fw_rule) if fw_rule else None,
        "risk_breakdown": risk_info,
        "threats": threats,
        "alerts": alerts,
        "recent_traffic": recent_traffic,
        "top_destinations": top_destinations,
        "top_ports": top_ports
    })

@app.route("/api/devices/<int:device_id>/action", methods=["POST"])
def device_action(device_id):
    data = request.json or {}
    action = data.get("action", "").upper()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devices WHERE device_id = ?", (device_id,))
    dev = cursor.fetchone()
    if not dev:
        conn.close()
        return jsonify({"error": "Device not found"}), 404
        
    dev_ip = dev["ip"]
    conn.close()
    
    if action == "BLOCK":
        res = FirewallManager.block_host(dev_ip, comment=data.get("reason", "Manual block from Device Inventory"), is_demo=GLOBAL_STATE["demo_mode"])
        return jsonify(res)
    elif action == "UNBLOCK":
        res = FirewallManager.unblock_host(dev_ip, is_demo=GLOBAL_STATE["demo_mode"])
        return jsonify(res)
    elif action == "MONITOR":
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("UPDATE devices SET status = 'ONLINE' WHERE device_id = ?", (device_id,))
        c.execute("""
        INSERT INTO system_events (event_type, device, action, result, message, severity, is_demo)
        VALUES ('RISK_UPDATED', ?, 'SET_MONITORING', 'SUCCESS', ?, 'INFO', ?)
        """, (dev_ip, f"Device {dev_ip} set to active baseline monitoring.", 1 if GLOBAL_STATE["demo_mode"] else 0))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "status": "ONLINE"})
    else:
        return jsonify({"error": f"Unknown action: {action}"}), 400

# ==========================================
# 3. TRAFFIC & THREATS APIS
# ==========================================

@app.route("/api/traffic", methods=["GET"])
def get_traffic():
    limit = int(request.args.get("limit", 50))
    src_ip = request.args.get("src_ip")
    dst_ip = request.args.get("dst_ip")
    protocol = request.args.get("protocol")
    min_risk = request.args.get("min_risk")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM traffic_events WHERE 1=1"
    params = []
    
    if src_ip:
        query += " AND src_ip = ?"
        params.append(src_ip)
    if dst_ip:
        query += " AND dst_ip = ?"
        params.append(dst_ip)
    if protocol:
        query += " AND protocol = ?"
        params.append(protocol.upper())
    if min_risk:
        query += " AND risk_score >= ?"
        params.append(float(min_risk))
        
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    events = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    return jsonify({
        "events": events,
        "rate_metrics": {
            "packets_per_sec": packet_capture_mgr.stats["packets_per_sec"],
            "bytes_per_sec": packet_capture_mgr.stats["bytes_per_sec"],
            "total_captured": packet_capture_mgr.stats["packets_captured"]
        },
        "is_demo": GLOBAL_STATE["demo_mode"]
    })

@app.route("/api/threats", methods=["GET"])
def get_threats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT t.*, d.mac, d.hostname, d.device_type 
    FROM threats t
    LEFT JOIN devices d ON t.device_ip = d.ip
    ORDER BY t.id DESC LIMIT 50
    """)
    threats = [dict(r) for r in cursor.fetchall()]
    
    # Distribution by Category
    cursor.execute("""
    SELECT threat_type, COUNT(*) as count, AVG(risk_score) as avg_risk, severity
    FROM threats
    GROUP BY threat_type
    """)
    distribution_rows = cursor.fetchall()
    total_count = sum(r["count"] for r in distribution_rows)
    
    distribution = []
    for r in distribution_rows:
        pct = round((r["count"] / total_count * 100), 1) if total_count > 0 else 0
        distribution.append({
            "category": r["threat_type"],
            "count": r["count"],
            "percentage": pct,
            "avg_risk": round(r["avg_risk"], 1),
            "severity": r["severity"]
        })
        
    conn.close()
    return jsonify({
        "threats": threats,
        "distribution": distribution,
        "total_threats": len(threats)
    })

# ==========================================
# 4. ALERTS APIS
# ==========================================

@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    status = request.args.get("status")
    severity = request.args.get("severity")
    limit = int(request.args.get("limit", 50))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM alerts WHERE 1=1"
    params = []
    if status:
        query += " AND status = ?"
        params.append(status.upper())
    if severity:
        query += " AND severity = ?"
        params.append(severity.upper())
        
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    alerts = [dict(r) for r in cursor.fetchall()]
    
    # Counts
    cursor.execute("SELECT status, COUNT(*) as c FROM alerts GROUP BY status")
    counts = {r["status"]: r["c"] for r in cursor.fetchall()}
    
    conn.close()
    return jsonify({
        "alerts": alerts,
        "open_count": counts.get("OPEN", 0),
        "acknowledged_count": counts.get("ACKNOWLEDGED", 0),
        "resolved_count": counts.get("RESOLVED", 0),
        "total_count": len(alerts)
    })

@app.route("/api/alerts/<int:alert_id>/action", methods=["POST"])
def update_alert(alert_id):
    data = request.json or {}
    new_status = data.get("status", "ACKNOWLEDGED").upper()
    
    if new_status not in ("OPEN", "ACKNOWLEDGED", "RESOLVED"):
        return jsonify({"error": "Invalid status"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET status = ? WHERE id = ?", (new_status, alert_id))
    cursor.execute("""
    INSERT INTO system_events (event_type, action, result, message, severity)
    VALUES ('ALERT_UPDATED', ?, 'SUCCESS', ?, 'INFO')
    """, (new_status, f"Alert #{alert_id} status updated to {new_status}"))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "alert_id": alert_id, "new_status": new_status})

# ==========================================
# 5. RISK ANALYSIS APIS
# ==========================================

@app.route("/api/risk", methods=["GET"])
def get_risk_analysis():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Devices risk metrics
    cursor.execute("SELECT ip, hostname, device_type, risk_score, status, vendor FROM devices ORDER BY risk_score DESC")
    devices = [dict(r) for r in cursor.fetchall()]
    
    highest_risk = devices[0]["risk_score"] if devices else 0.0
    highest_risk_device = devices[0] if devices else None
    
    avg_risk = round(sum(d["risk_score"] for d in devices) / len(devices), 1) if devices else 0.0
    
    # Classification breakdown
    risk_breakdown = {
        "LOW": sum(1 for d in devices if d["risk_score"] < 3.0),
        "MEDIUM": sum(1 for d in devices if 3.0 <= d["risk_score"] < 6.0),
        "HIGH": sum(1 for d in devices if 6.0 <= d["risk_score"] < 9.0),
        "CRITICAL": sum(1 for d in devices if d["risk_score"] >= 9.0)
    }
    
    # Active threat breakdown
    cursor.execute("""
    SELECT threat_type, COUNT(*) as count, AVG(risk_score) as avg_score, severity
    FROM threats
    WHERE status != 'RESOLVED'
    GROUP BY threat_type
    ORDER BY count DESC
    """)
    active_threat_breakdown = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return jsonify({
        "highest_risk": highest_risk,
        "highest_risk_device": highest_risk_device,
        "average_network_risk": avg_risk,
        "average_severity": RiskEngine.classify_score(avg_risk),
        "risk_breakdown": risk_breakdown,
        "top_risky_devices": devices[:5],
        "active_threats": active_threat_breakdown,
        "formula": "Deterministic Multi-Weighted Heuristic Evaluation (0–10 Scale)"
    })

# ==========================================
# 6. CONFIGURABLE RULES APIS
# ==========================================

@app.route("/api/rules", methods=["GET"])
def get_rules():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM config_rules ORDER BY id ASC")
    rules = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"rules": rules})

@app.route("/api/rules/<int:rule_id>/toggle", methods=["POST"])
def toggle_rule(rule_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM config_rules WHERE id = ?", (rule_id,))
    rule = cursor.fetchone()
    if not rule:
        conn.close()
        return jsonify({"error": "Rule not found"}), 404
        
    new_state = 0 if rule["enabled"] else 1
    cursor.execute("UPDATE config_rules SET enabled = ? WHERE id = ?", (new_state, rule_id))
    
    cursor.execute("""
    INSERT INTO system_events (event_type, action, result, message, severity)
    VALUES ('RULE_UPDATED', ?, 'SUCCESS', ?, 'INFO')
    """, ("ENABLE" if new_state else "DISABLE", f"Rule {rule['rule_code']} ({rule['rule_name']}) {'enabled' if new_state else 'disabled'}."))
    
    conn.commit()
    conn.close()
    return jsonify({"success": True, "rule_id": rule_id, "enabled": bool(new_state)})

@app.route("/api/rules/<int:rule_id>", methods=["POST"])
def update_rule(rule_id):
    data = request.json or {}
    threshold = data.get("threshold")
    weight = data.get("weight")
    window_sec = data.get("window_sec")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    UPDATE config_rules
    SET threshold = COALESCE(?, threshold),
        weight = COALESCE(?, weight),
        window_sec = COALESCE(?, window_sec)
    WHERE id = ?
    """, (threshold, weight, window_sec, rule_id))
    
    conn.commit()
    conn.close()
    return jsonify({"success": True, "rule_id": rule_id})

# ==========================================
# 7. FIREWALL / NFTABLES APIS
# ==========================================

@app.route("/api/firewall/rules", methods=["GET"])
def get_firewall_rules():
    rules = FirewallManager.get_active_rules()
    return jsonify({
        "rules": rules,
        "mechanism": "Linux nftables (inet falconx_filter)",
        "is_nftables_native": FirewallManager.is_nftables_available()
    })

@app.route("/api/firewall/block", methods=["POST"])
def block_host_api():
    data = request.json or {}
    ip = data.get("ip")
    comment = data.get("comment", "Manual isolation request")
    if not ip:
        return jsonify({"error": "Missing IP parameter"}), 400
        
    res = FirewallManager.block_host(ip, comment=comment, is_demo=GLOBAL_STATE["demo_mode"])
    return jsonify(res)

@app.route("/api/firewall/unblock", methods=["POST"])
def unblock_host_api():
    data = request.json or {}
    ip = data.get("ip")
    if not ip:
        return jsonify({"error": "Missing IP parameter"}), 400
        
    res = FirewallManager.unblock_host(ip, is_demo=GLOBAL_STATE["demo_mode"])
    return jsonify(res)

@app.route("/api/firewall/rules", methods=["POST"])
def add_custom_firewall_rule():
    data = request.json or {}
    src_ip = data.get("source_ip", "any")
    dst_ip = data.get("destination", "any")
    protocol = data.get("protocol", "all")
    port = data.get("port", "any")
    action = data.get("action", "BLOCK")
    comment = data.get("comment", "User configured rule")
    
    res = FirewallManager.add_custom_rule(src_ip, dst_ip, protocol, port, action, comment)
    return jsonify(res)

@app.route("/api/firewall/rules/<rule_id>", methods=["DELETE"])
def delete_firewall_rule(rule_id):
    res = FirewallManager.delete_rule(rule_id)
    return jsonify(res)

# ==========================================
# 8. AUDIT & EVENT LOGS APIS
# ==========================================

@app.route("/api/logs", methods=["GET"])
def get_event_logs():
    event_type = request.args.get("event_type")
    severity = request.args.get("severity")
    search = request.args.get("search")
    limit = int(request.args.get("limit", 100))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM system_events WHERE 1=1"
    params = []
    
    if event_type:
        query += " AND event_type = ?"
        params.append(event_type)
    if severity:
        query += " AND severity = ?"
        params.append(severity.upper())
    if search:
        query += " AND (message LIKE ? OR device LIKE ? OR action LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    logs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    return jsonify({"logs": logs, "total": len(logs)})

# ==========================================
# 9. DEMO SCENARIOS & EXPO CONTROLS
# ==========================================

@app.route("/api/demo/mode", methods=["POST"])
def set_demo_mode():
    data = request.json or {}
    enabled = data.get("enabled", True)
    GLOBAL_STATE["demo_mode"] = bool(enabled)
    packet_capture_mgr.is_demo_mode = bool(enabled)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO system_events (event_type, action, result, message, severity)
    VALUES ('SYSTEM_MODE_CHANGED', ?, 'SUCCESS', ?, 'INFO')
    """, ("DEMO_MODE" if enabled else "LIVE_MODE", f"Operating mode switched to {'DEMO MODE (Simulated Data)' if enabled else 'LIVE MONITORING'}"))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "demo_mode": GLOBAL_STATE["demo_mode"]})

@app.route("/api/demo/simulate-normal", methods=["POST"])
def trigger_normal():
    res = DemoScenarios.simulate_normal_traffic()
    return jsonify(res)

@app.route("/api/demo/simulate-port-scan", methods=["POST"])
def trigger_port_scan():
    auto_mit = GLOBAL_STATE.get("auto_mitigate", True)
    res = DemoScenarios.simulate_port_scan(auto_mitigate=auto_mit)
    return jsonify(res)

@app.route("/api/demo/simulate-syn-burst", methods=["POST"])
def trigger_syn_burst():
    auto_mit = GLOBAL_STATE.get("auto_mitigate", True)
    res = DemoScenarios.simulate_syn_burst(auto_mitigate=auto_mit)
    return jsonify(res)

@app.route("/api/demo/simulate-arp-conflict", methods=["POST"])
def trigger_arp_conflict():
    res = DemoScenarios.simulate_arp_conflict(auto_mitigate=False)
    return jsonify(res)

@app.route("/api/demo/simulate-unknown-device", methods=["POST"])
def trigger_unknown_device():
    res = DemoScenarios.simulate_unknown_device()
    return jsonify(res)

@app.route("/api/demo/simulate-suspicious-traffic", methods=["POST"])
def trigger_suspicious_traffic():
    res = DemoScenarios.simulate_suspicious_traffic()
    return jsonify(res)

@app.route("/api/demo/clear", methods=["POST"])
def trigger_clear_demo():
    res = DemoScenarios.clear_demo_events()
    return jsonify(res)

# ==========================================
# 10. REAL-TIME SERVER-SENT EVENTS (SSE)
# ==========================================

@app.route("/api/stream")
def sse_stream():
    def event_generator():
        while True:
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                
                # Fetch recent counts
                cursor.execute("SELECT COUNT(*) as c FROM devices")
                total_devices = cursor.fetchone()["c"]
                
                cursor.execute("SELECT COUNT(*) as c FROM devices WHERE status IN ('ONLINE', 'SUSPICIOUS')")
                online_devices = cursor.fetchone()["c"]
                
                cursor.execute("SELECT COUNT(*) as c FROM devices WHERE device_type = 'Unknown Device'")
                unknown_devices = cursor.fetchone()["c"]
                
                cursor.execute("SELECT COUNT(*) as c FROM threats")
                threats_count = cursor.fetchone()["c"]
                
                cursor.execute("SELECT COUNT(*) as c FROM alerts WHERE status = 'OPEN'")
                unresolved_alerts = cursor.fetchone()["c"]
                
                cursor.execute("SELECT COUNT(*) as c FROM threats WHERE severity = 'CRITICAL'")
                critical_threats = cursor.fetchone()["c"]
                
                cursor.execute("SELECT COUNT(*) as c FROM firewall_rules WHERE status = 'ACTIVE' AND action = 'BLOCK'")
                blocked_hosts = cursor.fetchone()["c"]
                
                cursor.execute("SELECT MAX(risk_score) as max_r, AVG(risk_score) as avg_r FROM devices")
                risk_row = cursor.fetchone()
                highest_risk = round(risk_row["max_r"] or 0.0, 1)
                avg_risk = round(risk_row["avg_r"] or 0.0, 1)
                
                # Fetch latest 5 traffic events
                cursor.execute("SELECT * FROM traffic_events ORDER BY id DESC LIMIT 5")
                recent_traffic = [dict(r) for r in cursor.fetchall()]
                
                # Fetch latest 3 alerts
                cursor.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT 3")
                recent_alerts = [dict(r) for r in cursor.fetchall()]
                
                conn.close()
                
                # Metrics
                hw = SystemMonitor.get_realtime_metrics()
                
                payload = {
                    "timestamp": datetime.now().strftime("%H:%M:%S"),
                    "demo_mode": GLOBAL_STATE["demo_mode"],
                    "kpis": {
                        "devices": {
                            "total": total_devices,
                            "online": online_devices,
                            "unknown": unknown_devices
                        },
                        "traffic": {
                            "packets_per_sec": packet_capture_mgr.stats["packets_per_sec"],
                            "bytes_per_sec": packet_capture_mgr.stats["bytes_per_sec"],
                            "status": "NORMAL" if highest_risk < 6.0 else "ELEVATED"
                        },
                        "threats": {
                            "detected": threats_count,
                            "unresolved": unresolved_alerts,
                            "critical": critical_threats
                        },
                        "blocked": {
                            "blocked_hosts": blocked_hosts,
                            "active_rules": blocked_hosts
                        },
                        "risk": {
                            "highest_risk": highest_risk,
                            "avg_risk": avg_risk,
                            "severity": RiskEngine.classify_score(highest_risk)
                        },
                        "system": {
                            "cpu_percent": hw["cpu_percent"],
                            "ram_percent": hw["ram_percent"],
                            "uptime": hw["uptime_formatted"]
                        }
                    },
                    "traffic_events": recent_traffic,
                    "latest_alerts": recent_alerts
                }
                
                yield f"data: {json.dumps(payload)}\n\n"
                time.sleep(1.0)
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                time.sleep(2.0)

    return Response(event_generator(), mimetype="text/event-stream")

# ==========================================
# INITIALIZATION
# ==========================================

init_db()
packet_capture_mgr.start_capture(demo_mode=GLOBAL_STATE["demo_mode"])

if __name__ == "__main__":
    print("==================================================")
    print("FALCON-X Edge Cybersecurity Engine Starting...")
    print("Edge Host Inspection:", SystemMonitor.get_host_specs()["current_host"]["name"])
    print("Target Deployment Arch:", SystemMonitor.get_host_specs()["target_deployment"]["hardware"])
    print("Demo Mode:", GLOBAL_STATE["demo_mode"])
    print("==================================================")
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
