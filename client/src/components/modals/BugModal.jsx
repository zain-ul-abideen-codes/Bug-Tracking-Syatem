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
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { suggestBugPriority } from "../../api/bugsApi";
import AIQuickReport from "../bugs/AIQuickReport";

const statusByType = {
  bug: ["new", "started", "resolved", "reopened"],
  feature: ["new", "started", "completed", "reopened"],
};

const priorityOptions = ["Critical", "High", "Medium", "Low"];

const priorityColors = {
  Critical: "#EF4444",
  High: "#F97316",
  Medium: "#EAB308",
  Low: "#22C55E",
};

const priorityKeywordRules = [
  {
    priority: "Critical",
    confidence: 90,
    keywords: [
      "crash",
      "down",
      "not working",
      "broken",
      "error",
      "fail",
      "login",
      "auth",
      "payment",
      "data loss",
      "security",
      "hack",
      "vulnerability",
      "freeze",
      "blank screen",
      "cannot access",
    ],
  },
  {
    priority: "High",
    confidence: 86,
    keywords: ["slow", "bug", "wrong", "incorrect", "missing", "not loading", "stuck", "issue", "problem", "not working for some"],
  },
  {
    priority: "Medium",
    confidence: 80,
    keywords: ["sometimes", "occasionally", "minor issue", "small bug", "not always", "workaround", "partially"],
  },
  {
    priority: "Low",
    confidence: 74,
    keywords: ["typo", "color", "font", "spacing", "alignment", "ui", "cosmetic", "suggestion", "enhancement", "improve"],
  },
];

