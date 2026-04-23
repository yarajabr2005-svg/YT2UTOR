import React from "react";
import { Button } from "@mui/material";

export default function PinkButton({ children, ...props }) {
  return (
    <Button
      variant="contained"
      color="primary"
      fullWidth
      sx={{
        py: 1.2,
        fontWeight: 600,
        boxShadow: "0 8px 20px rgba(244, 143, 177, 0.35)",
        ":hover": {
          boxShadow: "0 10px 24px rgba(244, 143, 177, 0.5)",
        },
      }}
      {...props}
    >
      {children}
    </Button>
  );
}