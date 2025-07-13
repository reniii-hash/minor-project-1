"use client"

import { useNavigate } from "react-router-dom"
import "./about.css"
import helmet1 from "./helmet1 copy.jpg"
import worker from "./main-worker copy.jpg"
import helmet2 from "./helmet2 copy.jpg"

const About = () => {
  const navigate = useNavigate()

  const handleLearnMoreClick = () => {
    navigate("/contact")
  }

  return (
    <div className="about">
      <div className="about-container">
        <div className="about-images">
          <div className="image-grid">
            <div className="left-images">
              <div className="about-img helmet1">
                <img src={helmet1 || "/placeholder.svg"} alt="Safety Helmets" />
              </div>
              <div className="about-img helmet2">
                <img src={helmet2 || "/placeholder.svg"} alt="Safety Equipment" />
              </div>
            </div>
            <div className="right-image">
              <div className="about-img main-worker">
                <img src={worker || "/placeholder.svg"} alt="Construction Worker" />
              </div>
            </div>
          </div>
        </div>

        <div className="about-content">
          <h1 className="about-title">GUARDORA</h1>
          <p className="about-description">
            This website uses AI to detect PPE compliance in real time, providing live alerts, detection logs, and an
            intuitive dashboard. It helps improve safety, reduce manual checks, and ensure workers follow regulations.
          </p>
          <button className="about-btn" onClick={handleLearnMoreClick}>
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}

export default About