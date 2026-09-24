# FALCON-X: Affordable Linux-Based Edge IoT Cybersecurity Platform

<div align="center">

**Developed by Team Vision X**  
*Autonomous, Agentless, Low-Cost Edge Network Security for MSME IoT Environments*

[![Architecture](https://img.shields.io/badge/Architecture-Edge%20Computing-0284C7.svg)](#core-architecture)
[![Detection](https://img.shields.io/badge/Detection-Deterministic%20Heuristics-F97316.svg)](#heuristic-detection-rules)
[![Mitigation](https://img.shields.io/badge/Mitigation-Linux%20nftables-EF4444.svg)](#mitigation--host-isolation-nftables)
[![Offline](https://img.shields.io/badge/Operation-100%25%20Offline%20Capable-10B981.svg)](#offline-capable-operation)

</div>

---

## 1. Project Overview & Objective

Small and Medium Enterprises (MSMEs) increasingly deploy smart IoT sensors, IP cameras, POS payment terminals, and Programmable Logic Controllers (PLCs) without dedicated security operations centers. Existing enterprise security solutions require costly subscriptions, heavy cloud uplinks, and significant compute overhead.

**FALCON-X** is an affordable, Linux-based edge cybersecurity appliance that operates locally within the broadcast domain of an MSME IoT network. It monitors network traffic promiscuously, maintains an automated device inventory, detects suspicious behaviors using deterministic heuristic rules, computes an explainable 0–10 risk score, generates actionable alerts, logs all events into an immutable local database, and can autonomously isolate compromised hosts using Linux `nftables`.

> [!NOTE]
> **Core Principle**: FALCON-X runs 100% locally at the network edge with zero cloud dependency and zero ongoing subscription costs. The current operational prototype uses deterministic/heuristic rules; machine learning is reserved for future scope.

---

## 2. Hardware Architecture & Deployment Context

### Target Production Deployment
- **Platform**: Raspberry Pi 4B (ARM64)
- **Processor**: Broadcom BCM2711, Quad-core Cortex-A72 @ 1.8GHz
- **RAM**: 4 GB LPDDR4-3200 SDRAM
- **Interfaces**: Integrated Gigabit Ethernet (`eth0`) + USB 3.0 Gigabit Ethernet Adapter (`eth1`)
- **Storage**: 32 GB High-Endurance microSD
- **Power**: 5V / 3.0A USB-C DC
- **Operating System**: Linux (Raspberry Pi OS 64-bit Lite / Debian)

### Demonstration Host Dynamic Adaptation
When deployed on demonstration laptops (e.g. Intel Pentium/Core with 4 GB RAM) or development nodes, FALCON-X **dynamically detects and displays the actual host hardware** in real-time, while explicitly listing the Raspberry Pi 4B as the target production deployment.

---

## 3. Core Edge Pipeline

```
┌─────────────────┐
│   IoT Devices   │ (Cameras, Sensors, POS, PLCs, Laptops)
└────────┬────────┘
         │ (Ethernet / Broadcast Traffic)
         ▼
┌─────────────────┐
│ Packet Capture  │ (Scapy / Raw Sockets / Promiscuous Mode)
└────────┬────────┘
         │ (L3/L4 Headers & Metadata — Zero Payload Retention)
         ▼
┌─────────────────┐
│Feature Extract  │ (Window Counters, Port Profiles, Flag Patterns)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Heuristic Engine │ (Deterministic Detection Rules)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Risk Scorer 0-10 │ (Weighted Deterministic Formula)
└────────┬────────┘
         │
         ├───► [Alert Generation] ──► [Local SQLite Event Store]
         │
         ▼
┌─────────────────┐
│nftables Firewall│ (Autonomous / Manual Host Drop Rule)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Local Dashboard  │ (Real-Time React + Vite Web Operations Center)
└─────────────────┘
```

---

## 4. Deterministic Heuristic Detection Rules

FALCON-X avoids opaque "AI" blackboxes. Every alert is traceable to an explicit deterministic rule:

| Rule Code | Rule Name | Detection Mechanism | Severity | Default Weight |
|:---|:---|:---|:---|:---:|
| `RULE-001` | **Port Scan Detection** | Detects $\ge 5$ distinct destination ports contacted by a single source host within a 10s sliding window. | `HIGH` | **8.0** |
| `RULE-002` | **SYN Flood / Burst Detection** | Detects abnormal bursts ($\ge 20$) of raw TCP `SYN` packets without three-way handshake completion within 5s. | `CRITICAL` | **9.0** |
| `RULE-003` | **ARP Spoofing / Conflict** | Detects unauthorized MAC replacements for known IP bindings or gratuitous ARP announcements. | `HIGH` | **7.5** |
| `RULE-004` | **Unknown / Rogue Device** | Flags newly observed MAC addresses appearing on the subnet without prior baseline registration. | `MEDIUM` | **5.0** |
| `RULE-005` | **Suspicious Traffic Profile** | Identifies connections targeting anomalous backdoor/trojan ports (e.g., `4444`, `1337`) or oversized UDP payloads. | `MEDIUM` | **6.0** |

---

## 5. Explainable 0–10 Risk Scoring

Risk is calculated via deterministic weighted evaluation:

$$\text{Risk Score} = \min\left(10.0, \, \max(\text{Triggered Rule Weights}) + 0.5 \times (\text{Concurrent Incidents} - 1)\right)$$

### Severity Bands
- **`0.0 – 2.9` (LOW)**: Normal baseline network behavior.
- **`3.0 – 5.9` (MEDIUM)**: Suspicious anomaly or unregistered rogue device.
- **`6.0 – 8.9` (HIGH)**: Active reconnaissance or ARP conflict detected.
- **`9.0 – 10.0` (CRITICAL)**: Aggressive SYN flood / DoS; triggers automatic `nftables` isolation.

---

## 6. Mitigation & Host Isolation (`nftables`)

When a critical threat is confirmed, FALCON-X interacts directly with the Linux kernel packet filtering framework:

```bash
# Safe rule generated by backend
nft add rule inet falconx_filter isolation_chain ip saddr 192.168.1.22 drop comment "Auto-mitigation: SYN Flood/Burst"
```

- **Zero accepted packets** from isolated hosts.
- Strict input validation prevents command injection.
- Immediate UI notification and permanent audit trail logging in SQLite.

---

## 7. Project Expo 2-Minute Demonstration Walkthrough

For evaluating judges or expo attendees:

1. **Step 1**: Open the dashboard at `http://localhost:5173`. Point out the **Header** (Host, Subnet, System Online status) and **Sidebar**.
2. **Step 2**: Navigate to **Devices** to showcase the discovered IoT devices (Camera, Sensor, POS, PLC, Laptop, Rogue node).
3. **Step 3**: Open **Live Traffic** to demonstrate live packet metadata streaming without storing private payloads.
4. **Step 4**: Click the **`PORT SCAN`** scenario button in the top Demo Control Bar.
5. **Step 5**: Observe the prompt update: Host `192.168.1.15` triggers `RULE-001`, risk climbs to **8.0 (HIGH)**, and an alert is dispatched instantly.
6. **Step 6**: Click **`SYN BURST`** scenario button.
7. **Step 7**: Host `192.168.1.22` triggers `RULE-002`, risk reaches **9.0 (CRITICAL)**, and the system **autonomously isolates the host via nftables**.
8. **Step 8**: Navigate to **Network Rules** to inspect the active kernel firewall drop rule.
9. **Step 9**: Navigate to **Event Logs** to show the complete immutable audit trail recorded in SQLite.
10. **Step 10**: Click **`CLEAR DEMO EVENTS`** to reset the baseline for the next presenter run.

---

## 8. Verified Prototype Operational Benchmarks

Empirically recorded from the prototype appliance:

- **Cold Boot Time**: `22.4 seconds`
- **SYN Anomaly Detection Latency**: `~1.2 seconds`
- **Dashboard Telemetry Latency**: `< 30 milliseconds`
- **Daemon Fault Recovery Time**: `~1.4 seconds`
- **nftables Blocking Efficiency**: `Zero accepted packets observed from isolated hosts`
- **Promiscuous Packet Capture**: `No packet-buffer loss during sustained stress tests`

---

## 9. Quick Installation & Startup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Setup Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*Backend runs on `http://127.0.0.1:5000`*

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

### One-Click Launchers
- **Windows**: Double click `scripts/start_falconx.bat`
- **Linux**: Run `bash scripts/start_falconx.sh`

---

## 10. REST API Specification

### Status & Telemetry
- `GET /api/system/status` — Dynamic Edge Host hardware specs & services status
- `GET /api/system/resources` — Live CPU, RAM, Disk, Uptime metrics
- `GET /api/stream` — Real-Time Server-Sent Events (SSE) telemetry stream

### Device Inventory
- `GET /api/devices` — List discovered network assets with risk scores
- `GET /api/devices/:id` — Device profile, traffic history, top destinations/ports
- `POST /api/devices/:id/action` — Trigger `BLOCK`, `UNBLOCK`, or `MONITOR` action

### Traffic & Security Incidents
- `GET /api/traffic` — Query filtered packet metadata
- `GET /api/threats` — Categorized threats & distribution breakdown
- `GET /api/alerts` — Incident alert queue with triage status
- `POST /api/alerts/:id/action` — Transition alert to `ACKNOWLEDGED` or `RESOLVED`
- `GET /api/risk` — Multi-factor risk analysis summary

### Firewall & Rules
- `GET /api/firewall/rules` — Active `nftables` isolation rules
- `POST /api/firewall/block` — Add kernel drop rule for IP
- `POST /api/firewall/unblock` — Remove drop rule for IP
- `GET /api/rules` — Configurable detection rule engine
- `POST /api/rules/:id/toggle` — Enable/Disable heuristic rule

### Demonstration Controls
- `POST /api/demo/mode` — Toggle Live vs Demo Mode
- `POST /api/demo/simulate-port-scan` — Inject port scan attack scenario
- `POST /api/demo/simulate-syn-burst` — Inject SYN flood burst scenario
- `POST /api/demo/simulate-arp-conflict` — Inject ARP poison scenario
- `POST /api/demo/simulate-unknown-device` — Inject rogue asset scenario
- `POST /api/demo/simulate-suspicious-traffic` — Inject backdoor port traffic
- `POST /api/demo/clear` — Reset all demo states and restore baseline

---

## 11. Current Prototype vs Future Scope

| Feature Area | Current Implemented Prototype | Future Scope |
|:---|:---|:---|
| **Detection** | Deterministic / Heuristic Rules (Sliding Windows) | Edge TinyML / Autoencoder Anomaly Detection |
| **Mitigation** | Kernel `nftables` Drop Rules | Adaptive VLAN Quarantining & SDN Integration |
| **Hardware** | Linux Appliance / Intel Pentium Demo Host | Dedicated Raspberry Pi 4B + Hardware TPM 2.0 |
| **Fleet Ops** | Local Offline Web Operations Center | Multi-Site Encrypted Edge Fleet Manager |
| **Storage** | High-Performance Local SQLite (WAL Mode) | Distributed Micro-TimeSeries Telemetry DB |

---

<div align="center">

**FALCON-X — Vision X Team Project Expo 2026**  
*Autonomous Edge Cybersecurity for MSME IoT Networks*

</div>
