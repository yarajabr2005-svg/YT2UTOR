import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import AppRouter from "./router/AppRouter";
import { AuthProvider } from "./context/AuthContext";
import { FeedbackProvider } from "./context/FeedbackContext";
import pastelTheme from "./theme/pastelTheme";
import "./theme/tokens.css";
import "./index.css";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={pastelTheme}>
      <FeedbackProvider>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </BrowserRouter>
      </FeedbackProvider>
    </ThemeProvider>
  </React.StrictMode>
);
