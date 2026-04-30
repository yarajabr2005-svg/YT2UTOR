import React from "react";

export default function Eyebrow({ children, tone = "mute", as: Tag = "span" }) {
  return <Tag className={`eb eb--${tone}`}>{children}</Tag>;
}
