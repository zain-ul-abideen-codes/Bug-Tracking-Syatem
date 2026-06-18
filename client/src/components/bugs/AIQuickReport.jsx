import { useEffect, useMemo, useState } from "react";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { parseNaturalBugReport } from "../../api/aiApi";
import { getProjectMembers } from "../../api/projectsApi";

const priorityOptions = ["Critical", "High", "Medium", "Low"];
const typeOptions = ["bug", "feature"];

const priorityColors = {
  Critical: "#EF4444",
  High: "#F97316",
  Medium: "#EAB308",
  Low: "#22C55E",
};

const confidenceConfig = {
  high: { color: "success", label: "AI is confident" },
  medium: { color: "warning", label: "Please review fields" },
  low: { color: "warning", label: "Please verify all fields" },
};

const deadlineDaysByPriority = {
  Critical: 1,
  High: 3,
  Medium: 7,
  Low: 14,
};

const getDeadlineForPriority = (priority) => {
  const date = new Date();
  date.setDate(date.getDate() + (deadlineDaysByPriority[priority] || 7));
  return date.toISOString().split("T")[0];
};

const buildStructuredDescription = (report) =>
  [
    report.description,
    "",
    "Steps to Reproduce:",
    report.stepsToReproduce,
    "",
    "Expected Result:",
    report.expectedResult,
    "",
    "Actual Result:",
    report.actualResult,
  ]
    .filter((line) => line !== undefined && line !== null)
    .join("\n");

