import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Fade,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { BugReportRounded, EmailRounded, LockRounded, Visibility, VisibilityOff } from "@mui/icons-material";
import useAuth from "../hooks/useAuth";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [mounted, setMounted] = useState(false);
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    setMounted(true);
    const authMessage = sessionStorage.getItem("auth_message");
    if (location.state?.sessionExpired || authMessage) {
      setServerError(authMessage || "Your session expired. Please sign in again.");
      sessionStorage.removeItem("auth_message");
    }
  }, [location.state]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setServerError("");
      await login(form);
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(error.response?.data?.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        background: "linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)",
      }}
    >
      <Fade in={mounted} timeout={500}>
        <Container maxWidth="sm">
          <Card sx={{ maxWidth: 420, mx: "auto", boxShadow: 8, borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Stack spacing={1.5} alignItems="center" textAlign="center">
                  <Box
                    sx={{
                      width: 70,
                      height: 70,
                      borderRadius: 3,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "primary.main",
                      color: "white",
                    }}
                  >
                    <BugReportRounded sx={{ fontSize: 34 }} />
                  </Box>
                  <Typography variant="h4">BugTracker Pro</Typography>
                  <Typography color="text.secondary">Sign in to continue</Typography>
                </Stack>

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailRounded fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockRounded fontSize="small" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword((current) => !current)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    {serverError ? <Alert severity="error">{serverError}</Alert> : null}
                    <Box>
                      <Button type="submit" fullWidth variant="contained" size="large" disabled={submitting}>
                        {submitting ? (
                          <Stack direction="row" spacing={1.25} justifyContent="center" alignItems="center">
                            <CircularProgress size={20} sx={{ color: "white" }} />
                            <span>Signing In...</span>
                          </Stack>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Fade>
    </Box>
  );
}
