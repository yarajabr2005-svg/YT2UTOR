import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000/api/",
});

// Interceptor to attach the JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("yt2utor_access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(email, password) {
  const response = await api.post("auth/login/", { email, password });
  return response.data;
}

export async function register(payload) {
  const response = await api.post("auth/register/", payload);
  return response.data;
}

export async function logout(refreshToken) {
  const response = await api.post("auth/logout/", { refresh: refreshToken });
  return response.data;
}