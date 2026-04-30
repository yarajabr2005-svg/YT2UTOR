import React from "react";

export default function StatBlock({ value, label, italic }) {
  return (
    <div className="stat-block">
      <div className={`stat-block-num${italic ? " stat-block-num--rose" : ""}`}>{value}</div>
      <div className="stat-block-label">{label}</div>
    </div>
  );
}
