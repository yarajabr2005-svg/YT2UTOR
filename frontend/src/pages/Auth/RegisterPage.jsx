import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MenuItem, Typography } from "@mui/material";
import AuthLayout from "./AuthLayout";
import TextInput from "../../components/TextInput";
import PinkButton from "../../components/PinkButton";
import ErrorMessage from "../../components/ErrorMessage";
import { register as apiRegister } from "../../api/auth";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    role: "student",
    bio: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiRegister(form);
      navigate("/login", { replace: true });
    } catch {
      // Changed from 'err' to empty to satisfy ESLint
      setError("Could not register. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create your YT²UTOR account">
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={handleChange("email")}
        />
        <TextInput
          label="Username"
          required
          value={form.username}
          onChange={handleChange("username")}
        />
        <TextInput
          label="Password"
          type="password"
          required
          value={form.password}
          onChange={handleChange("password")}
        />
        <TextInput
          select
          label="Role"
          value={form.role}
          onChange={handleChange("role")}
        >
          <MenuItem value="student">Student</MenuItem>
          <MenuItem value="tutor">Tutor</MenuItem>
        </TextInput>
        <TextInput
          label="Bio (required for tutors)"
          multiline
          minRows={3}
          value={form.bio}
          onChange={handleChange("bio")}
        />

        <PinkButton type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Sign up"}
        </PinkButton>

        <ErrorMessage message={error} />

        <Typography
          variant="body2"
          align="center"
          sx={{ mt: 3, color: "text.secondary" }}
        >
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#f48fb1", fontWeight: 600 }}>
            Log in
          </Link>
        </Typography>
      </form>
    </AuthLayout>
  );
}