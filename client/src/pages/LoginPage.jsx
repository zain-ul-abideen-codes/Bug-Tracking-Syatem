import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { Alert, Box, Container, Paper, Stack, Typography } from "@mui/material";
import useAuth from "../hooks/useAuth";
import InputField from "../components/common/InputField";
import Button from "../components/common/Button";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [serverError, setServerError] = useState("");
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    const authMessage = sessionStorage.getItem("auth_message");
    if (location.state?.sessionExpired || authMessage) {
      setServerError(authMessage || "Your session expired. Please log in again.");
      sessionStorage.removeItem("auth_message");
    }
  }, [location.state]);

  const errors = useMemo(() => {
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    if (!form.password.trim()) nextErrors.password = "Password is required.";
    return nextErrors;
  }, [form]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (Object.keys(errors).length) return;

    try {
      setServerError("");
      await login(form);
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(error.response?.data?.message || "Login failed.");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ minHeight: "100vh", display: "grid", placeItems: "center", py: 4 }}>
      <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 8 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" } }}>
          <Box
            sx={{
              p: { xs: 4, md: 6 },
              background: "linear-gradient(145deg, #103c46, #1f6f78)",
              color: "white",
              display: "grid",
              gap: 2,
              alignContent: "center",
            }}
          >
            <Typography sx={{ textTransform: "uppercase", letterSpacing: "0.18em", opacity: 0.78 }}>
              Track. Triage. Deliver.
            </Typography>
            <Typography variant="h3">Beautiful workflow control for modern teams.</Typography>
            <Typography sx={{ maxWidth: 520, color: "rgba(255,255,255,0.8)" }}>
              Manage projects, report bugs, collaborate through issue threads, and monitor delivery through role-based dashboards.
            </Typography>
          </Box>
          <Box sx={{ p: { xs: 4, md: 6 }, display: "grid", alignContent: "center" }}>
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 52, height: 52, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "rgba(31,111,120,0.1)", color: "primary.main" }}>
                  <LockRoundedIcon />
                </Box>
                <Box>
                  <Typography variant="h4">Bug Tracking System</Typography>
                  <Typography color="text.secondary">Sign in to continue</Typography>
                </Box>
              </Stack>
              <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 1 }}>
                <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
                <InputField
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  error={errors.password}
                />
                {serverError ? <Alert severity="error">{serverError}</Alert> : null}
                <Box sx={{ pt: 1 }}>
                  <Button type="submit">Sign In</Button>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
