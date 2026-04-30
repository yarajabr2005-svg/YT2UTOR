import React, { useId, useState } from "react";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import { useFeedback } from "../../context/FeedbackContext";
import StampButton from "./StampButton";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_LABEL = "JPEG, PNG, or WebP · max 2MB";

function previewFromFile(file) {
  return URL.createObjectURL(file);
}

/**
 * @param {Object} props
 * @param {string | null | undefined} props.currentUrl — server URL for the saved avatar
 * @param {(file: File) => Promise<unknown>} props.onUpload — POST multipart; should resolve when saved
 * @param {() => void} [props.onUploaded] — optional follow-up (e.g. refetch) after a successful save
 */
export default function ProfilePhotoUpload({ currentUrl, onUpload, onUploaded }) {
  const { notify } = useFeedback();
  const inputId = useId();
  const [preview, setPreview] = useState(null);
  const [localFile, setLocalFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const displaySrc = preview || currentUrl || undefined;

  const validateAndStage = (file) => {
    setError("");
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("File is too large. Maximum size is 2MB.");
      return;
    }
    if (!ACCEPT.includes(file.type)) {
      setError(`Unsupported type. ${ACCEPT_LABEL}.`);
      return;
    }
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return previewFromFile(file);
    });
    setLocalFile(file);
  };

  const onInputChange = (e) => {
    const f = e.target.files?.[0];
    validateAndStage(f);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    validateAndStage(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUpload = async () => {
    if (!localFile) return;
    setBusy(true);
    setError("");
    try {
      await onUpload(localFile);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setLocalFile(null);
      notify.success("Profile photo updated.");
      onUploaded?.();
    } catch (err) {
      const data = err?.response?.data;
      const msg = (data && (data.error || data.detail)) || err?.message || "Upload failed.";
      const s = typeof msg === "string" ? msg : "Upload failed.";
      notify.error(s);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="profile-photo-upload">
      <div
        className="profile-photo-upload__drop"
        onDrop={onDrop}
        onDragOver={onDragOver}
        role="presentation"
      >
        <div className="profile-photo-upload__avatar-wrap">
          {displaySrc ? (
            <img className="profile-photo-upload__img" src={displaySrc} alt="" />
          ) : (
            <div className="profile-photo-upload__placeholder" aria-hidden> </div>
          )}
        </div>
        <div className="profile-photo-upload__actions">
          <input
            id={inputId}
            type="file"
            accept={ACCEPT.join(",")}
            className="profile-photo-upload__file-input"
            onChange={onInputChange}
            disabled={busy}
          />
          <label htmlFor={inputId} className="profile-photo-upload__choose">
            <CloudUploadRoundedIcon sx={{ fontSize: 20 }} aria-hidden />
            Choose photo
          </label>
          <p className="profile-photo-upload__hint">Or drag and drop an image here. {ACCEPT_LABEL}</p>
          {localFile && (
            <StampButton variant="primary" onClick={handleUpload} disabled={busy}>
              {busy ? "Uploading…" : "Save photo"}
            </StampButton>
          )}
        </div>
      </div>
      {error && <p className="feedback-inline-error" role="alert">{error}</p>}
    </div>
  );
}
