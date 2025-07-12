"use client"

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

  const navigate = useNavigate()
  const location = useLocation()
  const { login, signup, user } = useAuth()

  // Redirect after login based on role
  useEffect(() => {
    if (user) {
      const redirectPath = user.role === "admin" ? "/admin-dashboard" : location.state?.from?.pathname || "/"
      navigate(redirectPath, { replace: true })
    }
  }, [user, navigate, location.state])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const validateForm = () => {
    if (isSignup) {
      if (!formData.email || !formData.username || !formData.password) {
        setError("Please fill in all fields")
        return false
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError("Please enter a valid email")
        return false
      }
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
        setError("Username must be 3-20 characters and contain only letters, numbers, or underscores")
        return false
      }
    } else {
      if (!formData.emailOrUsername || !formData.password) {
        setError("Please enter your email/username and password")
        return false
      }
    }

    if (formData.password.length < 3) {
      setError("Password must be at least 3 characters")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError("")

    try {
      if (isSignup) {
        const result = await signup(formData.email, formData.username, formData.password)
        if (!result.success) {
          setError(result.error)
        } else {
          // Auto-login after successful signup
          const loginResult = await login(formData.username, formData.password)
          if (!loginResult.success) {
            setError(loginResult.error)
          }
        }
      } else {
        const result = await login(formData.emailOrUsername, formData.password)
        if (!result.success) {
          setError(result.error)
        }
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
    setFormData({
      emailOrUsername: "",
      email: "",
      username: "",
      password: "",
    })
  }

  if (user) return <div>Redirecting...</div>

  return (
    <div className="login">
      <div className="login-container">
        <div className="login-form-wrapper">
          <h1 className="login-brand">GUARDORA</h1>
          <h2 className="login-title">{isSignup ? "Create Account" : "Welcome Back"}</h2>

          {error && <div className="error-message">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            {isSignup ? (
              <>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="username">Username *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a username"
                    disabled={loading}
                    required
                  />
                  <small className="form-hint">
                    3-20 characters, only letters, numbers, and underscores
                  </small>
                </div>
              </>
            ) : (
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
            )}
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