const suggestPriorityLocally = ({ title, description }) => {
  const text = `${title} ${description}`.toLowerCase();

  for (const rule of priorityKeywordRules) {
    const matchedKeyword = rule.keywords.find((keyword) => text.includes(keyword));
    if (matchedKeyword) {
      return {
        priority: rule.priority,
        confidence: rule.confidence,
        reason: `Detected "${matchedKeyword}" in the issue details, so ${rule.priority.toLowerCase()} priority is suggested.`,
      };
    }
  }

  return {
    priority: "Medium",
    confidence: 78,
    reason: "No stronger priority keywords were detected, so medium priority is suggested.",
  };
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
  const [prioritySuggestion, setPrioritySuggestion] = useState(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");
  const [createMode, setCreateMode] = useState("manual");
  const [acceptedSuggestion, setAcceptedSuggestion] = useState(
    issue?.prioritySource === "ai"
      ? {
          priority: issue?.aiSuggestedPriority,
          confidence: issue?.aiConfidence,
          reason: issue?.aiReason,
        }
      : null
  );
  const lastSuggestionKeyRef = useRef("");
  const suggestionTimerRef = useRef(null);

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
      priority: issue?.priority || issue?.aiSuggestedPriority || "Medium",
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
      priority: issue?.priority || issue?.aiSuggestedPriority || "Medium",
      project: issue?.project || null,
      assignedDeveloper: issue?.assignedDeveloper || null,
      deadline: issue?.deadline ? dayjs(issue.deadline) : null,
      description: issue?.description || "",
      screenshot: null,
    });
    setPreview(issue?.screenshot || "");
    setFileError("");
    setPrioritySuggestion(null);
    setSuggestionError("");
    setSuggestionLoading(false);
    setCreateMode("manual");
    setAcceptedSuggestion(
      issue?.prioritySource === "ai"
        ? {
            priority: issue?.aiSuggestedPriority,
            confidence: issue?.aiConfidence,
            reason: issue?.aiReason,
          }
        : null
    );
    lastSuggestionKeyRef.current = "";
  }, [issue, open, reset]);

  const selectedType = watch("type");
  const selectedProject = watch("project");
  const watchedTitle = watch("title");
  const watchedDescription = watch("description");
  const isDeveloperOnly = role === "developer";
  const canUseAiQuickReport = !issue && !isDeveloperOnly;

  useEffect(() => {
    if (!statusByType[selectedType]?.includes(watch("status"))) {
      setValue("status", statusByType[selectedType][0], { shouldValidate: true });
    }
  }, [selectedType, setValue, watch]);

  useEffect(() => {
    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current);
    }

    if (issue || isDeveloperOnly || !watchedTitle?.trim() || !watchedDescription?.trim()) {
      return undefined;
    }

    suggestionTimerRef.current = setTimeout(() => {
      void handlePrioritySuggestion();
    }, 900);

    return () => {
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
    };
  }, [issue, isDeveloperOnly, watchedDescription, watchedTitle]);

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
    payload.append("priority", values.priority);
    payload.append("prioritySource", acceptedSuggestion ? "ai" : "manual");
    if (acceptedSuggestion) {
      payload.append("aiSuggestedPriority", acceptedSuggestion.priority);
      payload.append("aiConfidence", acceptedSuggestion.confidence);
      payload.append("aiReason", acceptedSuggestion.reason);
    }
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

  const handlePrioritySuggestion = async () => {
    if (issue || isDeveloperOnly) {
      return;
    }

    const title = watchedTitle?.trim();
    const description = watchedDescription?.trim();
    if (!title || !description) {
      return;
    }

    const nextSuggestionKey = `${title}::${description}`;
    if (nextSuggestionKey === lastSuggestionKeyRef.current) {
      return;
    }

    lastSuggestionKeyRef.current = nextSuggestionKey;
    setSuggestionLoading(true);
    setSuggestionError("");
    setPrioritySuggestion(null);

    try {
      const suggestion = await suggestBugPriority({ title, description });
      setPrioritySuggestion(suggestion);
      setAcceptedSuggestion(suggestion);
      setValue("priority", suggestion.priority, { shouldValidate: true, shouldDirty: true });
    } catch (_error) {
      const fallbackSuggestion = suggestPriorityLocally({ title, description });
      setPrioritySuggestion(fallbackSuggestion);
      setAcceptedSuggestion(fallbackSuggestion);
      setValue("priority", fallbackSuggestion.priority, { shouldValidate: true, shouldDirty: true });
      setSuggestionError("");
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (!prioritySuggestion) {
      return;
    }
    setValue("priority", prioritySuggestion.priority, { shouldValidate: true, shouldDirty: true });
    setAcceptedSuggestion(prioritySuggestion);
    setPrioritySuggestion(null);
  };

  const handleManualPriorityChange = (field, value) => {
    field.onChange(value);
    setAcceptedSuggestion(null);
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 7 }}>
        {issue ? (isDeveloperOnly ? "Update Issue Status" : "Edit Issue") : "Create Issue"}
        <IconButton sx={{ position: "absolute", right: 8, top: 8 }} onClick={onClose} disabled={loading}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {canUseAiQuickReport ? (
          <ToggleButtonGroup
            exclusive
            value={createMode}
            onChange={(_, value) => {
              if (value) {
                setCreateMode(value);
              }
            }}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="manual">Manual Form</ToggleButton>
            <ToggleButton value="ai">AI Quick Report</ToggleButton>
          </ToggleButtonGroup>
        ) : null}

        {createMode === "ai" && canUseAiQuickReport ? (
          <AIQuickReport projects={projects} loading={loading} role={role} onSubmit={onSubmit} />
        ) : (
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {!isDeveloperOnly ? (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: "Title is required." }}
                  render={({ field }) => <TextField {...field} fullWidth label="Title" error={Boolean(errors.title)} helperText={errors.title?.message} />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: "Type is required." }}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Type">
                      <MenuItem value="bug">
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><BugReportRoundedIcon fontSize="small" /> <span>Bug</span></Stack>
                      </MenuItem>
                      <MenuItem value="feature">
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><AutoAwesomeRoundedIcon fontSize="small" /> <span>Feature</span></Stack>
                      </MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
            </>
          ) : null}

          <Grid size={{ xs: 12, md: isDeveloperOnly ? 12 : 6 }}>
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
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="priority"
                  control={control}
                  rules={{ required: "Priority is required." }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Priority"
                      onChange={(event) => handleManualPriorityChange(field, event.target.value)}
                      error={Boolean(errors.priority)}
                      helperText={errors.priority?.message}
                      InputProps={{
                        endAdornment: acceptedSuggestion ? (
                          <Chip
                            size="small"
                            label="AI Suggested"
                            color="primary"
                            sx={{ mr: 3, fontWeight: 700 }}
                          />
                        ) : null,
                      }}
                    >
                      {priorityOptions.map((priority) => (
                        <MenuItem key={priority} value={priority}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                bgcolor: priorityColors[priority],
                              }}
                            />
                            <span>{priority}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                {suggestionLoading ? (
                  <Stack direction="row" spacing={1} sx={{ mt: 1.25, alignItems: "center" }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      AI is analyzing priority...
                    </Typography>
                  </Stack>
                ) : null}
                {suggestionError ? (
                  <Alert severity="info" variant="outlined" sx={{ mt: 1.25 }}>
                    {suggestionError}
                  </Alert>
                ) : null}
                {prioritySuggestion ? (
                  <Box
                    sx={{
                      mt: 1.25,
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                        <Chip
                          size="small"
                          label={prioritySuggestion.priority}
                          sx={{
                            color: "#fff",
                            fontWeight: 700,
                            bgcolor: priorityColors[prioritySuggestion.priority],
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {prioritySuggestion.confidence}% confident
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                        {prioritySuggestion.reason}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" onClick={handleAcceptSuggestion}>
                          Accept Suggestion
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => {
                            setPrioritySuggestion(null);
                            setAcceptedSuggestion(null);
                          }}
                        >
                          Ignore
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                ) : null}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
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
              <Grid size={12}>
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
                          <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, width: "100%", alignItems: "center" }}>
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
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="deadline"
                  control={control}
                  render={({ field }) => <DatePicker label="Deadline" value={field.value} onChange={field.onChange} slotProps={{ textField: { fullWidth: true } }} />}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      minRows={4}
                      label="Description"
                      onBlur={(event) => {
                        field.onBlur();
                        void handlePrioritySuggestion();
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
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
                  <Stack spacing={1.5} sx={{ alignItems: "center" }}>
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
        )}
        {submitError ? <Alert severity="error" sx={{ mt: 2 }}>{submitError}</Alert> : null}
      </DialogContent>
      {createMode === "ai" && canUseAiQuickReport ? (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>Cancel</Button>
        </DialogActions>
      ) : (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="contained" disabled={!isValid || loading || Boolean(fileError)} onClick={handleSubmit((values) => onSubmit(buildPayload(values)))}>
            {loading ? "Saving..." : "Save Issue"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
