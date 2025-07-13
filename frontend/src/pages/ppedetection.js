"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from '../context/AuthContext';
import "./ppedetection.css"

// Enhanced PPE Detector with better helmet detection
class PPEDetector {
  constructor() {
    this.model = null
    this.isLoaded = false
  }

  async loadModel() {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    this.model = { loaded: true }
    this.isLoaded = true
  }

  async detect(imageElement) {
    if (!this.model) {
      throw new Error("Model not loaded")
    }

    await new Promise((resolve) => setTimeout(resolve, 200))

    const detections = []

    // Simulate detection with higher probability for violations
    const hasHelmet = Math.random() > 0.4 // 60% chance of detecting helmet
    const hasSafetyVest = Math.random() > 0.5 // 50% chance of detecting vest
    const hasGloves = Math.random() > 0.7 // 30% chance of detecting gloves
    const hasBoots = Math.random() > 0.8 // 20% chance of detecting boots
    const hasMask = Math.random() > 0.9 // 10% chance of detecting mask

    // Add helmet or no-helmet detection
    if (hasHelmet) {
      detections.push({
        class: "helmet",
        confidence: 0.75 + Math.random() * 0.25,
        bbox: [
          0.2 + Math.random() * 0.3,
          0.1 + Math.random() * 0.2,
          0.15 + Math.random() * 0.1,
          0.15 + Math.random() * 0.1,
        ],
        color: "#10b981",
      })
    } else {
      detections.push({
        class: "no_helmet",
        confidence: 0.7 + Math.random() * 0.3,
        bbox: [
          0.2 + Math.random() * 0.3,
          0.1 + Math.random() * 0.2,
          0.15 + Math.random() * 0.1,
          0.15 + Math.random() * 0.1,
        ],
        color: "#ef4444",
      })
    }

    // Add vest or no-vest detection
    if (hasSafetyVest) {
      detections.push({
        class: "safety_vest",
        confidence: 0.7 + Math.random() * 0.3,
        bbox: [
          0.25 + Math.random() * 0.3,
          0.3 + Math.random() * 0.2,
          0.2 + Math.random() * 0.15,
          0.25 + Math.random() * 0.15,
        ],
        color: "#f59e0b",
      })
    } else {
      detections.push({
        class: "no_vest",
        confidence: 0.65 + Math.random() * 0.35,
        bbox: [
          0.25 + Math.random() * 0.3,
          0.3 + Math.random() * 0.2,
          0.2 + Math.random() * 0.15,
          0.25 + Math.random() * 0.15,
        ],
        color: "#ef4444",
      })
    }

    // Add other equipment detections occasionally
    if (hasGloves) {
      detections.push({
        class: "gloves",
        confidence: 0.65 + Math.random() * 0.35,
        bbox: [
          0.1 + Math.random() * 0.2,
          0.5 + Math.random() * 0.2,
          0.08 + Math.random() * 0.05,
          0.08 + Math.random() * 0.05,
        ],
        color: "#10b981",
      })
    }

    if (hasBoots) {
      detections.push({
        class: "safety_boots",
        confidence: 0.7 + Math.random() * 0.3,
        bbox: [
          0.3 + Math.random() * 0.2,
          0.8 + Math.random() * 0.1,
          0.12 + Math.random() * 0.08,
          0.1 + Math.random() * 0.05,
        ],
        color: "#8b5cf6",
      })
    }

    if (hasMask) {
      detections.push({
        class: "face_mask",
        confidence: 0.8 + Math.random() * 0.2,
        bbox: [
          0.35 + Math.random() * 0.2,
          0.15 + Math.random() * 0.15,
          0.1 + Math.random() * 0.05,
          0.08 + Math.random() * 0.04,
        ],
        color: "#ef4444",
      })
    }

    return detections
  }
}

