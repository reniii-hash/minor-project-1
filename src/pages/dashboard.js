"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getUserDashboard } from "../utils/api"
import { useAuth } from "../context/AuthContext"
import "./dashboard.css"

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [violations, setViolations] = useState([])
  const [stats, setStats] = useState({
    total_violations: 0,
    helmet_violations: 0,
    vest_violations: 0,
    today_violations: 0,
  })
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("📊 Loading dashboard data...")

      const data = await getUserDashboard()

      if (data && data.success) {
        console.log("✅ Dashboard data loaded:", data)
        setViolations(data.violations || [])
        setStats(
          data.stats || {
            total_violations: 0,
            helmet_violations: 0,
            vest_violations: 0,
            today_violations: 0,
          },
        )
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredViolations = violations.filter((violation) => {
    if (filter === "all") return true
    return violation.label === filter
  })

  const clearViolations = async () => {
    if (window.confirm("Are you sure you want to clear all violation records?")) {
      try {
        // TODO: Implement clear violations API endpoint
        console.log("Clear violations - to be implemented")
        await loadDashboardData() // Refresh data
      } catch (error) {
        console.error("Error clearing violations:", error)
        alert("Failed to clear violations")
      }
    }
  }

  const exportViolations = async () => {
    try {
      const csvContent = [
        ["Date", "Label", "Confidence", "Person ID", "Image ID"],
        ...filteredViolations.map((v) => [
          new Date(v.timestamp).toLocaleString(),
          v.label,
          v.confidence,
          v.person_id,
          v.image_id,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ppe_violations_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting violations:", error)
      alert("Failed to export data")
    }
  }

  if (!user) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1>Authentication Required</h1>
              <p>Please log in to view your dashboard</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1>Dashboard Error</h1>
              <p>Failed to load dashboard data</p>
            </div>
          </div>
        </div>
        <div className="error-container">
          <div className="error-message">
            <h3>Error: {error}</h3>
            <button onClick={loadDashboardData} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>PPE Violations Dashboard</h1>
            <p>Welcome back, {user.username}! Monitor your safety compliance.</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => navigate("/ppe-detection")}>
              Back to Detection
            </button>
            <button className="btn btn-primary" onClick={exportViolations}>
              Export Data
            </button>
            <button className="btn btn-secondary" onClick={loadDashboardData}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Violations</h3>
            <p className="stat-number">{stats.total_violations}</p>
          </div>
        </div>
        <div className="stat-card helmet">
          <div className="stat-icon">⛑️</div>
          <div className="stat-content">
            <h3>Helmet Violations</h3>
            <p className="stat-number">{stats.helmet_violations}</p>
          </div>
        </div>
        <div className="stat-card vest">
          <div className="stat-icon">🦺</div>
          <div className="stat-content">
            <h3>Vest Violations</h3>
            <p className="stat-number">{stats.vest_violations}</p>
          </div>
        </div>
        <div className="stat-card today">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Today's Violations</h3>
            <p className="stat-number">{stats.today_violations}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-container">
        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
            <option value="all">All Records ({violations.length})</option>
            <option value="NoHelmet">
              Helmet Violations ({violations.filter((v) => v.label === "NoHelmet").length})
            </option>
            <option value="NoVest">Vest Violations ({violations.filter((v) => v.label === "NoVest").length})</option>
            <option value="GoodToGo">
              Compliant Records ({violations.filter((v) => v.label === "GoodToGo").length})
            </option>
          </select>
        </div>
        <div className="actions">
          <button className="btn btn-danger" onClick={clearViolations}>
            Clear All Records
          </button>
        </div>
      </div>

      {/* Violations Table */}
      <div className="violations-container">
        <div className="violations-header">
          <h2>Violations History</h2>
          <p>
            ✅ Connected to backend • Showing {filteredViolations.length} of {violations.length} records
          </p>
        </div>

        <div className="table-container">
          <table className="violations-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Violation Type</th>
                <th>Confidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="loading-cell">
                    <div className="loading-spinner"></div>
                    Loading violations from backend...
                  </td>
                </tr>
              ) : filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data">
                    <div className="empty-state">
                      <div className="empty-icon">📊</div>
                      <h3>No Records Found</h3>
                      <p>
                        {violations.length === 0
                          ? "Start using PPE detection to see violations here."
                          : "No records match the current filter."}
                      </p>
                      <p className="backend-note">✅ Connected to backend</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredViolations.map((violation, index) => (
                  <tr
                    key={violation.id || index}
                    className={`violation-row ${violation.label.toLowerCase().replace("no", "")}`}
                  >
                    <td className="date-cell">{new Date(violation.timestamp).toLocaleString()}</td>
                    <td>
                      <span className={`label-badge ${violation.label.toLowerCase().replace("no", "")}`}>
                        {violation.label === "GoodToGo"
                          ? "✅ All Good"
                          : violation.label === "NoHelmet"
                            ? "⛑️ No Helmet"
                            : violation.label === "NoVest"
                              ? "🦺 No Vest"
                              : violation.label}
                      </span>
                    </td>
                    <td className="confidence-cell">{Math.round(violation.confidence * 100)}%</td>
                    <td>
                      <span className={`status-badge ${violation.label === "GoodToGo" ? "good" : "critical"}`}>
                        {violation.label === "GoodToGo" ? "Compliant" : "Violation"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
