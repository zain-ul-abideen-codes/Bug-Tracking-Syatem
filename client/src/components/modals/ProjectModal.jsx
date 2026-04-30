import { useEffect } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Autocomplete,
  Avatar,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";

export default function ProjectModal({ open, loading, project, users, currentRole, onClose, onSubmit }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const managers = users.filter((record) => ["administrator", "manager"].includes(record.role));
  const qaEngineers = users.filter((record) => record.role === "qa");
  const developers = users.filter((record) => record.role === "developer");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      title: project?.title || "",
      description: project?.description || "",
      manager: project?.manager || null,
      qaEngineers: project?.qaEngineers || [],
      developers: project?.developers || [],
    },
  });

  useEffect(() => {
    reset({
      title: project?.title || "",
      description: project?.description || "",
      manager: project?.manager || null,
      qaEngineers: project?.qaEngineers || [],
      developers: project?.developers || [],
    });
  }, [project, reset, open]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 7 }}>
        {project ? "Edit Project" : "Create Project"}
        <IconButton sx={{ position: "absolute", right: 8, top: 8 }} onClick={onClose} disabled={loading}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="title"
              control={control}
              rules={{ required: "Project title is required." }}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Project Title" error={Boolean(errors.title)} helperText={errors.title?.message} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="manager"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={managers}
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  getOptionLabel={(option) => option?.name || ""}
                  renderInput={(params) => <TextField {...params} label="Manager" />}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => <TextField {...field} fullWidth multiline minRows={4} label="Description" />}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="qaEngineers"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={qaEngineers}
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  getOptionLabel={(option) => option?.name || ""}
                  slotProps={{
                    paper: {
                      sx: {
                        minWidth: 320,
                      },
                    },
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, width: "100%" }}>
                        <Avatar sx={{ width: 28, height: 28, flexShrink: 0 }}>{option.name?.charAt(0)}</Avatar>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            lineHeight: 1.35,
                          }}
                        >
                          {option.name}
                        </Typography>
                      </Stack>
                    </li>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option._id}
                        avatar={<Avatar>{option.name?.charAt(0)}</Avatar>}
                        label={option.name}
                        variant="outlined"
                        sx={{
                          maxWidth: "100%",
                          height: "auto",
                          "& .MuiChip-label": {
                            display: "block",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            lineHeight: 1.3,
                            py: 0.75,
                          },
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => <TextField {...params} label="QA Engineers" helperText="Select one or more QA engineers for this project." />}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="developers"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={developers}
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  getOptionLabel={(option) => option?.name || ""}
                  slotProps={{
                    paper: {
                      sx: {
                        minWidth: 320,
                      },
                    },
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, width: "100%" }}>
                        <Avatar sx={{ width: 28, height: 28, flexShrink: 0 }}>{option.name?.charAt(0)}</Avatar>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            lineHeight: 1.35,
                          }}
                        >
                          {option.name}
                        </Typography>
                      </Stack>
                    </li>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option._id}
                        avatar={<Avatar>{option.name?.charAt(0)}</Avatar>}
                        label={option.name}
                        variant="outlined"
                        sx={{
                          maxWidth: "100%",
                          height: "auto",
                          "& .MuiChip-label": {
                            display: "block",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            lineHeight: 1.3,
                            py: 0.75,
                          },
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => <TextField {...params} label="Developers" helperText="Select one or more developers for this project." />}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!isValid || loading}
          onClick={handleSubmit((values) =>
            onSubmit({
              title: values.title,
              description: values.description,
              manager: values.manager?._id || null,
              qaEngineers: values.qaEngineers.map((member) => member._id),
              developers: values.developers.map((member) => member._id),
              currentRole,
            }),
          )}
        >
          {loading ? "Saving..." : "Save Project"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
