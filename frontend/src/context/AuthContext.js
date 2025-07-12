"use client";

import { createContext, useContext, useState, useEffect } from "react";

// Create a context for authentication
const AuthContext = createContext();



export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// The AuthProvider component that provides the authentication context to the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Holds the authenticated user data
  const [token, setToken] = useState(localStorage.getItem("token")) // ✅ Must be inside function
  const [loading, setLoading] = useState(true); // Loading state to prevent rendering before authentication

  // Load user from localStorage on initial render
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Helper method to perform fetch requests with authentication token
  const fetchWithAuth = async (url, method = "GET", body = null) => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No token found");
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.detail || "Request failed" };
    }
    return response.json();
  };

  // Login method to authenticate user with backend
  const login = async (emailOrUsername, password) => {
    try {
      const form = new URLSearchParams();
      form.append("username", emailOrUsername);
      form.append("password", password);

      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.detail || "Login failed" };
      }

      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);

      // 🟡 Fetch user info using token
      const me = await fetch("http://localhost:8000/user/me", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      const userData = await me.json();
      if (!me.ok) {
        return { success: false, error: "Failed to fetch user data" };
      }

      // Save the user data to localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || "Login error" };
    }
  };

  // Signup method to create a new user and auto-login
  const signup = async (email, username, password) => {
    try {
      const res = await fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.detail || "Signup failed" };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || "Signup error" };
    }
  };

  // Logout method to clear user data and token
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Function to check if user is admin
  const isAdmin = () => {
    return user && user.role === "admin";
  };

  // Provide authentication data to children components
  const value = {
    user,
    token,
    login,
    signup,
    logout,
    loading,
    isAdmin,
    fetchWithAuth, // Expose the fetchWithAuth method for protected routes
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
