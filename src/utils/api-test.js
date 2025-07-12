// API testing utility to check backend connectivity
const API_BASE_URL = "http://localhost:8000"

export const testBackendConnection = async () => {
  try {
    console.log("Testing backend connection...")

    // Test basic connectivity
    const response = await fetch(`${API_BASE_URL}/`, {
      method: "GET",
    })

    if (response.ok) {
      console.log("✅ Backend is reachable")
      return { success: true, message: "Backend is running" }
    } else {
      console.log("❌ Backend returned error:", response.status)
      return { success: false, message: `Backend returned ${response.status}` }
    }
  } catch (error) {
    console.error("❌ Cannot reach backend:", error)
    return {
      success: false,
      message: `Cannot connect to backend at ${API_BASE_URL}. Error: ${error.message}`,
    }
  }
}

export const testLoginEndpoint = async () => {
  try {
    console.log("Testing login endpoint...")

    const formData = new FormData()
    formData.append("username", "test")
    formData.append("password", "test")

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      body: formData,
    })

    console.log("Login endpoint response:", response.status)

    if (response.status === 401) {
      console.log("✅ Login endpoint is working (returned 401 for invalid credentials)")
      return { success: true, message: "Login endpoint is accessible" }
    } else if (response.ok) {
      console.log("✅ Login endpoint is working")
      return { success: true, message: "Login endpoint is working" }
    } else {
      console.log("❌ Login endpoint error:", response.status)
      return { success: false, message: `Login endpoint returned ${response.status}` }
    }
  } catch (error) {
    console.error("❌ Cannot reach login endpoint:", error)
    return {
      success: false,
      message: `Cannot connect to login endpoint. Error: ${error.message}`,
    }
  }
}
