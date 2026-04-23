import React from "react";
import { Box, Paper, Typography } from "@mui/material";

export default function AuthLayout({ title, children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ffe4f3 0%, #f3e5f5 50%, #fff7fb 100%)",
        px: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          maxWidth: 420,
          width: "100%",
          p: 4,
          borderRadius: 4,
          backdropFilter: "blur(10px)",
        }}
      >
        <Typography
          variant="h4"
          align="center"
          sx={{ mb: 3, color: "primary.main" }}
        >
          {title}
        </Typography>
        {children}
      </Paper>
    </Box>
  );
}