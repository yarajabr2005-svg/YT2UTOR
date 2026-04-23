import { createTheme } from "@mui/material/styles";

const pastelTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#f48fb1", // soft pink
    },
    secondary: {
      main: "#ce93d8", // soft purple
    },
    background: {
      default: "#fff7fb", // very light pink
      paper: "#ffffff",
    },
    error: {
      main: "#e57373",
    },
    text: {
      primary: "#333333",
      secondary: "#6b6b6b",
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: "0.03em",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
  },
});

export default pastelTheme;