import axios from "axios";

const API_URL = "http://localhost:8000";  // Backend URL

const api = axios.create({
  baseURL: API_URL,
});

// Login
export const login = async (usernameOrEmail, password) => {
  const formData = new URLSearchParams();
  formData.append("username", usernameOrEmail);
  formData.append("password", password);

  const response = await api.post("/login", formData);
  return response.data;
};

// Add other API calls as needed, for example:
export const uploadImage = async (file, token) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/upload", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export default api;

