import React from "react";
import { Alert } from "@mui/material";

export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
      {message}
    </Alert>
  );
}