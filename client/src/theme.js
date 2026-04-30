import { alpha, createTheme } from "@mui/material/styles";

const buildPalette = (mode) => ({
  mode,
  primary: { main: "#1976D2" },
  secondary: { main: "#9C27B0" },
  error: { main: "#D32F2F" },
  warning: { main: "#ED6C02" },
  success: { main: "#2E7D32" },
  background: {
    default: mode === "light" ? "#F4F6F8" : "#0F172A",
    paper: mode === "light" ? "#FFFFFF" : "#162033",
  },
  text: {
    primary: mode === "light" ? "#0F172A" : "#F8FAFC",
    secondary: mode === "light" ? "#475569" : "#CBD5E1",
  },
});

export function getAppTheme(mode = "light") {
  const palette = buildPalette(mode);

  return createTheme({
    palette,
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", sans-serif',
      h4: {
        fontWeight: 700,
        letterSpacing: "-0.02em",
      },
      h5: {
        fontWeight: 700,
      },
      h6: {
        fontWeight: 700,
      },
      button: {
        fontWeight: 700,
        textTransform: "none",
      },
    },
    shadows: [
      "none",
      "0px 2px 8px rgba(15, 23, 42, 0.05)",
      "0px 8px 20px rgba(15, 23, 42, 0.07)",
      "0px 12px 28px rgba(15, 23, 42, 0.08)",
      "0px 18px 40px rgba(15, 23, 42, 0.10)",
      "0px 24px 56px rgba(15, 23, 42, 0.12)",
      ...Array(19).fill("0px 24px 56px rgba(15, 23, 42, 0.12)"),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background:
              mode === "light"
                ? "radial-gradient(circle at top left, rgba(25,118,210,0.10), transparent 20%), radial-gradient(circle at bottom right, rgba(156,39,176,0.08), transparent 20%), #F4F6F8"
                : "radial-gradient(circle at top left, rgba(25,118,210,0.16), transparent 20%), radial-gradient(circle at bottom right, rgba(156,39,176,0.12), transparent 20%), #0F172A",
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
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${alpha(palette.text.primary, mode === "light" ? 0.06 : 0.12)}`,
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
            backdropFilter: "blur(12px)",
          },
        },
      },
    },
  });
}
