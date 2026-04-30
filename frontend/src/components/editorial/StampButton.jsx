import React from "react";

export default function StampButton({
  variant = "primary",
  as,
  className = "",
  children,
  ...rest
}) {
  const Tag = as || (rest.href ? "a" : "button");
  const cls = `stamp stamp--${variant} ${className}`.trim();
  if (Tag === "button" && !rest.type) rest.type = "button";
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
