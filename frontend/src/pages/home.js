"use client"

import { useNavigate } from "react-router-dom"
import { useAuth } from '../context/AuthContext'
import "./home.css"

const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleStartClick = () => {
    if (user) {
      navigate("/ppe-detection")
    } else {
      navigate("/login", { state: { from: { pathname: "/ppe-detection" } } })
    }
  }

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="hero-title">SAFETY DOESN'T HAPPEN BY ACCIDENT — IT STARTS WITH THE RIGHT EQUIPMENT.</h1>
            <button className="welcome-btn" onClick={handleStartClick}>
              {user ? "START DETECTION" : "START"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home