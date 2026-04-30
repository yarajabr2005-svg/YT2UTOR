import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../../context/AuthContext";
import { useFeedback } from "../../context/FeedbackContext";
import {
  EdField,
  Eyebrow,
  StampButton,
} from "../../components/editorial";

export default function LoginPage() {
  const { login } = useAuth();
  const { notify } = useFeedback();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      notify.error("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome"
      accent="back"
      quote="The right tutor is one good search away. Sign in to continue."
    >
      <Eyebrow>Sign in</Eyebrow>
      <h2 className="auth-right-head">Pick up where you left off</h2>
      <p className="ux-help" style={{ marginTop: 4, marginBottom: 28 }}>We will send you to your student, tutor, or admin workspace after you sign in.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <EdField
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <EdField
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <p
          style={{
            marginBottom: 0,
            fontFamily: "var(--sans)",
            fontSize: 13,
            textAlign: "right",
          }}
        >
          <Link to="/forgot-password" className="auth-link">Forgot your password?</Link>
        </p>

        <div style={{ marginTop: 16 }}>
          <StampButton variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in  ›"}
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
          New here?{" "}
          <Link to="/register" className="auth-link">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
