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

export async function fetchMe() {
  const response = await api.get("users/me/");
  return response.data;
}

export async function updateProfile(payload) {
  const response = await api.put("users/me/", payload);
  return response.data;
}

export async function uploadProfileAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("users/me/avatar/", formData);
  return response.data;
}

export async function changePassword({ old_password, new_password }) {
  const response = await api.put("users/me/password/", { old_password, new_password });
  return response.data;
}

export async function requestPasswordReset(email) {
  const response = await api.post("auth/password-reset/", { email });
  return response.data;
}

export async function confirmPasswordReset(uid, token, new_password) {
  const response = await api.post("auth/password-reset/confirm/", {
    uid,
    token,
    new_password,
  });
  return response.data;
}
