import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

export default function PasswordResetModal({ open, loading, onClose, onSubmit }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  useEffect(() => {
    if (open) {
      reset({ password: "", confirmPassword: "" });
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs" fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 7 }}>
        Reset Password
        <IconButton sx={{ position: "absolute", right: 8, top: 8 }} onClick={onClose} disabled={loading}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <Controller
              name="password"
              control={control}
              rules={{
                required: "Password is required.",
                minLength: { value: 6, message: "Password must be at least 6 characters." },
              }}
              render={({ field }) => (
                <TextField {...field} fullWidth type="password" label="New Password" error={Boolean(errors.password)} helperText={errors.password?.message} />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="confirmPassword"
              control={control}
              rules={{
                required: "Please confirm the password.",
                validate: (value) => value === password || "Passwords do not match.",
              }}
              render={({ field }) => (
                <TextField {...field} fullWidth type="password" label="Confirm Password" error={Boolean(errors.confirmPassword)} helperText={errors.confirmPassword?.message} />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" disabled={!isValid || loading} onClick={handleSubmit(({ password: nextPassword }) => onSubmit(nextPassword))}>
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
