import { createTheme } from "@mui/material/styles";

const pastelTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#ec6f9f",
      light: "#f8b3ca",
      dark: "#c74878",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#a978d6",
      light: "#d9b9ef",
      dark: "#7b4aaa",
      contrastText: "#ffffff",
    },
    success: {
      main: "#45a37c",
    },
    warning: {
      main: "#d7993d",
    },
    background: {
      default: "#fff7fb",
      paper: "#ffffff",
    },
    error: {
      main: "#dc5a67",
    },
    text: {
      primary: "#231f2d",
      secondary: "#706878",
    },
  },
  typography: {
    fontFamily: '"Outfit", "Segoe UI", system-ui, sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: 0,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at 12% 6%, rgba(244, 143, 177, 0.22), transparent 32%), radial-gradient(circle at 88% 10%, rgba(206, 147, 216, 0.2), transparent 30%), #fff7fb",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          minHeight: 42,
          fontWeight: 800,
        },
        contained: {
          boxShadow: "0 14px 30px rgba(236, 111, 159, 0.28)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiSelect: {
      defaultProps: {
        size: "small",
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});

export default pastelTheme;
