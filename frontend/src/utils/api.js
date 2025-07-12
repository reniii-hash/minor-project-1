// Enhanced API utility functions for backend communication
const API_BASE_URL = "http://localhost:8000"

// Enhanced error handling
class APIError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = "APIError"
    this.status = status
    this.data = data
  }
}

// Main API call function with enhanced error handling
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token")

  console.log(`🔄 API Call: ${options.method || "GET"} ${endpoint}`)

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  }

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions)

    console.log(`📡 Response: ${response.status} for ${endpoint}`)

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("🔐 Token expired or invalid, redirecting to login")
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login"
        return null
      }

      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`

      console.error(`❌ API Error: ${errorMessage}`)
      throw new APIError(errorMessage, response.status, errorData)
    }

    const data = await response.json()
    console.log(`✅ Success: ${endpoint}`, data)
    return data
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }

    console.error(`🔥 Network Error for ${endpoint}:`, error)
    throw new APIError(`Network error: ${error.message}`, 0, { originalError: error })
  }
}

// File upload function with progress tracking
export const uploadFile = async (endpoint, file, additionalData = {}, onProgress = null) => {
  const token = localStorage.getItem("token")

  console.log(`📤 File Upload: ${endpoint}`, { fileName: file.name, size: file.size })

  const formData = new FormData()
  formData.append("file", file)

  Object.keys(additionalData).forEach((key) => {
    formData.append(key, additionalData[key])
  })

  try {
    const xhr = new XMLHttpRequest()

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100
          onProgress(percentComplete)
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            console.log(`✅ Upload Success: ${endpoint}`, data)
            resolve(data)
          } catch (e) {
            reject(new APIError("Invalid JSON response", xhr.status))
          }
        } else {
          if (xhr.status === 401) {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            window.location.href = "/login"
            return
          }

          try {
            const errorData = JSON.parse(xhr.responseText)
            reject(new APIError(errorData.detail || `HTTP ${xhr.status}`, xhr.status, errorData))
          } catch (e) {
            reject(new APIError(`HTTP ${xhr.status}`, xhr.status))
          }
        }
      })

      xhr.addEventListener("error", () => {
        console.error(`🔥 Upload Error: ${endpoint}`)
        reject(new APIError("Network error during upload", 0))
      })

      xhr.open("POST", `${API_BASE_URL}${endpoint}`)
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      }
      xhr.send(formData)
    })
  } catch (error) {
    console.error(`🔥 Upload Setup Error for ${endpoint}:`, error)
    throw new APIError(`Upload failed: ${error.message}`, 0, { originalError: error })
  }
}

// Test backend connectivity
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test`)
    if (response.ok) {
      const data = await response.json()
      console.log("✅ Backend connection test successful", data)
      return { success: true, data }
    } else {
      console.error("❌ Backend connection test failed", response.status)
      return { success: false, error: `HTTP ${response.status}` }
    }
  } catch (error) {
    console.error("🔥 Backend connection test error", error)
    return {
      success: false,
      error: `Cannot connect to backend at ${API_BASE_URL}. Error: ${error.message}`,
    }
  }
}

// Authentication API calls
export const loginUser = async (emailOrUsername, password) => {
  const formData = new FormData()
  formData.append("username", emailOrUsername)
  formData.append("password", password)

  return await apiCall("/login", {
    method: "POST",
    headers: {}, // Remove Content-Type to let browser set it for FormData
    body: formData,
  })
}

export const signupUser = async (email, username, password) => {
  return await apiCall("/signup", {
    method: "POST",
    body: JSON.stringify({
      email: email,
      username: username,
      password: password,
      role: "user",
    }),
  })
}

export const getCurrentUser = async () => {
  return await apiCall("/user/me")
}

// PPE Detection API calls
export const detectPPEInImage = async (imageFile, onProgress = null) => {
  return await uploadFile("/detect/", imageFile, {}, onProgress)
}

// Dashboard API calls
export const getUserDashboard = async () => {
  return await apiCall("/user/dashboard")
}

export const getUserViolations = async () => {
  return await apiCall("/user/violations")
}

// Admin API calls
export const getAdminSummary = async () => {
  return await apiCall("/admin/summary")
}

export const getAllUsers = async () => {
  return await apiCall("/admin/users")
}

export const deleteUser = async (userId) => {
  return await apiCall(`/admin/users/${userId}`, { method: "DELETE" })
}

export const updateUserRole = async (userId, newRole) => {
  return await apiCall(`/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ new_role: newRole }),
  })
}

export const getUserViolationsAdmin = async (userId) => {
  return await apiCall(`/admin/violations/${userId}`)
}

// Health check
export const healthCheck = async () => {
  return await apiCall("/health")
}

export { API_BASE_URL, APIError }
