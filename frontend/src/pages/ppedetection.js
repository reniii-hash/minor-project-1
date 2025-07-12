"use client"

import { useState, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { detectPPEInImage } from "../utils/api"
import "./ppedetection.css"

const PPEDetection = () => {
  const { user } = useAuth()
  const [isDetecting, setIsDetecting] = useState(false)
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [detections, setDetections] = useState([])
  const [uploadedImage, setUploadedImage] = useState(null)
  const [processedImage, setProcessedImage] = useState(null)
  const [activeMode, setActiveMode] = useState("webcam")
  const [systemStatus, setSystemStatus] = useState("Ready")
  const [detectionResults, setDetectionResults] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  const toggleDetection = async () => {
    if (!isWebcamActive) {
      await startWebcam()
    } else if (!isStreaming) {
      startStreaming()
    } else {
      stopStreaming()
    }
  }

  const startWebcam = async () => {
    try {
      console.log("📹 Starting webcam...")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsWebcamActive(true)
        setActiveMode("webcam")
        setUploadedImage(null)
        setProcessedImage(null)
        setSystemStatus("Camera active")
        console.log("✅ Webcam started successfully")
      }
    } catch (error) {
      console.error("❌ Failed to start webcam:", error)
      alert("Failed to access webcam. Please check permissions and try again.")
    }
  }

  const startStreaming = () => {
    if (!isWebcamActive) return
    console.log("🎥 Starting real-time streaming...")
    setIsStreaming(true)
    setSystemStatus("Streaming - Monitoring PPE")
    startRealTimeDetection()
  }

  const stopStreaming = () => {
    console.log("⏹️ Stopping streaming...")
    setIsStreaming(false)
    setSystemStatus("Camera active")
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const startRealTimeDetection = () => {
    const detectFrame = async () => {
      if (!isStreaming || !isWebcamActive || !videoRef.current || !canvasRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (video.readyState === 4) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        // Convert canvas to blob and send to backend
        canvas.toBlob(
          async (blob) => {
            if (blob) {
              try {
                const file = new File([blob], "webcam_frame.jpg", { type: "image/jpeg" })
                console.log("🔍 Sending frame for detection...")

                const result = await detectPPEInImage(file)

                if (result && result.success) {
                  console.log("✅ Detection result:", result)
                  processDetectionResult(result)

                  // Display processed image if available
                  if (result.annotated_image_base64) {
                    const img = new Image()
                    img.onload = () => {
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    }
                    img.src = `data:image/jpeg;base64,${result.annotated_image_base64}`
                  }
                }
              } catch (error) {
                console.error("❌ Real-time detection failed:", error)
                setSystemStatus("Detection error - Check backend connection")
              }
            }
          },
          "image/jpeg",
          0.8,
        )
      }

      const delay = 3000 // 3 seconds between detections
      setTimeout(() => {
        if (isStreaming) {
          animationRef.current = requestAnimationFrame(detectFrame)
        }
      }, delay)
    }

    detectFrame()
  }

  const processDetectionResult = (result) => {
    const violations = result.violations || []
    setDetections(violations)
    setDetectionResults(result)

    // Check compliance and update status
    const hasHelmet = !violations.some((v) => v.label === "NoHelmet")
    const hasVest = !violations.some((v) => v.label === "NoVest")

    if (!hasHelmet && !hasVest) {
      setSystemStatus("🚨 CRITICAL: Helmet & Vest Required!")
    } else if (!hasHelmet) {
      setSystemStatus("⚠️ CRITICAL: Helmet Required!")
    } else if (!hasVest) {
      setSystemStatus("⚠️ WARNING: Safety Vest Missing")
    } else {
      setSystemStatus("✅ PPE Compliance OK")
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    console.log("📤 Uploading image for detection:", file.name)
    setIsDetecting(true)
    setSystemStatus("Analyzing image...")
    setActiveMode("upload")
    setDetections([])
    setUploadProgress(0)

    try {
      // Display uploaded image
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target.result)
      }
      reader.readAsDataURL(file)

      // Send to backend for detection with progress tracking
      const result = await detectPPEInImage(file, (progress) => {
        setUploadProgress(progress)
      })

      if (result && result.success) {
        console.log("✅ Image detection successful:", result)
        processDetectionResult(result)

        // Display processed image
        if (result.annotated_image_base64) {
          setProcessedImage(`data:image/jpeg;base64,${result.annotated_image_base64}`)
        }

        setSystemStatus("✅ Analysis Complete")
      } else {
        throw new Error("Detection failed")
      }
    } catch (error) {
      console.error("❌ Image detection failed:", error)
      setSystemStatus("❌ Detection Error")
      alert(`Detection failed: ${error.message}`)
    } finally {
      setIsDetecting(false)
      setUploadProgress(0)
    }
  }

  const exitDetection = () => {
    console.log("🚪 Exiting detection...")
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
    setProcessedImage(null)
    setDetections([])
    setDetectionResults(null)
    setSystemStatus("Ready")
  }

  const getMissingEquipment = () => {
    if (!detections.length) return []

    const violationLabels = detections.map((d) => d.label)
    const missing = []

    if (violationLabels.includes("NoHelmet")) {
      missing.push("Safety Helmet")
    }
    if (violationLabels.includes("NoVest")) {
      missing.push("Safety Vest")
    }

    return missing
  }

  const hasViolations = () => {
    return detections.some((d) => d.label === "NoHelmet" || d.label === "NoVest")
  }

  if (!user) {
    return (
      <div className="ppe-container">
        <div className="ppe-header">
          <div className="header-content">
            <div className="header-left">
              <h1>Authentication Required</h1>
              <p>Please log in to use PPE detection</p>
            </div>
          </div>
        </div>
      </div>
    )
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
                <p>AI-powered safety equipment monitoring</p>
              </div>
            </div>
          </div>
          <div className="welcome-message">
            <svg className="user-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <div>
              <p>Welcome back,</p>
              <p className="username">{user.username}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Sidebar */}
        <div className="sidebar">
          {/* Controls */}
          <div className="control-panel">
            <h3>Detection Controls</h3>
            <button
              className={`control-btn detect-btn ${isStreaming ? "stop" : ""}`}
              onClick={toggleDetection}
              disabled={isDetecting}
            >
              {!isWebcamActive ? "Start Camera" : isStreaming ? "Stop Streaming" : "Start Streaming"}
            </button>
            <button className="control-btn exit-btn" onClick={exitDetection}>
              Stop Camera
            </button>
          </div>

          <div className="upload-panel">
            <h3>Image Upload</h3>
            <button
              className="control-btn upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDetecting}
            >
              {isDetecting ? `Processing... ${Math.round(uploadProgress)}%` : "Upload Image"}
            </button>
            {isDetecting && uploadProgress > 0 && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
          </div>

          <div className="dashboard-panel">
            <h3>Dashboard</h3>
            <button className="control-btn dashboard-btn" onClick={() => (window.location.href = "/dashboard")}>
              View Dashboard
            </button>
          </div>

          {/* Detection Results */}
          {detections.length > 0 && (
            <div className="results-panel">
              <h3>Detection Results</h3>
              <div className="detection-list">
                {detections.map((detection, index) => (
                  <div
                    key={index}
                    className={`detection-item ${detection.label.includes("No") ? "missing" : "detected"}`}
                  >
                    <div className="detection-info">
                      <div
                        className="detection-color"
                        style={{ backgroundColor: detection.label.includes("No") ? "#ef4444" : "#10b981" }}
                      ></div>
                      <span className="detection-name">
                        {detection.label.includes("No") ? "❌" : "✅"} {detection.label.replace("No", "Missing ")}
                      </span>
                    </div>
                    <span className="confidence-badge">
                      {Math.round(Number.parseFloat(detection.confidence) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Equipment Alert */}
          {getMissingEquipment().length > 0 && (
            <div className="missing-equipment active">
              <div className="missing-title">⚠️ Missing Equipment</div>
              <div className="missing-list">
                {getMissingEquipment().map((item, index) => (
                  <div key={index} className="missing-item">
                    {item}
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
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  style={{ display: isWebcamActive && !isStreaming ? "block" : "none" }}
                />
                <canvas ref={canvasRef} style={{ display: isStreaming ? "block" : "none" }} />
                {!isWebcamActive && (
                  <div className="webcam-placeholder">
                    <svg className="camera-placeholder-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
                    </svg>
                    <h3>WEBCAM PPE DETECTION</h3>
                    <p>Click "Start Camera" to begin real-time PPE monitoring</p>
                    <p className="safety-note">🔗 Connected to AI Backend</p>
                  </div>
                )}
              </div>
            )}

            {/* Image Upload View */}
            {activeMode === "upload" && (
              <div className="image-container">
                {isDetecting ? (
                  <div className="webcam-placeholder">
                    <div className="loading-spinner"></div>
                    <h3>Processing Image...</h3>
                    <p>AI is analyzing PPE compliance</p>
                    {uploadProgress > 0 && <p>{Math.round(uploadProgress)}% complete</p>}
                  </div>
                ) : processedImage ? (
                  <img src={processedImage || "/placeholder.svg"} alt="Processed" />
                ) : uploadedImage ? (
                  <img src={uploadedImage || "/placeholder.svg"} alt="Uploaded" />
                ) : (
                  <div className="webcam-placeholder">
                    <svg className="camera-placeholder-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                    <h3>IMAGE UPLOAD</h3>
                    <p>Upload an image for PPE analysis</p>
                    <p className="safety-note">🔗 Connected to AI Backend</p>
                  </div>
                )}
              </div>
            )}

            {/* System Label */}
            <div className="system-label">PPE AI SYSTEM {isStreaming ? "MONITORING" : "READY"}</div>
          </div>

          {/* Detection Status */}
          {detectionResults && (
            <div className="detection-status">
              <div className="status-message">{detectionResults.message}</div>
              {detectionResults.timestamp && (
                <div className="status-timestamp">
                  Last detection: {new Date(detectionResults.timestamp).toLocaleTimeString()}
                </div>
              )}
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
        <div className="status-item">
          <span className="status-label">Backend:</span>
          <span className="status-value">🔗 Connected</span>
        </div>
        <div className="status-item">
          <span className="status-label">User:</span>
          <span className="status-value">{user.username}</span>
        </div>
      </div>

      {/* Critical Alert */}
      {hasViolations() && (
        <div className="alert critical">
          <svg className="alert-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
          </svg>
          <span>🚨 SAFETY VIOLATION: Missing required PPE equipment detected!</span>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
    </div>
  )
}

export default PPEDetection
