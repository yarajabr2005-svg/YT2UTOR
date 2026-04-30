import React from "react";

export default function EmptyState({ title, meta, action }) {
  return (
    <div className="ed-empty">
      <h3 className="ed-empty-title">{title}</h3>
      {meta && <p className="ed-empty-meta">{meta}</p>}
      {action}
    </div>
  );
}
