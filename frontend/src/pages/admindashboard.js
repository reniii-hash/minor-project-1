"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from '../context/AuthContext';
import "./admindashboard.css"

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeViolations: 0,
    complianceRate: 100,
  })

  useEffect(() => {
    const fetchAdminData = async () => {
      if (user?.role !== "admin") {
        navigate("/", { replace: true });
        return;
      }

      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:8000/admin/summary", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const summary = await res.json();

        const nonAdminUsers = summary.filter((u) => u.role !== "admin");

        setUsers(nonAdminUsers);
        setStats({
          totalUsers: nonAdminUsers.length,
          activeViolations: nonAdminUsers.reduce((sum, u) => sum + u.violation_count, 0),
          complianceRate:
            nonAdminUsers.length > 0
              ? Math.round((nonAdminUsers.filter((u) => u.violation_count === 0).length / nonAdminUsers.length) * 100)
              : 100,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error loading users:", error);
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, navigate]);

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:8000/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      setUsers(users.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleViewViolations = (userId) => {
    navigate(`/admin/users/${userId}/violations`);
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/admin/export", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "user_ppe_summary.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  if (!user || user.role !== "admin") {
    return <div>Access denied. Redirecting...</div>
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="admin-title">Admin Dashboard</h1>
            <div className="welcome-section">
              <span className="welcome-text">Welcome, </span>
              <span className="admin-name">{user?.username || 'Admin'}</span>
              <span className="admin-badge">Admin</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="content-container">
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

          <div className="table-section">
            <div className="table-header">
              <h2>User PPE Stats</h2>
              <div className="table-actions">
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
                    <th>All Good</th>
                    <th>Violations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="loading-cell">
                        <div className="loading-spinner"></div>
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-cell">
                        <div className="empty-state">
                          <div className="empty-icon">👥</div>
                          <h3>No Users Found</h3>
                          <p>Users will appear here once they start using the PPE detection system.</p>
                          <p className="backend-note">Ready for backend integration</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="user-row">
                        <td className="user-cell">
                          <div className="user-info">
                            <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                            <div className="user-details">
                              <span className="user-name">{user.username}</span>
                              <span className="user-email">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="stat-cell">
                          <span className="stat-badge good">{user.good_count || 0}</span>
                        </td>
                        <td className="stat-cell">
                          <span className="stat-badge violations">{user.violation_count || 0}</span>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button className="action-btn delete" onClick={() => handleDelete(user.id)} title="Delete User">Delete</button>
                            <button className="action-btn view-violations" onClick={() => handleViewViolations(user.id)} title="View Violations">View Violations</button>
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
