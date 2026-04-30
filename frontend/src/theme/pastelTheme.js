import { createTheme } from "@mui/material/styles";

/**
 * Editorial soft-modernist theme. The MUI surface is a thin bridge —
 * tokens.css owns the visual language. We override only what MUI insists
 * on rendering itself (buttons, paper, inputs, chips).
 */
const pastelTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#231f2d",
      light: "#3a3445",
      dark: "#0f0c18",
      contrastText: "#fff7fb",
    },
    secondary: {
      main: "#ec6f9f",
      light: "#f8b3ca",
      dark: "#c74878",
      contrastText: "#ffffff",
    },
    success: { main: "#16824f" },
    warning: { main: "#b97826" },
    error: { main: "#c43c4d" },
    background: {
      default: "#fff7fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#231f2d",
      secondary: "#706878",
    },
    divider: "rgba(35,31,45,0.14)",
  },
  typography: {
    fontFamily: '"DM Sans", "Helvetica Neue", system-ui, sans-serif',
    h1: { fontFamily: '"Newsreader", Georgia, serif', fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.02 },
    h2: { fontFamily: '"Newsreader", Georgia, serif', fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.05 },
    h3: { fontFamily: '"Newsreader", Georgia, serif', fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.1 },
    h4: { fontFamily: '"Newsreader", Georgia, serif', fontWeight: 500, letterSpacing: 0 },
    h5: { fontWeight: 600, letterSpacing: "-0.005em" },
    h6: { fontWeight: 600, letterSpacing: 0 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 11 },
    body1: { fontSize: 15, lineHeight: 1.55 },
    body2: { fontSize: 13.5, lineHeight: 1.55 },
    caption: { fontSize: 12, color: "#706878" },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.01em" },
  },
  shape: { borderRadius: 4 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "#fff7fb",
          color: "#231f2d",
          fontSynthesis: "none",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          boxShadow: "none",
          minHeight: 42,
          paddingInline: 18,
          fontWeight: 600,
          "&:hover": { boxShadow: "none" },
        },
        contained: { boxShadow: "none" },
        outlined: { borderWidth: 1 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", borderRadius: 4 },
      },
    },
    MuiTextField: { defaultProps: { variant: "standard", size: "small" } },
    MuiSelect: { defaultProps: { size: "small", variant: "standard" } },
    MuiInput: {
      styleOverrides: {
        root: {
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 15,
          "&:before": { borderBottomColor: "rgba(35,31,45,0.32)" },
          "&:hover:not(.Mui-disabled, .Mui-error):before": { borderBottomColor: "#231f2d" },
          "&:after": { borderBottomColor: "#ec6f9f" },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: '"Newsreader", Georgia, serif',
          fontStyle: "normal",
          fontWeight: 500,
          color: "#a05478",
          fontSize: 14,
          "&.Mui-focused": { color: "#231f2d" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontWeight: 600,
          letterSpacing: "0.04em",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: "auto" },
        indicator: { backgroundColor: "#231f2d", height: 1 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 36,
          padding: "10px 0",
          marginRight: 28,
          textTransform: "none",
          fontFamily: '"Newsreader", Georgia, serif',
          fontWeight: 500,
          fontSize: 17,
          letterSpacing: 0,
          color: "#706878",
          "&.Mui-selected": { color: "#231f2d", fontStyle: "normal", fontWeight: 600 },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontFamily: '"DM Sans", system-ui, sans-serif',
          border: "1px solid rgba(35,31,45,0.14)",
        },
        standardError: { background: "rgba(196,60,77,0.06)", color: "#231f2d" },
        standardSuccess: { background: "rgba(22,130,79,0.06)", color: "#231f2d" },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontFamily: '"Newsreader", Georgia, serif',
          fontWeight: 500,
          letterSpacing: 0,
          backgroundColor: "rgba(35,31,45,0.08)",
          color: "#231f2d",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: "rgba(35,31,45,0.08)", height: 1 },
        bar: { backgroundColor: "#ec6f9f" },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: "rgba(35,31,45,0.14)" } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          borderRadius: 4,
          border: "1px solid rgba(35,31,45,0.12)",
          boxShadow: "0 20px 60px rgba(35, 31, 45, 0.12)",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { padding: "20px 24px 0", fontFamily: '"Newsreader", Georgia, serif' },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { padding: "8px 24px 0" },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: "16px 20px" },
      },
    },
  },
});

export default pastelTheme;
