"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { getAdminSummary, deleteUser, updateUserRole } from "../utils/api"
import "./admindashboard.css"

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeViolations: 0,
    complianceRate: 100,
  })

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== "admin") {
      navigate("/", { replace: true })
      return
    }

    if (user) {
      loadAdminData()
    }
  }, [user, navigate])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("👑 Loading admin data...")

      const response = await getAdminSummary()

      if (response && response.success) {
        const userData = response.users || []
        console.log("✅ Admin data loaded:", userData)
        setUsers(userData)

        // Calculate stats
        const totalUsers = userData.length
        const totalViolations = userData.reduce((sum, user) => sum + (user.violation_count || 0), 0)
        const usersWithoutViolations = userData.filter((user) => (user.violation_count || 0) === 0).length
        const complianceRate = totalUsers > 0 ? Math.round((usersWithoutViolations / totalUsers) * 100) : 100

        setStats({
          totalUsers,
          activeViolations: totalViolations,
          complianceRate,
        })
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("❌ Error loading admin data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        console.log("🗑️ Deleting user:", userId)
        const response = await deleteUser(userId)

        if (response && response.success) {
          console.log("✅ User deleted successfully")
          await loadAdminData() // Refresh data
          alert("User deleted successfully")
        } else {
          throw new Error("Delete operation failed")
        }
      } catch (error) {
        console.error("❌ Error deleting user:", error)
        alert(`Failed to delete user: ${error.message}`)
      }
    }
  }

  const handleChangeRole = async (userId, username, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin"

    if (window.confirm(`Change "${username}" role from ${currentRole} to ${newRole}?`)) {
      try {
        console.log("🔄 Changing user role:", userId, "to", newRole)
        const response = await updateUserRole(userId, newRole)

        if (response && response.success) {
          console.log("✅ Role updated successfully")
          await loadAdminData() // Refresh data
          alert("User role updated successfully")
        } else {
          throw new Error("Role update failed")
        }
      } catch (error) {
        console.error("❌ Error changing user role:", error)
        alert(`Failed to change role: ${error.message}`)
      }
    }
  }

  const handleViewViolations = (userId, username) => {
    // TODO: Navigate to user violations page or open modal
    console.log("👀 View violations for user:", userId, username)
    alert(`Viewing violations for ${username} - Feature to be implemented`)
  }

  const handleAddUser = () => {
    navigate("/login")
  }

  const handleExportData = async () => {
    try {
      const csvContent = [
        ["Username", "Email", "Role", "Good Count", "Violation Count"],
        ...users.map((user) => [user.username, user.email, user.role, user.good_count || 0, user.violation_count || 0]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `admin_user_summary_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting data:", error)
      alert("Failed to export data")
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="admin-title">Access Denied</h1>
              <p>Admin privileges required. Redirecting...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="admin-title">Admin Dashboard Error</h1>
            </div>
          </div>
        </div>
        <div className="admin-content">
          <div className="error-container">
            <div className="error-message">
              <h3>Error: {error}</h3>
              <button onClick={loadAdminData} className="btn btn-primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="admin-title">Admin Dashboard</h1>
            <div className="welcome-section">
              <span className="welcome-text">Welcome, </span>
              <span className="admin-name">{user.username}</span>
              <span className="admin-badge">Admin</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => navigate("/ppe-detection")}>
              PPE Detection
            </button>
            <button className="btn btn-secondary" onClick={loadAdminData}>
              Refresh
            </button>
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        <div className="content-container">
          {/* Stats Section */}
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>Total Users</h3>
                <p className="stat-number">{stats.totalUsers}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-info">
                <h3>Active Violations</h3>
                <p className="stat-number">{stats.activeViolations}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>Compliance Rate</h3>
                <p className="stat-number">{stats.complianceRate}%</p>
              </div>
            </div>
          </div>

          {/* User PPE Stats Table */}
          <div className="table-section">
            <div className="table-header">
              <h2>User PPE Statistics</h2>
              <div className="table-actions">
                <button className="btn btn-primary" onClick={handleAddUser}>
                  Add User
                </button>
                <button className="btn btn-secondary" onClick={handleExportData}>
                  Export Data
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Compliant</th>
                    <th>Violations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="loading-cell">
                        <div className="loading-spinner"></div>
                        Loading users from backend...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-cell">
                        <div className="empty-state">
                          <div className="empty-icon">👥</div>
                          <h3>No Users Found</h3>
                          <p>Users will appear here once they start using the PPE detection system.</p>
                          <p className="backend-note">✅ Connected to backend</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((userData) => (
                      <tr key={userData.id} className="user-row">
                        <td className="user-cell">
                          <div className="user-info">
                            <div className="user-avatar">{userData.username.charAt(0).toUpperCase()}</div>
                            <div className="user-details">
                              <span className="user-name">{userData.username}</span>
                              <span className="user-email">{userData.email}</span>
                              <span className="user-role">Role: {userData.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="stat-cell">
                          <span className="stat-badge good">{userData.good_count || 0}</span>
                        </td>
                        <td className="stat-cell">
                          <span className="stat-badge violations">{userData.violation_count || 0}</span>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="action-btn delete"
                              onClick={() => handleDelete(userData.id, userData.username)}
                              title="Delete User"
                            >
                              Delete
                            </button>
                            <button
                              className="action-btn change-role"
                              onClick={() => handleChangeRole(userData.id, userData.username, userData.role)}
                              title="Change Role"
                            >
                              Make {userData.role === "admin" ? "User" : "Admin"}
                            </button>
                            <button
                              className="action-btn view-violations"
                              onClick={() => handleViewViolations(userData.id, userData.username)}
                              title="View Violations"
                            >
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
