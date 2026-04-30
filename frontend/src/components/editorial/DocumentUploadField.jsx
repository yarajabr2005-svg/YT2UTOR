import React from "react";
import AttachFileIcon from "@mui/icons-material/AttachFile";

/**
 * Hides the native file chrome; a stamp-style target + clear filename line.
 */
export default function DocumentUploadField({
  label,
  accept,
  file = null,
  onChange,
  emptyHint = "No file selected yet.",
  hint,
}) {
  return (
    <div className="doc-upload-field">
      {label && <span className="ed-field-label">{label}</span>}
      <div className="doc-upload-field__row">
        <label className="doc-upload-field__trigger">
          <input
            className="doc-upload-field__native"
            type="file"
            accept={accept}
            onChange={onChange}
          />
          <span className="doc-upload-field__face">
            <AttachFileIcon sx={{ fontSize: 18 }} aria-hidden />
            Choose file
          </span>
        </label>
        <p className="doc-upload-field__filename" title={file?.name || undefined}>
          {file?.name || emptyHint}
        </p>
      </div>
      {hint && <p className="doc-upload-field__hint">{hint}</p>}
    </div>
  );
}
