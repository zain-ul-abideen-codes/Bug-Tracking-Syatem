import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { getAppTheme } from "../theme";

const STORAGE_KEY = "bugtracker-pro-color-mode";

const ThemeModeContext = createContext({
  mode: "light",
  toggleColorMode: () => {},
});

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || "light");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((current) => (current === "light" ? "dark" : "light"));
      },
    }),
    [mode],
  );

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
