import React from "react";
import Eyebrow from "./Eyebrow";
import Marginalia from "./Marginalia";

/**
 * Editorial hero. Title supports `{em: "accent part"}` segments (rose, non-italic).
 *   <Hero title={["Learn faster with the ", { em: "right tutor" }]} />
 */
function renderTitle(parts) {
  if (typeof parts === "string") return parts;
  return parts.map((part, i) =>
    typeof part === "string" ? (
      <React.Fragment key={i}>{part}</React.Fragment>
    ) : (
      <span key={i} className="hero-title-accent">{part.em}</span>
    )
  );
}

export default function Hero({ eyebrow, title, sub, actions, marginalia }) {
  return (
    <section className="hero">
      <div>
        {eyebrow && <Eyebrow tone="rose">{eyebrow}</Eyebrow>}
        <h1 className="hero-title">{renderTitle(title)}</h1>
        {sub && <p className="hero-sub">{sub}</p>}
        {actions && <div className="hero-actions">{actions}</div>}
      </div>
      {marginalia && <Marginalia items={marginalia} />}
    </section>
  );
}
