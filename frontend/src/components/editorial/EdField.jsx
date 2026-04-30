import React, { useId } from "react";

/**
 * Editorial input — bottom-rule, no box. Replaces TextInput.
 * type: "text" | "email" | "password" | "date" | "time" | "number" | "textarea" | "select" | "file"
 */
export default function EdField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  options,
  children,
  rows = 3,
  error,
  autoComplete,
  min,
  max,
  accept,
  name,
}) {
  const id = useId();
  const handleChange = (e) => onChange?.(e);

  let control;
  if (type === "textarea") {
    control = (
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value ?? ""}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
      />
    );
  } else if (type === "select") {
    control = (
      <select id={id} name={name} value={value ?? ""} onChange={handleChange} required={required}>
        {options
          ? options.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    );
  } else if (type === "file") {
    control = (
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        onChange={handleChange}
        required={required}
      />
    );
  } else {
    control = (
      <input
        id={id}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        min={min}
        max={max}
      />
    );
  }

  return (
    <label className={`ed-field ${error ? "ed-field--err" : ""}`} htmlFor={id}>
      {label && <span className="ed-field-label">{label}</span>}
      {control}
    </label>
  );
}
