import { useEffect, useState } from "react";
import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Alert, Box, Chip, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { createBug, deleteBug, getBugs, updateBug } from "../api/bugsApi";
import { getProjects } from "../api/projectsApi";
import { getUsers } from "../api/usersApi";
import useAuth from "../hooks/useAuth";
import useModal from "../hooks/useModal";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBadge from "../components/common/StatusBadge";
import BugModal from "../components/modals/BugModal";

export default function BugsPage() {
  const { user } = useAuth();
  const bugModal = useModal();
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [selectedBug, setSelectedBug] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

  const canCreate = ["administrator", "qa"].includes(user.role);
  const canDelete = (bug) =>
    user.role === "administrator" || (user.role === "qa" && bug.createdBy?._id === user.userId);
  const canEdit = (bug) =>
    user.role === "administrator" ||
    (user.role === "qa" && bug.createdBy?._id === user.userId) ||
    (user.role === "developer" && bug.assignedDeveloper?._id === user.userId);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");
      const [bugData, projectData, userData] = await Promise.all([
        getBugs(),
        getProjects(),
        ["administrator", "qa"].includes(user.role) ? getUsers() : Promise.resolve([]),
      ]);
      setBugs(bugData);
      setProjects(projectData);
      setDevelopers(userData.filter((record) => record.role === "developer"));
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load issues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const openCreate = () => {
    setSelectedBug(null);
    setSubmitError("");
    bugModal.openModal();
  };

  const openEdit = (bug) => {
    setSelectedBug(bug);
    setSubmitError("");
    bugModal.openModal();
  };

  const submitBug = async (payload) => {
    try {
      setSubmitError("");
      if (selectedBug) {
        await updateBug(selectedBug._id, payload);
      } else {
        await createBug(payload);
      }
      bugModal.closeModal();
      await loadPage();
    } catch (submitBugError) {
      setSubmitError(submitBugError.response?.data?.message || "Unable to save issue.");
    }
  };

  const handleDelete = async (id) => {
    await deleteBug(id);
    await loadPage();
  };

  const filteredBugs = bugs.filter((bug) => {
    const matchesQuery =
      !query ||
      [bug.title, bug.project?.title, bug.assignedDeveloper?.name, bug.type, bug.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query.toLowerCase()));
    const matchesStatus = statusFilter === "all" || bug.status === statusFilter;
    const matchesType = typeFilter === "all" || bug.type === typeFilter;
    const matchesProject = projectFilter === "all" || bug.project?._id === projectFilter;
    return matchesQuery && matchesStatus && matchesType && matchesProject;
  });

  const summary = {
    total: filteredBugs.length,
    new: filteredBugs.filter((bug) => bug.status === "new").length,
    started: filteredBugs.filter((bug) => bug.status === "started").length,
    done: filteredBugs.filter((bug) => ["resolved", "completed"].includes(bug.status)).length,
    reopened: filteredBugs.filter((bug) => bug.status === "reopened").length,
  };

  if (loading) return <LoadingSpinner label="Loading issues..." />;

  return (
    <Stack spacing={2.5}>
      <Paper
        sx={{
          p: 3,
          background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(244,249,255,0.96))",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <BugReportRoundedIcon color="primary" />
              <Typography variant="h5">Issues</Typography>
            </Stack>
            <Typography color="text.secondary">Bugs and feature requests with project context and workflow status.</Typography>
          </Box>
          {canCreate ? <Button onClick={openCreate}>Create Issue</Button> : null}
        </Stack>
      </Paper>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Paper sx={{ p: 2 }}>
        <Box className="toolbar-grid">
        <TextField
          size="small"
          fullWidth
          placeholder="Search by title, project, assignee, type, or status"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon />
              </InputAdornment>
            ),
          }}
        />
        <TextField select size="small" SelectProps={{ native: true }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {["all","new","started","resolved","completed","reopened"].map((status) => (
            <option key={status} value={status}>{status === "all" ? "All Statuses" : status}</option>
          ))}
        </TextField>
        <TextField select size="small" SelectProps={{ native: true }} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="all">All Types</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
        </TextField>
        <TextField select size="small" SelectProps={{ native: true }} value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
          <option value="all">All Projects</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.title}
            </option>
          ))}
        </TextField>
        </Box>
      </Paper>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label={`Total: ${summary.total}`} />
        <Chip label={`New: ${summary.new}`} color="warning" />
        <Chip label={`Started: ${summary.started}`} color="info" />
        <Chip label={`Done: ${summary.done}`} color="success" />
        <Chip label={`Reopened: ${summary.reopened}`} color="error" />
      </Stack>
      {!projects.length && canCreate ? (
        <Alert severity="info">Issue creation needs a project first. Create a project in the Projects section, assign QA and developers, then come back here to log issues.</Alert>
      ) : null}
      <Paper sx={{ p: 1.5, background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Assigned Developer</TableCell>
              <TableCell>Deadline</TableCell>
              <TableCell>Screenshot</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBugs.map((bug) => (
              <TableRow key={bug._id}>
                <TableCell>{bug.title}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>{bug.type}</TableCell>
                <TableCell>
                  <StatusBadge value={bug.status} />
                </TableCell>
                <TableCell>{bug.project?.title}</TableCell>
                <TableCell>{bug.assignedDeveloper?.name || "Unassigned"}</TableCell>
                <TableCell>{bug.deadline ? new Date(bug.deadline).toLocaleDateString() : "None"}</TableCell>
                <TableCell>
                  {bug.screenshot ? (
                    <a href={`${apiBase}${bug.screenshot}`} target="_blank" rel="noreferrer">
                      View
                    </a>
                  ) : (
                    "None"
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {canEdit(bug) ? (
                    <Button variant="secondary" onClick={() => openEdit(bug)}>
                      {user.role === "developer" ? "Update Status" : "Edit"}
                    </Button>
                  ) : null}
                  {canDelete(bug) ? (
                    <Button variant="danger" onClick={() => handleDelete(bug._id)}>
                      Delete
                    </Button>
                  ) : null}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      {bugModal.isOpen ? (
        <BugModal
          issue={selectedBug}
          projects={projects}
          developers={developers}
          role={user.role}
          submitError={submitError}
          onClose={bugModal.closeModal}
          onSubmit={submitBug}
        />
      ) : null}
    </Stack>
  );
}
