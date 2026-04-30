import React from "react";

/**
 * Editorial split layout for auth pages.
 *  - Left: serif statement, rose accent, pull-quote, foot meta.
 *  - Right: form column on hairline-ruled inputs.
 */
export default function AuthLayout({
  eyebrow = "YT²UTOR",
  title,
  accent,
  quote,
  children,
}) {
  return (
    <div className="auth-split">
      <aside className="auth-left">
        <div>
          <span className="eb eb--rose" style={{ display: "block", marginBottom: 32 }}>
            {eyebrow}
          </span>
          <h1 className="auth-left-title">
            {title}
            {accent && (
              <>
                {" "}
                <em>{accent}</em>
              </>
            )}
            .
          </h1>
          {quote && <p className="auth-left-quote">&ldquo;{quote}&rdquo;</p>}
        </div>
        <div className="auth-left-foot">
          <span>YT2UTOR · 2026</span>
          <span>Connect with tutors who match your goals.</span>
        </div>
      </aside>
      <section className="auth-right">{children}</section>
    </div>
  );
}
