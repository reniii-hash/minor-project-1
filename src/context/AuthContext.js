"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const fetchWithAuth = async (url, method = "GET", body = null) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.detail || "Request failed" };
    }
    return response.json();
  };

  const login = async (emailOrUsername, password) => {
    try {
      const form = new URLSearchParams();
      form.append("username", emailOrUsername);
      form.append("password", password);

      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || "Login failed" };
      }

      localStorage.setItem("token", data.access_token);

      const me = await fetch("http://localhost:8000/user/me", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      const userData = await me.json();
      if (!me.ok) return { success: false, error: "Failed to fetch user info" };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || "Login error" };
    }
  };

  const signup = async (email, username, password) => {
    try {
      const res = await fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const isAdmin = () => user && user.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, login, signup, logout, loading, isAdmin, fetchWithAuth }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
