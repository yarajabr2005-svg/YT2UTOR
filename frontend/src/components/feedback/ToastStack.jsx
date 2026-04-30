import React, { useCallback, useEffect, useState } from "react";
import "./feedback.css";

const TOAST_TTL_MS = 4800;
const TOAST_OUT_MS = 200;

function ToastItem({ id, variant, title, message, onDismiss }) {
  const [leaving, setLeaving] = useState(false);

  const startLeave = useCallback(() => {
    setLeaving(true);
  }, []);

  useEffect(() => {
    if (leaving) return undefined;
    const t = setTimeout(startLeave, TOAST_TTL_MS);
    return () => clearTimeout(t);
  }, [leaving, startLeave]);

  useEffect(() => {
    if (!leaving) return undefined;
    const t = setTimeout(() => onDismiss(id), TOAST_OUT_MS);
    return () => clearTimeout(t);
  }, [leaving, id, onDismiss]);

  return (
    <div
      className={`toast toast--${variant}${leaving ? " toast--leaving" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="toast__head">
        <div>
          {title ? <p className="toast__title">{title}</p> : null}
          <p className="toast__body">{message != null && message !== "" ? String(message) : "An error occurred."}</p>
        </div>
        <button type="button" className="toast__dismiss" onClick={startLeave} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  );
}

export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" aria-relevant="additions text">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
