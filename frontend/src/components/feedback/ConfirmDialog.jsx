import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import StampButton from "../editorial/StampButton";

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {{ title: string, description?: string, confirmLabel: string, cancelLabel?: string, danger?: boolean } | null} props.options
 * @param {(ok: boolean) => void} props.onClose
 */
export default function ConfirmDialog({ open, options, onClose }) {
  if (!options) return null;
  const {
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancel",
    danger = false,
  } = options;

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") onClose(false);
      }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 24, pr: 4 }}>
        {title}
      </DialogTitle>
      {description ? (
        <DialogContent sx={{ fontFamily: "var(--sans)", color: "var(--mute)", fontSize: 15, lineHeight: 1.55, pt: 0 }}>
          {description}
        </DialogContent>
      ) : null}
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, justifyContent: "flex-end" }}>
        <StampButton variant="ghost" onClick={() => onClose(false)}>
          {cancelLabel}
        </StampButton>
        <StampButton
          variant={danger ? "quiet" : "primary"}
          onClick={() => onClose(true)}
          className={danger ? "confirm-dialog__danger" : ""}
        >
          {confirmLabel}
        </StampButton>
      </DialogActions>
    </Dialog>
  );
}
