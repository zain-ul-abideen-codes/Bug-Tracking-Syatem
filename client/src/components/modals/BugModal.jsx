import { useEffect, useMemo, useRef, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";

const statusByType = {
  bug: ["new", "started", "resolved", "reopened"],
  feature: ["new", "started", "completed", "reopened"],
};

export default function BugModal({
  open,
  loading,
  issue,
  projects,
  developers,
  role,
  submitError,
  onClose,
  onSubmit,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const fileRef = useRef(null);
  const [fileError, setFileError] = useState("");
  const [preview, setPreview] = useState(issue?.screenshot || "");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      title: issue?.title || "",
      type: issue?.type || "bug",
      status: issue?.status || "new",
      project: issue?.project || null,
      assignedDeveloper: issue?.assignedDeveloper || null,
      deadline: issue?.deadline ? dayjs(issue.deadline) : null,
      description: issue?.description || "",
      screenshot: null,
    },
  });

  useEffect(() => {
    reset({
      title: issue?.title || "",
      type: issue?.type || "bug",
      status: issue?.status || "new",
      project: issue?.project || null,
      assignedDeveloper: issue?.assignedDeveloper || null,
      deadline: issue?.deadline ? dayjs(issue.deadline) : null,
      description: issue?.description || "",
      screenshot: null,
    });
    setPreview(issue?.screenshot || "");
    setFileError("");
  }, [issue, open, reset]);

  const selectedType = watch("type");
  const selectedProject = watch("project");

  useEffect(() => {
    if (!statusByType[selectedType]?.includes(watch("status"))) {
      setValue("status", statusByType[selectedType][0], { shouldValidate: true });
    }
  }, [selectedType, setValue, watch]);

  const availableDevelopers = useMemo(() => {
    if (!selectedProject?.developers?.length) {
      return developers;
    }

    const allowedIds = new Set(selectedProject.developers.map((member) => member._id));
    return developers.filter((member) => allowedIds.has(member._id));
  }, [developers, selectedProject]);

  const handleFileSelection = (file) => {
    if (!file) {
      return;
    }

    const allowedTypes = ["image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setFileError("Only .png and .gif files are allowed.");
      return;
    }

    setFileError("");
    setValue("screenshot", file, { shouldValidate: true });
    setPreview(URL.createObjectURL(file));
  };

  const buildPayload = (values) => {
    const isDeveloper = role === "developer";

    if (isDeveloper) {
      return {
        status: values.status,
      };
    }

    const payload = new FormData();
    payload.append("title", values.title);
    payload.append("type", values.type);
    payload.append("status", values.status);
    payload.append("project", values.project?._id || "");
    payload.append("description", values.description || "");
    if (values.assignedDeveloper?._id) {
      payload.append("assignedDeveloper", values.assignedDeveloper._id);
    }
    if (values.deadline) {
      payload.append("deadline", values.deadline.toISOString());
    }
    if (values.screenshot) {
      payload.append("screenshot", values.screenshot);
    }
    return payload;
  };

  const isDeveloperOnly = role === "developer";

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 7 }}>
        {issue ? (isDeveloperOnly ? "Update Issue Status" : "Edit Issue") : "Create Issue"}
        <IconButton sx={{ position: "absolute", right: 8, top: 8 }} onClick={onClose} disabled={loading}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {!isDeveloperOnly ? (
            <>
              <Grid item xs={12} md={6}>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: "Title is required." }}
                  render={({ field }) => <TextField {...field} fullWidth label="Title" error={Boolean(errors.title)} helperText={errors.title?.message} />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: "Type is required." }}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Type">
                      <MenuItem value="bug">
                        <Stack direction="row" spacing={1} alignItems="center"><BugReportRoundedIcon fontSize="small" /> <span>Bug</span></Stack>
                      </MenuItem>
                      <MenuItem value="feature">
                        <Stack direction="row" spacing={1} alignItems="center"><AutoAwesomeRoundedIcon fontSize="small" /> <span>Feature</span></Stack>
                      </MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
            </>
          ) : null}

          <Grid item xs={12} md={isDeveloperOnly ? 12 : 6}>
            <Controller
              name="status"
              control={control}
              rules={{ required: "Status is required." }}
              render={({ field }) => (
                <TextField {...field} select fullWidth label="Status">
                  {statusByType[selectedType].map((status) => (
                    <MenuItem key={status} value={status} sx={{ textTransform: "capitalize" }}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {!isDeveloperOnly ? (
            <>
              <Grid item xs={12} md={6}>
                <Controller
                  name="project"
                  control={control}
                  rules={{ required: "Project is required." }}
                  render={({ field }) => (
                    <Autocomplete
                      options={projects}
                      value={field.value}
                      onChange={(_, value) => field.onChange(value)}
                      getOptionLabel={(option) => option?.title || ""}
                      slotProps={{
                        paper: {
                          sx: {
                            minWidth: 320,
                          },
                        },
                      }}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: "normal",
                              wordBreak: "keep-all",
                              overflowWrap: "break-word",
                              lineHeight: 1.35,
                              py: 0.5,
                            }}
                          >
                            {option.title}
                          </Typography>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Project"
                          fullWidth
                          error={Boolean(errors.project)}
                          helperText={errors.project?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="assignedDeveloper"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={availableDevelopers}
                      value={field.value}
                      onChange={(_, value) => field.onChange(value)}
                      getOptionLabel={(option) => option?.name || ""}
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
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Assigned Developer"
                          helperText={selectedProject ? "Only developers assigned to the selected project are shown." : "Select a developer to take ownership of this issue."}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="deadline"
                  control={control}
                  render={({ field }) => <DatePicker label="Deadline" value={field.value} onChange={field.onChange} slotProps={{ textField: { fullWidth: true } }} />}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth multiline minRows={4} label="Description" />}
                />
              </Grid>
              <Grid item xs={12}>
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleFileSelection(event.dataTransfer.files?.[0]);
                  }}
                  sx={{
                    p: 2.5,
                    border: (theme) => `2px dashed ${theme.palette.divider}`,
                    borderRadius: 2.5,
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  <Stack spacing={1.5} alignItems="center">
                    <ImageRoundedIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography fontWeight={600}>Upload Screenshot</Typography>
                    <Typography color="text.secondary">Drag and drop a .png or .gif file, or click to browse.</Typography>
                    {preview ? (
                      <Box component="img" src={preview} alt="Screenshot preview" sx={{ maxHeight: 120, borderRadius: 2 }} />
                    ) : null}
                  </Stack>
                  <input
                    ref={fileRef}
                    type="file"
                    hidden
                    accept=".png,.gif,image/png,image/gif"
                    onChange={(event) => handleFileSelection(event.target.files?.[0])}
                  />
                </Box>
                {fileError ? <Alert severity="error" sx={{ mt: 1.5 }}>{fileError}</Alert> : null}
              </Grid>
            </>
          ) : null}
        </Grid>
        {submitError ? <Alert severity="error" sx={{ mt: 2 }}>{submitError}</Alert> : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" disabled={!isValid || loading || Boolean(fileError)} onClick={handleSubmit((values) => onSubmit(buildPayload(values)))}>
          {loading ? "Saving..." : "Save Issue"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