const PPEDetection = () => {
  const { user } = useAuth()
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [detections, setDetections] = useState([])
  const [confidenceThreshold, setConfidenceThreshold] = useState(50)
  const [streamingSpeed, setStreamingSpeed] = useState("normal")
  const [uploadedImage, setUploadedImage] = useState(null)
  const [activeMode, setActiveMode] = useState("webcam")
  const [systemStatus, setSystemStatus] = useState("Loading...")
  const [lastComplianceCheck, setLastComplianceCheck] = useState(null)

  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const detectorRef = useRef(new PPEDetector())
  const animationRef = useRef(null)

  useEffect(() => {
    const loadModel = async () => {
      try {
        await detectorRef.current.loadModel()
        setIsModelLoaded(true)
        setSystemStatus("Ready")
      } catch (error) {
        console.error("Model loading failed:", error)
        setSystemStatus("Model load failed")
      }
    }
    loadModel()
  }, [])

  
  const toggleDetection = async () => {
    if (!isWebcamActive) {
      await startWebcam()
    } else if (!isStreaming) {
      startStreaming()
    } else {
      stopStreaming()
    }
  }


  const startRealTimeDetection = () => {
  const detectFrame = async () => {
    if (!isStreaming || !isWebcamActive || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.readyState === 4) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL();
      const img = new Image();
      img.onload = async () => {
        try {
          // Send frame to FastAPI for detection
          const detections = await detectFrameFromAPI(img);
          const filteredDetections = detections.filter((d) => d.confidence * 100 >= confidenceThreshold);
          setDetections(filteredDetections);
          drawDetections(ctx, filteredDetections, canvas.width, canvas.height);

          // Check compliance and trigger alerts
          checkComplianceAndAlert(filteredDetections);
        } catch (error) {
          console.error("Detection failed:", error);
        }
      };
      img.src = imageData;
    }

    const delay = streamingSpeed === "fast" ? 500 : 1000; // Slower for better detection
    setTimeout(() => {
      animationRef.current = requestAnimationFrame(detectFrame);
    }, delay);
  };

  detectFrame();
};

const detectFrameFromAPI = async (imageElement) => {
  const blob = await fetch(imageElement.src).then((res) => res.blob());
  const formData = new FormData();
  formData.append("file", blob);

  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const response = await fetch("http://127.0.0.1:8000/detect/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  return data.violations || [];
};

const startWebcam = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      setIsWebcamActive(true);
      setActiveMode("webcam");
      setUploadedImage(null);
      setSystemStatus("Camera active");
    }
  } catch (error) {
    console.error("Failed to start webcam:", error);
    alert("Failed to access webcam. Please check permissions.");
  }
};

// Define startStreaming to begin the real-time webcam streaming
const startStreaming = () => {
  if (!isWebcamActive) {
    alert("Webcam is not active.");
    return;
  }

  // Start real-time detection
  setIsStreaming(true);
  startRealTimeDetection();
};

// Define stopStreaming to stop the real-time webcam streaming
const stopStreaming = () => {
  setIsStreaming(false);
  if (animationRef.current) {
    cancelAnimationFrame(animationRef.current);
  }
};


