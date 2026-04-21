import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
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
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Track. Triage. Deliver.</p>
        <h1>Bug Tracking System</h1>
        <p className="auth-copy">Secure role-based workflow for administrators, managers, QA engineers, and developers.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
          <InputField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          {serverError ? <p className="server-error">{serverError}</p> : null}
          <Button type="submit">Sign In</Button>
        </form>
      </div>
    </div>
  );
}
