import React from "react";

/**
 * Marginalia — right-rail metadata block.
 * items: [{ k, v, suffix }] | children
 */
export default function Marginalia({ items, children }) {
  return (
    <aside className="marg">
      {items?.map(({ k, v, suffix, numeric = true }) => (
        <div className="marg-row" key={k}>
          <span className="k">{k}</span>
          <span className={`v ${numeric ? "numeric" : ""}`}>
            {v}
            {suffix && <small>{suffix}</small>}
          </span>
        </div>
      ))}
      {children}
    </aside>
  );
}
