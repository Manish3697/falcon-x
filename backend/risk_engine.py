"""
FALCON-X Risk Engine
Deterministic / Heuristic Risk Scoring (0–10 Scale)
Note: Deterministic rule-weighted algorithm. AI/ML is Future Scope only.
"""

class RiskEngine:
    @staticmethod
    def classify_score(score: float) -> str:
        """Categorize 0-10 score into severity band"""
        if score >= 9.0:
            return "CRITICAL"
        elif score >= 6.0:
            return "HIGH"
        elif score >= 3.0:
            return "MEDIUM"
        else:
            return "LOW"

    @staticmethod
    def calculate_device_risk(threats: list, device_type: str = "UNKNOWN", current_rules: dict = None) -> dict:
        """
        Calculate deterministic risk score (0-10) for a device based on active threats and weights.
        """
        if not threats:
            base_risk = 0.5 if device_type == "UNKNOWN" else 0.0
            return {
                "score": round(base_risk, 1),
                "severity": RiskEngine.classify_score(base_risk),
                "contributing_factors": []
            }
        
        # Threat type base weights
        default_weights = {
            "SYN Flood/Burst": 9.0,
            "Port Scan": 8.0,
            "ARP Spoofing/Conflict": 7.5,
            "Suspicious Traffic": 6.0,
            "Unknown/Rogue Device": 5.0
        }
        
        active_weights = current_rules if current_rules else default_weights
        
        max_threat_weight = 0.0
        contributing_factors = []
        cumulative_modifier = 0.0
        
        for threat in threats:
            ttype = threat.get("threat_type")
            t_status = threat.get("status", "ACTIVE")
            
            if t_status == "RESOLVED":
                continue
                
            weight = active_weights.get(ttype, 5.0)
            contributing_factors.append({
                "threat_type": ttype,
                "weight": weight,
                "evidence": threat.get("evidence", ""),
                "status": t_status
            })
            
            if weight > max_threat_weight:
                max_threat_weight = weight
            else:
                cumulative_modifier += 0.5  # Multiple concurrent threats raise risk
                
        calculated_score = min(10.0, max_threat_weight + cumulative_modifier)
        
        # If device is an unknown rogue device, minimum floor is 5.0
        if device_type == "UNKNOWN" and calculated_score < 5.0 and len(threats) > 0:
            calculated_score = 5.0
            
        final_score = round(calculated_score, 1)
        
        return {
            "score": final_score,
            "severity": RiskEngine.classify_score(final_score),
            "contributing_factors": contributing_factors,
            "formula_info": "Deterministic rule-weighted evaluation (Max Threat Base + Multi-incident modifier)"
        }