export default function AIQuickReport({ projects, loading, role, onSubmit }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [assignedDeveloper, setAssignedDeveloper] = useState(null);
  const [deadline, setDeadline] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [fileError, setFileError] = useState("");
  const [naturalText, setNaturalText] = useState("");
  const [report, setReport] = useState(null);
  const [confidence, setConfidence] = useState("");
  const [generating, setGenerating] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState("");

  const userRole = role === "administrator" ? "admin" : role;
  const canAssign = ["admin", "manager", "qa"].includes(userRole);
  const canSetDeadline = ["admin", "manager", "qa"].includes(userRole);
  const canUploadScreenshot = ["admin", "qa"].includes(userRole);
  const canUseAiQuickReport = ["admin", "manager", "qa"].includes(userRole);
  const confidenceMeta = confidenceConfig[confidence] || confidenceConfig.low;
  const canGenerate = selectedProject?._id && naturalText.trim().length >= 10 && !generating;

  const characterCounter = useMemo(() => `${naturalText.length}/1000 characters`, [naturalText.length]);

  useEffect(() => {
    let active = true;

    const loadProjectMembers = async () => {
      if (!selectedProject?._id) {
        setDevelopers([]);
        setAssignedDeveloper(null);
        return;
      }

      try {
        setMembersLoading(true);
        const data = await getProjectMembers(selectedProject._id);
        if (!active) {
          return;
        }
        setDevelopers(data.developers || []);
        setAssignedDeveloper(null);
      } catch (_error) {
        if (active) {
          setDevelopers([]);
          setAssignedDeveloper(null);
        }
      } finally {
        if (active) {
          setMembersLoading(false);
        }
      }
    };

    loadProjectMembers();
    return () => {
      active = false;
    };
  }, [selectedProject?._id]);

  useEffect(() => {
    return () => {
      if (screenshotPreview) {
        URL.revokeObjectURL(screenshotPreview);
      }
    };
  }, [screenshotPreview]);

  const updateReport = (field, value) => {
    setReport((current) => ({ ...current, [field]: value }));
  };

  const updatePriority = (priority) => {
    updateReport("priority", priority);
    if (canSetDeadline) {
      setDeadline(getDeadlineForPriority(priority));
    }
  };

  const handleScreenshotChange = (file) => {
    if (!file) {
      return;
    }

    const allowedTypes = ["image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setFileError("Only .png and .gif files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size must be less than 5MB.");
      return;
    }

    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
    }
    setFileError("");
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const removeScreenshot = () => {
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
    }
    setScreenshot(null);
    setScreenshotPreview("");
    setFileError("");
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      setError("Select a project and describe the issue before generating.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      const data = await parseNaturalBugReport({
        naturalText: naturalText.trim(),
        projectId: selectedProject._id,
      });
      setReport(data.report);
      setConfidence(data.confidence || data.report?.confidence || "low");
      if (canSetDeadline) {
        setDeadline(getDeadlineForPriority(data.report?.priority));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "AI could not generate the bug report right now.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!report || !selectedProject?._id) {
      return;
    }

    const payload = new FormData();
    payload.append("title", report.title);
    payload.append("type", report.type);
    payload.append("status", "new");
    payload.append("priority", report.priority);
    payload.append("prioritySource", "ai");
    payload.append("aiSuggestedPriority", report.priority);
    payload.append("aiReason", `Generated from natural language report with ${confidence || "low"} confidence.`);
    payload.append("project", selectedProject._id);
    payload.append("description", buildStructuredDescription(report));
    payload.append("aiGenerated", "true");

    if (canAssign && assignedDeveloper?._id) {
      payload.append("assignedDeveloper", assignedDeveloper._id);
    }
    if (canSetDeadline && deadline) {
      payload.append("deadline", new Date(deadline).toISOString());
    }
    if (canUploadScreenshot && screenshot) {
      payload.append("screenshot", screenshot);
    }

    onSubmit(payload);
  };

  if (!canUseAiQuickReport) {
    return (
      <Alert severity="info">
        AI Quick Report is available for Admin, Manager, and QA roles only.
      </Alert>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Autocomplete
            options={projects}
            value={selectedProject}
            onChange={(_, value) => {
              setSelectedProject(value);
              setReport(null);
            }}
            getOptionLabel={(option) => option?.title || ""}
            renderInput={(params) => (
              <TextField {...params} label="Project" placeholder="Select project for this report" />
            )}
          />
          <TextField
            fullWidth
            multiline
            minRows={6}
            value={naturalText}
            onChange={(event) => setNaturalText(event.target.value.slice(0, 1000))}
            placeholder={"Describe the bug in plain English or Urdu...\ne.g: Login button click karne pe kuch nahi hota aur console 401 error deta hai"}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" } }}>
            <Typography variant="caption" color="text.secondary">
              {characterCounter}
            </Typography>
            <Button
              variant="contained"
              startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeRoundedIcon />}
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              {generating ? "Generating..." : "Generate Bug Report"}
            </Button>
          </Stack>
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </Paper>

      {report ? (
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            borderColor: "primary.light",
            bgcolor: "background.paper",
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ alignItems: "center" }}>
              <Chip icon={<AutoAwesomeRoundedIcon />} label="AI Generated Preview" color="secondary" />
              <Chip label={confidenceMeta.label} color={confidenceMeta.color} variant="outlined" />
            </Stack>

            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={report.title}
                  onChange={(event) => updateReport("title", event.target.value)}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Description"
                  value={report.description}
                  onChange={(event) => updateReport("description", event.target.value)}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Steps to Reproduce"
                  value={report.stepsToReproduce}
                  onChange={(event) => updateReport("stepsToReproduce", event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Expected Result"
                  value={report.expectedResult}
                  onChange={(event) => updateReport("expectedResult", event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Actual Result"
                  value={report.actualResult}
                  onChange={(event) => updateReport("actualResult", event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Priority"
                  value={report.priority}
                  onChange={(event) => updatePriority(event.target.value)}
                >
                  {priorityOptions.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: priorityColors[priority] }} />
                        <span>{priority}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Type"
                  value={report.type}
                  onChange={(event) => updateReport("type", event.target.value)}
                >
                  {typeOptions.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {canAssign ? (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    options={developers}
                    value={assignedDeveloper}
                    loading={membersLoading}
                    onChange={(_, value) => setAssignedDeveloper(value)}
                    getOptionLabel={(option) => option?.name ? `${option.name} (${option.email})` : ""}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                          <Avatar sx={{ width: 28, height: 28 }}>{option.name?.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="body2">{option.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                          </Box>
                        </Stack>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Assign To (Developer)"
                        helperText="Optional - leave empty if not assigning yet."
                      />
                    )}
                  />
                </Grid>
              ) : null}

              {canSetDeadline ? (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Deadline"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split("T")[0] }}
                    helperText="Auto-set from priority: Critical 1 day, High 3 days, Medium 7 days, Low 14 days."
                  />
                </Grid>
              ) : null}

              {canUploadScreenshot ? (
                <Grid size={12}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      borderStyle: "dashed",
                      bgcolor: "background.default",
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <ImageRoundedIcon color="primary" />
                        <Typography fontWeight={700}>Screenshot (Optional)</Typography>
                      </Stack>
                      <Button variant="outlined" component="label">
                        Upload .png or .gif
                        <input
                          hidden
                          type="file"
                          accept=".png,.gif,image/png,image/gif"
                          onChange={(event) => handleScreenshotChange(event.target.files?.[0])}
                        />
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        Only .png and .gif allowed (max 5MB).
                      </Typography>
                      {fileError ? <Alert severity="error">{fileError}</Alert> : null}
                      {screenshotPreview ? (
                        <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
                          <Box
                            component="img"
                            src={screenshotPreview}
                            alt="Screenshot preview"
                            sx={{
                              maxWidth: "100%",
                              maxHeight: 200,
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          />
                          <Button size="small" color="error" variant="outlined" onClick={removeScreenshot}>
                            Remove screenshot
                          </Button>
                        </Stack>
                      ) : null}
                    </Stack>
                  </Paper>
                </Grid>
              ) : null}
            </Grid>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end" }}>
              <Button variant="outlined" startIcon={<ReplayRoundedIcon />} onClick={handleGenerate} disabled={generating || loading}>
                Re-generate
              </Button>
              <Button variant="contained" startIcon={<SendRoundedIcon />} onClick={handleSubmit} disabled={loading || Boolean(fileError)}>
                Submit Bug Report
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  );
}