const drawDetections = (ctx, detections, width, height) => {
  ctx.drawImage(videoRef.current, 0, 0, width, height); // Draw the webcam video

  detections.forEach((detection) => {
    const [x, y, w, h] = detection.bbox;
    const boxX = x * width;
    const boxY = y * height;
    const boxW = w * width;
    const boxH = h * height;

    // Different colors for different equipment
    ctx.strokeStyle = detection.color;
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Background for text
    ctx.fillStyle = detection.color;
    ctx.fillRect(boxX, boxY - 35, boxW, 35);

    // Text
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.fillText(
      `${detection.class.replace("_", " ").toUpperCase()} ${(detection.confidence * 100).toFixed(0)}%`,
      boxX + 5,
      boxY - 10
    );
  });

  // Add detection status overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(10, 10, 300, 80);

  ctx.fillStyle = "white";
  ctx.font = "bold 14px Arial";
  ctx.fillText("PPE Detection Status:", 20, 30);

  const hasHelmet = detections.some((d) => d.class === "helmet");
  const hasVest = detections.some((d) => d.class === "safety_vest");

  ctx.fillStyle = hasHelmet ? "#10b981" : "#ef4444";
  ctx.fillText(`Helmet: ${hasHelmet ? "✓ DETECTED" : "✗ MISSING"}`, 20, 50);

  ctx.fillStyle = hasVest ? "#10b981" : "#ef4444";
  ctx.fillText(`Safety Vest: ${hasVest ? "✓ DETECTED" : "✗ MISSING"}`, 20, 70);
};


  const checkComplianceAndAlert = (detections) => {
  const requiredPPE = ["helmet", "safety_vest"];
  const criticalPPE = ["helmet"];

  const detectedPPE = detections.map((d) => d.class);
  const missingCritical = criticalPPE.filter((ppe) => !detectedPPE.includes(ppe));
  const missingRequired = requiredPPE.filter((ppe) => !detectedPPE.includes(ppe));

  const currentCompliance = {
    hasHelmet: detectedPPE.includes("helmet"),
    hasSafetyVest: detectedPPE.includes("safety_vest"),
    missingCritical: missingCritical.length > 0,
    missingRequired: missingRequired.length > 0,
  };

  // Only alert if compliance status changed
  if (
    !lastComplianceCheck ||
    lastComplianceCheck.hasHelmet !== currentCompliance.hasHelmet ||
    lastComplianceCheck.hasSafetyVest !== currentCompliance.hasSafetyVest
  ) {
    if (missingCritical.length > 0) {
      setSystemStatus("⚠️ CRITICAL: Helmet Required!");
      logViolation("No Helmet Detected");
    } else if (missingRequired.length > 0) {
      setSystemStatus("⚠️ WARNING: Safety Equipment Missing");
      logViolation("Safety Vest Missing");
    } else {
      setSystemStatus("✅ PPE Compliance OK");
    }
  }

  setLastComplianceCheck(currentCompliance);
};


  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target.result)
      setActiveMode("upload")
      setDetections([])
      detectInImage(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const detectInImage = async (imageSrc) => {
  if (!isModelLoaded) return;

  setIsDetecting(true);
  setSystemStatus("Analyzing image...");

  try {
    const blob = await fetch(imageSrc).then((res) => res.blob());
    const formData = new FormData();
    formData.append("file", blob);

    const token = JSON.parse(localStorage.getItem("user"))?.token;

    const response = await fetch("http://127.0.0.1:8000/detect/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    const violations = data.violations || [];

    const converted = violations.map((v) => ({
      class: v.label.toLowerCase().replace(/ /g, "_"), // Convert "NoHelmet" → "no_helmet"
      confidence: parseFloat(v.confidence),
      bbox: [0.1, 0.1, 0.4, 0.3], // Mocked for now since FastAPI doesn't return bbox yet
      color: v.label.toLowerCase().includes("no") ? "#ef4444" : "#10b981",
    }));

    setDetections(converted);
    setSystemStatus("✅ Detection Complete");
  } catch (error) {
    console.error("Detection failed:", error);
    setSystemStatus("❌ Detection Failed");
  } finally {
    setIsDetecting(false);
  }
};


  const exitDetection = () => {
    stopStreaming()
    if (isWebcamActive && videoRef.current) {
      const stream = videoRef.current.srcObject
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      videoRef.current.srcObject = null
      setIsWebcamActive(false)
    }
    setActiveMode("webcam")
    setUploadedImage(null)
    setDetections([])
    setSystemStatus("Ready")
    setLastComplianceCheck(null)
  }

  const checkCompliance = () => {
    const requiredPPE = ["helmet", "safety_vest"]
    const detectedPPE = detections.map((d) => d.class)
    const compliance = requiredPPE.filter((ppe) => detectedPPE.includes(ppe)).length
    return (compliance / requiredPPE.length) * 100 < 50
  }

  const getMissingEquipment = () => {
    const requiredPPE = ["helmet", "safety_vest", "gloves", "safety_boots", "face_mask"]
    const detectedPPE = detections.map((d) => d.class)
    return requiredPPE.filter((ppe) => !detectedPPE.includes(ppe))
  }

  const logViolation = (violation) => {
    console.warn("PPE Violation:", violation)
    // Implement logging to a server or local storage here
  }

  return (
    <div className="ppe-container">
      {/* Header */}
      <div className="ppe-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <svg className="camera-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
              </svg>
              <div>
                <h1>PPE Detection System</h1>
                <p>Real-time safety equipment monitoring</p>
              </div>
            </div>
          </div>
          {user && (
            <div className="welcome-message">
              <svg className="user-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <div>
                <p>Welcome back,</p>
                <p className="username">{user.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Sidebar */}
        <div className="sidebar">
          {/* Controls */}
          <div className="control-panel">
            <h3>Streaming Controls</h3>
            <button
              className={`control-btn detect-btn ${isStreaming ? "stop" : ""}`}
              onClick={toggleDetection}
              disabled={!isModelLoaded}
            >
              {!isWebcamActive ? "Start Camera" : isStreaming ? "End Streaming" : "Start Streaming"}
            </button>
            <button className="control-btn exit-btn" onClick={exitDetection}>
              Stop Camera
            </button>
          </div>

          <div className="upload-panel">
            <h3>Image Upload</h3>
            <button className="control-btn upload-btn" onClick={() => fileInputRef.current?.click()}>
              Upload Image
            </button>
          </div>

          <div className="dashboard-panel">
            <h3>Dashboard</h3>
            <button className="control-btn dashboard-btn" onClick={() => (window.location.href = "/dashboard")}>
              View Dashboard
            </button>
          </div>

          {/* Classes */}
          <div className="classes-panel">
            <h3>DETECTION CLASSES</h3>
            <div className="class-item">
              <input type="checkbox" id="helmet" defaultChecked />
              <label htmlFor="helmet">🪖 Helmet (Critical)</label>
            </div>
            <div className="class-item">
              <input type="checkbox" id="safety-vest" defaultChecked />
              <label htmlFor="safety-vest">🦺 Safety Vest</label>
            </div>
            <div className="class-item">
              <input type="checkbox" id="gloves" defaultChecked />
              <label htmlFor="gloves">🧤 Gloves</label>
            </div>
            <div className="class-item">
              <input type="checkbox" id="boots" defaultChecked />
              <label htmlFor="boots">🥾 Safety Boots</label>
            </div>
            <div className="class-item">
              <input type="checkbox" id="mask" defaultChecked />
              <label htmlFor="mask">😷 Face Mask</label>
            </div>
          </div>

          {/* Confidence Threshold */}
          <div className="threshold-panel">
            <h3>Detection Sensitivity</h3>
            <div className="slider-container">
              <input
                type="range"
                className="slider"
                min="0"
                max="100"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              />
              <div className="slider-value">{confidenceThreshold}% confidence</div>
            </div>
          </div>

          {/* Detection Results */}
          {(detections.length > 0 || isStreaming) && (
            <div className="results-panel">
              <h3>Live Detection Status</h3>
              <div className="detection-list">
                {detections.map((detection, index) => (
                  <div key={index} className="detection-item detected">
                    <div className="detection-info">
                      <div className="detection-color" style={{ backgroundColor: detection.color }}></div>
                      <span className="detection-name">✅ {detection.class.replace("_", " ")}</span>
                    </div>
                    <span className="confidence-badge">{(detection.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Display */}
        <div className="main-display">
          <div className="display-container">
            {/* Webcam View */}
            {activeMode === "webcam" && (
              <div className="webcam-container">
                <video ref={videoRef} autoPlay muted style={{ display: isWebcamActive ? "block" : "none" }} />
                <canvas ref={canvasRef} style={{ display: isStreaming ? "block" : "none" }} />
                {!isWebcamActive && (
                  <div className="webcam-placeholder">
                    <svg className="camera-placeholder-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
                    </svg>
                    <h3>WEBCAM</h3>
                    <p>Click "Start Camera" to begin PPE monitoring</p>
                    <p className="safety-note">🪖 Helmet detection with audio alerts</p>
                  </div>
                )}
              </div>
            )}

            {/* Image Upload View */}
            {activeMode === "upload" && uploadedImage && (
              <div className="image-container">
                <img ref={imageRef} src={uploadedImage || "/placeholder.svg"} alt="Uploaded" />
                <svg className="detection-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {detections.map((detection, index) => (
                    <g key={index}>
                      <rect
                        x={detection.bbox[0] * 100}
                        y={detection.bbox[1] * 100}
                        width={detection.bbox[2] * 100}
                        height={detection.bbox[3] * 100}
                        fill="none"
                        stroke={detection.color}
                        strokeWidth="0.8"
                      />
                      <text
                        x={detection.bbox[0] * 100}
                        y={detection.bbox[1] * 100 - 1}
                        fontSize="2.5"
                        fill={detection.color}
                        fontWeight="bold"
                      >
                        {detection.class.replace("_", " ").toUpperCase()} ${(detection.confidence * 100).toFixed(0)}%
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}

            {/* PPE System Label */}
            <div className="system-label">PPE SYSTEM {isStreaming ? "MONITORING" : "READY"}</div>
          </div>

          {/* Missing Equipment Display */}
          {isStreaming && (
            <div className="missing-equipment-display">
              <h3>Missing Equipment</h3>
              <ul className="missing-equipment-list">
                {getMissingEquipment().map((item, index) => (
                  <li key={index} className="missing-equipment-item">
                    {item.replace("_", " ")}
                  </li>
                ))}
                {getMissingEquipment().length === 0 && <li>All equipment detected</li>}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-label">Status:</span>
          <span className="status-value">{systemStatus}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Detections:</span>
          <span className="status-value">{detections.length}</span>
        </div>
      </div>

      {/* Alert */}
      {detections.length > 0 && checkCompliance() && (
        <div className="alert critical">
          <svg className="alert-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
          </svg>
          <span>🚨 CRITICAL SAFETY ALERT: Missing required PPE equipment detected!</span>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
    </div>
  )
}

export default PPEDetection