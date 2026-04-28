import { alpha, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f6f78",
    },
    secondary: {
      main: "#d97706",
    },
    error: {
      main: "#c2410c",
    },
    success: {
      main: "#2f855a",
    },
    background: {
      default: "#f7f5f1",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: `"Inter", "Segoe UI", sans-serif`,
    h3: {
      fontWeight: 800,
      letterSpacing: "-0.03em",
    },
    h4: {
      fontWeight: 800,
      letterSpacing: "-0.03em",
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at top left, rgba(31,111,120,0.15), transparent 24%), radial-gradient(circle at bottom right, rgba(217,119,6,0.16), transparent 28%), #f7f5f1",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: "0 16px 48px rgba(15, 23, 42, 0.08)",
          border: "1px solid rgba(15, 23, 42, 0.06)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 14,
          textTransform: "none",
          fontWeight: 700,
          paddingInline: 18,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: "none",
          background: alpha("#ffffff", 0.88),
          backdropFilter: "blur(14px)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: alpha("#ffffff", 0.82),
          color: "#16202a",
          backdropFilter: "blur(14px)",
          boxShadow: "0 10px 40px rgba(15, 23, 42, 0.08)",
          border: "1px solid rgba(15, 23, 42, 0.06)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: "#334155",
        },
      },
    },
  },
});

export default theme;
