import React from "react";

const TONE_BY_STATUS = {
  pending: "info",
  pending_review: "info",
  upcoming: "info",
  confirmed: "ok",
  approved: "ok",
  completed: "ok",
  rejected: "err",
  cancelled: "err",
};

export default function InkPill({ status, tone, children }) {
  const resolved = tone || TONE_BY_STATUS[status] || "mute";
  return (
    <span className={`ink-pill ink-pill--${resolved}`} data-status={status}>
      {children || (status || "").replace(/_/g, " ")}
    </span>
  );
}
