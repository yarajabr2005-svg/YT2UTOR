import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { confirmPasswordReset } from "../../api/auth";
import { useFeedback } from "../../context/FeedbackContext";
import {
  EdField,
  Eyebrow,
  StampButton,
} from "../../components/editorial";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { notify } = useFeedback();
  const [searchParams] = useSearchParams();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!uid || !token) {
      notify.error("Invalid or expired reset link.");
      navigate("/login", { replace: true });
    }
  }, [uid, token, navigate, notify]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uid || !token) return;
    setSubmitting(true);
    try {
      await confirmPasswordReset(uid, token, password);
      notify.success("Password has been reset. You can sign in now.");
      navigate("/login", { replace: true });
    } catch {
      notify.error("Could not reset password. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!uid || !token) return null;

  return (
    <AuthLayout
      title="Choose"
      accent="new password"
      quote="Pick a strong password you have not used before on this platform."
    >
      <Eyebrow>Password reset</Eyebrow>
      <h2 className="auth-right-head">Set a new password</h2>
      <p className="ux-help" style={{ marginTop: 4, marginBottom: 28 }}>Your link is valid for a limited time. Choose something you will remember.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <EdField
          label="New password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <div style={{ marginTop: 16 }}>
          <StampButton variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Resetting…" : "Reset password  ›"}
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
          <Link to="/login" className="auth-link">Back to sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
