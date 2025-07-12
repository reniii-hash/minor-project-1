"use client"

import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "./navbar.css"

const Navbar = () => {
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>
            HOME
          </Link>
          <Link to="/about" className={`nav-link ${location.pathname === "/about" ? "active" : ""}`}>
            ABOUT
          </Link>
        </div>

        <div className="brand">
          <Link to="/">GUARDORA</Link>
        </div>

        <div className="nav-right">
          <Link to="/contact" className={`nav-link ${location.pathname === "/contact" ? "active" : ""}`}>
            CONTACT
          </Link>
          <Link to="/help" className={`nav-link ${location.pathname === "/help" ? "active" : ""}`}>
            HELP
          </Link>
          {user ? (
            <button className="nav-link logout-btn" onClick={handleLogout}>
              LOGOUT
            </button>
          ) : (
            <Link to="/login" className={`nav-link ${location.pathname === "/login" ? "active" : ""}`}>
              LOGIN
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
