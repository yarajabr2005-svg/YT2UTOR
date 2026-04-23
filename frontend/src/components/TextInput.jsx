import React from "react";
import { TextField } from "@mui/material";

export default function TextInput(props) {
  return (
    <TextField
      fullWidth
      margin="normal"
      variant="outlined"
      {...props}
      InputProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: "#ffffff",
        },
      }}
    />
  );
}