import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeModeProvider } from "./context/ThemeModeContext";
import { NotificationProvider } from "./context/NotificationContext";
import "./styles/main.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeModeProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BrowserRouter>
          <NotificationProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </NotificationProvider>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeModeProvider>
  </React.StrictMode>
);
