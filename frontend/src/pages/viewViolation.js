"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./viewViolation.css"; // Optional styling

const ViewViolation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();

  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }

    const fetchViolations = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8000/admin/violations/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch violations");
        }

        const data = await res.json();
        setViolations(data);
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };

    fetchViolations();
  }, [user, navigate, userId]);

  return (
    <div className="view-violations-container">
      <h2>User PPE Detection History</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {violations.length === 0 ? (
            <p>No detection history for this user.</p>
          ) : (
            <table className="violation-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Time</th>
                  <th>Person ID</th>
                  <th>Image ID</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v, index) => (
                  <tr key={index}>
                    <td style={{ color: v.label === "GoodToGo" ? "green" : "red" }}>
                      {v.label}
                    </td>
                    <td>{(v.confidence * 100).toFixed(1)}%</td>
                    <td>{new Date(v.timestamp).toLocaleString()}</td>
                    <td>{v.person_id}</td>
                    <td>{v.image_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default ViewViolation;
