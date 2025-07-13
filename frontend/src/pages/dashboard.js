"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

const Dashboard = async () => {
  const navigate = useNavigate();
  const [violations, setViolations] = useState([]);
  const [stats, setStats] = useState({
    totalViolations: 0,
    helmetViolations: 0,
    vestViolations: 0,
    todayViolations: 0,
  });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // For storing user profile data
  const [userProfile, setUserProfile] = useState(null);  // New state for user profile info

  const response = await fetch("http://localhost:8000/user/violations", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  const data = await response.json();
  setViolations(data);

  useEffect(() => {
    const loadViolations = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;

        // Fetch user profile data (username, email, role)
        const userProfileResponse = await fetch("http://localhost:8000/user/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const userProfileData = await userProfileResponse.json();
        setUserProfile(userProfileData);  // Set the user profile info

        const response = await fetch("http://127.0.0.1:8000/user/violations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        setViolations(data);
        calculateStats(data);
        setLoading(false);
      } catch (error) {
        console.error("Error loading violations:", error);
        setLoading(false);
      }
    };

    loadViolations();
  }, []);

  const calculateStats = (violationsData) => {
    const today = new Date().toDateString();
    const todayViolations = violationsData.filter(
      (v) => new Date(v.date).toDateString() === today
    ).length;

    const helmetViolations = violationsData.filter(
      (v) => v.label === "NoHelmet"
    ).length;
    const vestViolations = violationsData.filter(
      (v) => v.label === "NoVest"
    ).length;

    setStats({
      totalViolations: violationsData.length,
      helmetViolations,
      vestViolations,
      todayViolations,
    });
  };

  const filteredViolations = violations.filter((violation) => {
    if (filter === "all") return true;
    return violation.label === filter;
  });

  const clearViolations = async () => {
    if (window.confirm("Are you sure you want to clear all violation records?")) {
      try {
        setViolations([]);
        setStats({
          totalViolations: 0,
          helmetViolations: 0,
          vestViolations: 0,
          todayViolations: 0,
        });
      } catch (error) {
        console.error("Error clearing violations:", error);
      }
    }
  };

  const exportViolations = async () => {
    try {
      const csvContent = [
        ["Date", "Label", "Confidence"],
        ...filteredViolations.map((v) => [v.timestamp, v.label, v.confidence]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ppe_violations.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting violations:", error);
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>PPE Violations Dashboard</h1>
            <p>Monitor and track safety compliance violations</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/ppe-detection")}
            >
              Back to Detection
            </button>
            <button className="btn btn-primary" onClick={exportViolations}>
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* User Profile */}
      {userProfile && (
        <div className="user-profile">
          <h2>User Profile</h2>
          <p><strong>Username:</strong> {userProfile.username}</p>
          <p><strong>Email:</strong> {userProfile.email}</p>
          <p><strong>Role:</strong> {userProfile.role}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Violations</h3>
            <p className="stat-number">{stats.totalViolations}</p>
          </div>
        </div>
        <div className="stat-card helmet">
          <div className="stat-icon">⛑️</div>
          <div className="stat-content">
            <h3>Helmet Violations</h3>
            <p className="stat-number">{stats.helmetViolations}</p>
          </div>
        </div>
        <div className="stat-card vest">
          <div className="stat-icon">🦺</div>
          <div className="stat-content">
            <h3>Vest Violations</h3>
            <p className="stat-number">{stats.vestViolations}</p>
          </div>
        </div>
        <div className="stat-card today">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Today's Violations</h3>
            <p className="stat-number">{stats.todayViolations}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-container">
        <div className="filters">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Violations</option>
            <option value="NoHelmet">Helmet Violations</option>
            <option value="NoVest">Vest Violations</option>
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
          <p>Ready for backend integration</p>
        </div>

        <div className="table-container">
          <table className="violations-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Label</th>
                <th>Confidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="loading-cell">
                    <div className="loading-spinner"></div>
                    Loading violations...
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">
                    <div className="empty-state">
                      <div className="empty-icon">📊</div>
                      <h3>No Violations Found</h3>
                      <p>
                        Violations will appear here when detected by the PPE
                        monitoring system.
                      </p>
                      <p className="backend-note">Ready for backend integration</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
