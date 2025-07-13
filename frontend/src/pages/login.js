"use client"

import { FaEye, FaEyeSlash } from "react-icons/fa"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from '../context/AuthContext'
import "./login.css"

const Login = () => {
  const [isSignup, setIsSignup] = useState(false)
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    email: "",
    username: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")  // Added state for success message

  const navigate = useNavigate()
  const location = useLocation()
  const { login, signup, user } = useAuth()

  useEffect(() => {
    if (user) {
      const redirectPath = user.role === "admin" ? "/admindashboard" : location.state?.from?.pathname || "/"
      navigate(redirectPath, { replace: true })
    }
  }, [user, navigate, location.state])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
    setSuccessMessage("")  // Clear success message on input change
  }

  const validateForm = () => {
    if (isSignup) {
      // For signup, check if at least one of email or username is provided
      if (!formData.email || !formData.username) {
        setError("Please provide either an email or username")
        return false
      }
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        setError("Please enter a valid email address")
        return false
      }
      if (formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
        setError("Username must be 3-20 characters long and contain only letters, numbers, and underscores")
        return false
      }
    } else {
      // For login
      if (!formData.emailOrUsername || !formData.password) {
        setError("Please fill in all required fields")
        return false
      }
    }

    if (!formData.password) {
      setError("Password is required")
      return false
    }

    if (formData.password.length < 3) {
      setError("Password must be at least 3 characters long")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError("")
    setSuccessMessage("")  // Clear success message before submission

    try {
      const result = isSignup
        ? await signup(formData.email, formData.username, formData.password)
        : await login(formData.emailOrUsername, formData.password)

      if (!result.success) {
        setError(result.error)
      } else if (isSignup && result.success) {
        setSuccessMessage("Account created successfully! Please log in.")  // Set success message on successful signup
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignup(!isSignup)
    setError("")
    setSuccessMessage("")  // Clear success message on switching modes
    setFormData({ emailOrUsername: "", email: "", username: "", password: "" })
  }

  if (user) return <div>Redirecting...</div>

  return (
    <div className="login">
      <div className="login-container">
        <div className="login-form-wrapper">
          <h1 className="login-brand">GUARDORA</h1>
          <h2 className="login-title">{isSignup ? "Create Account" : "Welcome Back"}</h2>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}  {/* Display success message */}

          <form className="login-form" onSubmit={handleSubmit}>
            {isSignup ? (
              <>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a username"
                    disabled={loading}
                  />
                  <small className="form-hint">
                    Username: 3-20 characters, letters, numbers, and
                    underscores only
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
                    disabled={loading}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="emailOrUsername">Email or Username *</label>
                  <input
                    type="text"
                    id="emailOrUsername"
                    name="emailOrUsername"
                    value={formData.emailOrUsername}
                    onChange={handleInputChange}
                    placeholder="Enter your email or username"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    disabled={loading}
                    required
                  />
                </div>
              </>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            <p>
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <span className="signup-link" onClick={toggleMode}>
                {isSignup ? "Sign In" : "Sign Up"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
