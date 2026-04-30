import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ForgotPasswordPage from "../pages/Auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/Auth/ResetPasswordPage";
import AppWorkspace from "../pages/AppWorkspace";
import ProtectedRoute from "./ProtectedRoute";

function ProtectedWorkspace() {
  return (
    <ProtectedRoute>
      <AppWorkspace />
    </ProtectedRoute>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<ProtectedWorkspace />} />
      <Route path="/student" element={<ProtectedWorkspace />} />
      <Route path="/tutor" element={<ProtectedWorkspace />} />
      <Route path="/admin" element={<ProtectedWorkspace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
