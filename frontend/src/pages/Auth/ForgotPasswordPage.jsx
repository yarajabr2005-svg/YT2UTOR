import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { requestPasswordReset } from "../../api/auth";
import { useFeedback } from "../../context/FeedbackContext";
import {
  EdField,
  Eyebrow,
  StampButton,
} from "../../components/editorial";

export default function ForgotPasswordPage() {
  const { notify } = useFeedback();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch {
      notify.error("Could not send reset email. Check the address and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check"
        accent="your inbox"
        quote="If the email matches an account, you will receive a link to reset your password."
      >
        <Eyebrow>Password reset</Eyebrow>
        <h2 className="auth-right-head">Email sent</h2>
        <p className="ux-help" style={{ marginTop: 4, marginBottom: 28 }}>Follow the link in the email to choose a new password. It may take a minute to arrive.</p>

        <div>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 14,
              color: "var(--mute)",
            }}
          >
            <Link to="/login" className="auth-link">Back to sign in</Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset"
      accent="password"
      quote="Enter the email you signed up with. We will send you a link to create a new password."
    >
      <Eyebrow>Forgot password</Eyebrow>
      <h2 className="auth-right-head">Request a reset link</h2>
      <p className="ux-help" style={{ marginTop: 4, marginBottom: 28 }}>We will email you a secure link — it expires after a short time.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <EdField
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <div style={{ marginTop: 16 }}>
          <StampButton variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link  ›"}
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
