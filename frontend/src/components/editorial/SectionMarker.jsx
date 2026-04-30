import React from "react";

const pad = (n) => String(n).padStart(2, "0");

export default function SectionMarker({ index = 1, label, meta, id }) {
  return (
    <div className="sm scroll-anchor" id={id}>
      <span className="sm-num">{pad(index)} /</span>
      <span className="sm-label">{label}</span>
      {meta != null && <span className="sm-meta">{meta}</span>}
    </div>
  );
}
