"""
FALCON-X Machine Learning Anomaly Detection Engine
Integrates trained Random Forest Model and Feature Pipeline for Edge Anomaly Detection.
Model: backend/ml/falcon_x_model.pkl
Features: backend/ml/falcon_x_features.pkl
"""

import os
import time
import joblib
import numpy as np
import pandas as pd
import warnings

# Suppress version unpickling warnings for clean operational logs
warnings.filterwarnings("ignore", category=UserWarning)

class MLEngine:
    def __init__(self):
        self.model = None
        self.features = []
        self.is_loaded = False
        self.load_error = None
        self.total_inferences = 0
        self.last_inference_time_ms = 0.0
        self.top_features_summary = []
        self.load_model()

    def load_model(self):
        """
        Load falcon_x_model.pkl and falcon_x_features.pkl using joblib.
        """
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__)))
        model_path = os.path.join(base_dir, "ml", "falcon_x_model.pkl")
        features_path = os.path.join(base_dir, "ml", "falcon_x_features.pkl")

        try:
            if os.path.exists(model_path) and os.path.exists(features_path):
                self.model = joblib.load(model_path)
                self.features = joblib.load(features_path)
                self.is_loaded = True
                self.load_error = None
                
                # Extract top 10 feature importances
                if hasattr(self.model, "feature_importances_") and len(self.features) == len(self.model.feature_importances_):
                    importances = self.model.feature_importances_
                    top_indices = np.argsort(importances)[::-1][:10]
                    self.top_features_summary = [
                        {"feature": self.features[i], "importance": round(float(importances[i]), 4)}
                        for i in top_indices
                    ]
            else:
                self.load_error = f"Model files missing at {model_path} or {features_path}"
                self.is_loaded = False
        except Exception as e:
            self.load_error = str(e)
            self.is_loaded = False

    def extract_features(self, packet_meta: dict) -> pd.DataFrame:
        """
        Convert packet/flow metadata dictionary into a 77-column DataFrame matching the trained feature pipeline.
        """
        protocol_str = str(packet_meta.get("protocol", "TCP")).upper()
        proto_num = 6 if protocol_str == "TCP" else (17 if protocol_str == "UDP" else 1)
        
        pkt_size = float(packet_meta.get("packet_size", 64))
        tcp_flags = str(packet_meta.get("tcp_flags", ""))
        dst_port = float(packet_meta.get("dst_port", 80) or 80)
        src_port = float(packet_meta.get("src_port", 49152) or 49152)
        
        # Flag indicators
        syn_count = 1.0 if "S" in tcp_flags else 0.0
        fin_count = 1.0 if "F" in tcp_flags else 0.0
        rst_count = 1.0 if "R" in tcp_flags else 0.0
        psh_count = 1.0 if "P" in tcp_flags else 0.0
        ack_count = 1.0 if "A" in tcp_flags else 0.0
        urg_count = 1.0 if "U" in tcp_flags else 0.0
        
        # Initialize zero dictionary for all 77 features
        data = {feat: 0.0 for feat in self.features}
        
        # Populate mapped features
        data["Protocol"] = float(proto_num)
        data["Flow Duration"] = float(packet_meta.get("flow_duration", 1000.0))
        data["Total Fwd Packets"] = float(packet_meta.get("total_fwd_packets", 2.0))
        data["Total Backward Packets"] = float(packet_meta.get("total_bwd_packets", 1.0))
        data["Fwd Packets Length Total"] = pkt_size * data["Total Fwd Packets"]
        data["Bwd Packets Length Total"] = pkt_size * 0.5
        data["Fwd Packet Length Max"] = pkt_size
        data["Fwd Packet Length Min"] = max(20.0, pkt_size * 0.5)
        data["Fwd Packet Length Mean"] = pkt_size * 0.8
        data["Packet Length Min"] = max(20.0, pkt_size * 0.5)
        data["Packet Length Max"] = pkt_size
        data["Packet Length Mean"] = pkt_size * 0.8
        data["Avg Packet Size"] = pkt_size
        
        # TCP Flags
        data["SYN Flag Count"] = syn_count
        data["FIN Flag Count"] = fin_count
        data["RST Flag Count"] = rst_count
        data["PSH Flag Count"] = psh_count
        data["ACK Flag Count"] = ack_count
        data["URG Flag Count"] = urg_count
        data["Fwd PSH Flags"] = psh_count
        data["Fwd URG Flags"] = urg_count
        
        # Rates & Window features
        data["Flow Packets/s"] = float(packet_meta.get("packets_per_sec", 15.0))
        data["Flow Bytes/s"] = float(packet_meta.get("bytes_per_sec", pkt_size * 15.0))
        data["Fwd Packets/s"] = data["Flow Packets/s"] * 0.7
        data["Bwd Packets/s"] = data["Flow Packets/s"] * 0.3
        data["Init Fwd Win Bytes"] = float(packet_meta.get("init_fwd_win_bytes", 65535.0 if "S" in tcp_flags else 1024.0))
        data["Init Bwd Win Bytes"] = float(packet_meta.get("init_bwd_win_bytes", -1.0 if "S" in tcp_flags else 26847.0))
        data["Fwd Header Length"] = float(packet_meta.get("fwd_header_len", 20.0 if proto_num == 6 else 8.0))
        data["Bwd Header Length"] = float(packet_meta.get("bwd_header_len", 20.0 if proto_num == 6 else 8.0))
        data["Fwd Seg Size Min"] = 20.0
        data["Fwd Act Data Packets"] = float(packet_meta.get("fwd_act_data_packets", 1.0))
        data["Subflow Fwd Packets"] = data["Total Fwd Packets"]
        data["Subflow Fwd Bytes"] = data["Fwd Packets Length Total"]
        data["Subflow Bwd Packets"] = data["Total Backward Packets"]
        data["Subflow Bwd Bytes"] = data["Bwd Packets Length Total"]
        
        # Override any explicit feature if passed in packet_meta
        for k, v in packet_meta.items():
            if k in data:
                data[k] = float(v)

        # Convert to single-row DataFrame ordered by exact feature column list
        df = pd.DataFrame([data], columns=self.features)
        return df

    def predict_packet(self, packet_meta: dict) -> dict:
        """
        Run inference on packet/flow metadata.
        Returns prediction (0/1), anomaly probability (0.0 - 1.0), and latency.
        """
        if not self.is_loaded or self.model is None:
            return {
                "available": False,
                "is_anomaly": False,
                "anomaly_probability": 0.0,
                "error": self.load_error or "Model not loaded"
            }

        start_time = time.perf_counter()
        try:
            X = self.extract_features(packet_meta)
            pred = int(self.model.predict(X)[0])
            
            if hasattr(self.model, "predict_proba"):
                probas = self.model.predict_proba(X)[0]
                # Class 1 is anomaly / attack
                anomaly_prob = float(probas[1]) if len(probas) > 1 else float(pred)
            else:
                anomaly_prob = float(pred)
                
            elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
            self.last_inference_time_ms = elapsed_ms
            self.total_inferences += 1
            
            # Anomaly classification from trained Random Forest
            is_anomaly = bool(pred == 1 or anomaly_prob >= 0.5)
            
            return {
                "available": True,
                "is_anomaly": is_anomaly,
                "prediction": pred,
                "anomaly_probability": round(anomaly_prob, 4),
                "confidence_score": round(max(anomaly_prob, 1.0 - anomaly_prob) * 100, 1),
                "inference_time_ms": elapsed_ms,
                "top_features": self.top_features_summary[:5]
            }
        except Exception as e:
            return {
                "available": False,
                "is_anomaly": False,
                "anomaly_probability": 0.0,
                "error": str(e)
            }

    def get_status(self) -> dict:
        """
        Return comprehensive model metadata and performance metrics for dashboard display.
        """
        return {
            "loaded": self.is_loaded,
            "model_name": "RandomForestClassifier",
            "feature_count": len(self.features),
            "classes": [0, 1],
            "class_names": ["BENIGN / NORMAL", "MALICIOUS / ANOMALY"],
            "parameters": {
                "algorithm": "Random Forest Ensemble",
                "max_depth": 20,
                "n_estimators": 100,
                "class_weight": "balanced",
                "random_state": 42
            },
            "top_features": self.top_features_summary,
            "total_inferences": self.total_inferences,
            "last_latency_ms": self.last_inference_time_ms,
            "model_path": "backend/ml/falcon_x_model.pkl",
            "features_path": "backend/ml/falcon_x_features.pkl",
            "error": self.load_error
        }

# Singleton instance
ml_engine = MLEngine()
