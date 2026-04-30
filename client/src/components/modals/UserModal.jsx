import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

const roles = ["administrator", "manager", "qa", "developer"];

export default function UserModal({ user, open, loading, onClose, onSubmit }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "developer",
    },
  });

  useEffect(() => {
    reset({
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "developer",
    });
  }, [user, reset, open]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 7 }}>
        {user ? "Edit User" : "Add User"}
        <IconButton sx={{ position: "absolute", right: 8, top: 8 }} onClick={onClose} disabled={loading}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="name"
              control={control}
              rules={{ required: "Name is required." }}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Name" error={Boolean(errors.name)} helperText={errors.name?.message} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Email is required.",
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: "Enter a valid email address.",
                },
              }}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Email" error={Boolean(errors.email)} helperText={errors.email?.message} />
              )}
            />
          </Grid>
          {!user ? (
            <Grid item xs={12}>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: "Password is required.",
                  minLength: { value: 6, message: "Password must be at least 6 characters." },
                }}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Password" type="password" error={Boolean(errors.password)} helperText={errors.password?.message} />
                )}
              />
            </Grid>
          ) : null}
          <Grid item xs={12}>
            <Controller
              name="role"
              control={control}
              rules={{ required: "Role is required." }}
              render={({ field }) => (
                <TextField {...field} select fullWidth label="Role" error={Boolean(errors.role)} helperText={errors.role?.message}>
                  {roles.map((role) => (
                    <MenuItem key={role} value={role} sx={{ textTransform: "capitalize" }}>
                      {role}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" disabled={!isValid || loading} onClick={handleSubmit(onSubmit)}>
          {loading ? "Saving..." : "Save User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
