/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  updateProfile as apiUpdateProfile,
  uploadProfileAvatar as apiUploadProfileAvatar,
  changePassword as apiChangePassword,
} from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("yt2utor_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [accessToken, setAccessToken] = useState(() => 
    localStorage.getItem("yt2utor_access") || null
  );

  const [refreshToken, setRefreshToken] = useState(() => 
    localStorage.getItem("yt2utor_refresh") || null
  );

  const handleLogin = async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    setAccessToken(data.access);
    setRefreshToken(data.refresh);

    localStorage.setItem("yt2utor_user", JSON.stringify(data.user));
    localStorage.setItem("yt2utor_access", data.access);
    localStorage.setItem("yt2utor_refresh", data.refresh);
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) await apiLogout(refreshToken);
    } catch {
      // ignore
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem("yt2utor_user");
      localStorage.removeItem("yt2utor_access");
      localStorage.removeItem("yt2utor_refresh");
    }
  };

  const handleUpdateProfile = async (payload) => {
    const nextUser = await apiUpdateProfile(payload);
    setUser(nextUser);
    localStorage.setItem("yt2utor_user", JSON.stringify(nextUser));
    return nextUser;
  };

  const handleUploadAvatar = async (file) => {
    const nextUser = await apiUploadProfileAvatar(file);
    setUser(nextUser);
    localStorage.setItem("yt2utor_user", JSON.stringify(nextUser));
    return nextUser;
  };

  const handleChangePassword = async (payload) => {
    return apiChangePassword(payload);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!user,
        login: handleLogin,
        logout: handleLogout,
        updateProfile: handleUpdateProfile,
        uploadAvatar: handleUploadAvatar,
        changePassword: handleChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
