import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { register as apiRegister } from "../../api/auth";
import { useFeedback } from "../../context/FeedbackContext";
import {
  EdField,
  Eyebrow,
  StampButton,
} from "../../components/editorial";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { notify } = useFeedback();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    role: "student",
    bio: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const change = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRegister(form);
      notify.success("Account created. You can sign in now.");
      navigate("/login", { replace: true });
    } catch {
      notify.error("Could not register. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Begin"
      accent="here"
      quote="A short form now — booking and sessions live in the app after you sign in."
    >
      <Eyebrow>Register</Eyebrow>
      <h2 className="auth-right-head">Create your workspace</h2>
      <p className="ux-help" style={{ marginTop: 4, marginBottom: 28 }}>Tutors need a short public bio. Students can add more detail in their profile later.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <EdField
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={change("email")}
          autoComplete="email"
        />
        <EdField
          label="Username"
          required
          value={form.username}
          onChange={change("username")}
          autoComplete="username"
        />
        <EdField
          label="Password"
          type="password"
          required
          value={form.password}
          onChange={change("password")}
          autoComplete="new-password"
        />
        <EdField
          label="Role"
          type="select"
          value={form.role}
          onChange={change("role")}
          options={[
            { value: "student", label: "Student — I want to learn" },
            { value: "tutor", label: "Tutor — I want to teach" },
          ]}
        />
        <EdField
          label="Bio (required for tutors)"
          type="textarea"
          rows={3}
          value={form.bio}
          onChange={change("bio")}
        />

        <div style={{ marginTop: 16 }}>
          <StampButton variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Sign up  ›"}
          </StampButton>
        </div>

        <p
          style={{
            marginTop: 32,
            fontFamily: "var(--sans)",
            fontSize: 14,
            color: "var(--mute)",
          }}
        >
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
