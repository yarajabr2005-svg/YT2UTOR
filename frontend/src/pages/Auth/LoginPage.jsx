import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Typography } from "@mui/material";
import AuthLayout from "./AuthLayout";
import TextInput from "../../components/TextInput";
import PinkButton from "../../components/PinkButton";
import ErrorMessage from "../../components/ErrorMessage";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      // Changed from 'err' to empty to satisfy ESLint
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome to YT²UTOR">
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextInput
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <PinkButton type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </PinkButton>

        <ErrorMessage message={error} />

        <Typography
          variant="body2"
          align="center"
          sx={{ mt: 3, color: "text.secondary" }}
        >
          Don&apos;t have an account?{" "}
          <Link to="/register" style={{ color: "#f48fb1", fontWeight: 600 }}>
            Sign up
          </Link>
        </Typography>
      </form>
    </AuthLayout>
  );
}