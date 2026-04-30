import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import { DataGrid } from "@mui/x-data-grid";
import { createBug, deleteBug, getBugs, updateBug } from "../api/bugsApi";
import { getProjects } from "../api/projectsApi";
import { getUsers } from "../api/usersApi";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import PageHeader from "../components/common/PageHeader";
import PageSkeleton from "../components/common/PageSkeleton";
import TypeChip from "../components/common/TypeChip";
import StatusChip from "../components/common/StatusChip";
import ConfirmDialog from "../components/common/ConfirmDialog";
import BugModal from "../components/modals/BugModal";
import EmptyState from "../components/common/EmptyState";

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function BugsPage({ projectId = null, embedded = false }) {
  const { user } = useAuth();
  const { notify } = useNotification();
  const currentUserId = String(user?.userId || user?._id || "");
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [selectedBug, setSelectedBug] = useState(null);
  const [dialog, setDialog] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState(projectId || "all");

  const debouncedQuery = useDebouncedValue(query);
  const canCreate = ["administrator", "qa"].includes(user.role);

  const loadPage = async () => {
    try {
      setLoading(true);
      const [bugData, projectData, userData] = await Promise.all([
        getBugs(),
        getProjects(),
        canCreate ? getUsers() : Promise.resolve([]),
      ]);
      setBugs(bugData);
      setProjects(projectData);
      setDevelopers(userData.filter((record) => record.role === "developer"));
    } catch (error) {
      notify(error.response?.data?.message || "Unable to load issues.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const filteredBugs = useMemo(() => {
    return bugs.filter((bug) => {
      const matchesQuery =
        !debouncedQuery ||
        [bug.title, bug.project?.title, bug.assignedDeveloper?.name, bug.status, bug.type]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(debouncedQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || bug.status === statusFilter;
      const matchesType = typeFilter === "all" || bug.type === typeFilter;
      const matchesProject = projectFilter === "all" || bug.project?._id === projectFilter;
      return matchesQuery && matchesStatus && matchesType && matchesProject;
    });
  }, [bugs, debouncedQuery, projectFilter, statusFilter, typeFilter]);

  const rows = filteredBugs.map((bug) => ({ id: bug._id, ...bug }));
  const matchesCurrentUser = (value) => String(value || "") === currentUserId;
  const canDelete = (bug) =>
    user.role === "administrator" || (user.role === "qa" && matchesCurrentUser(bug.createdBy?._id));
  const canEdit = (bug) =>
    user.role === "administrator" ||
    (user.role === "qa" && matchesCurrentUser(bug.createdBy?._id)) ||
    (user.role === "developer" && matchesCurrentUser(bug.assignedDeveloper?._id));

  const columns = [
    { field: "id", headerName: "ID", minWidth: 210 },
    { field: "title", headerName: "Title", flex: 1, minWidth: 220 },
    {
      field: "type",
      headerName: "Type",
      minWidth: 120,
      renderCell: ({ value }) => <TypeChip type={value} />,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 140,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: "project",
      headerName: "Project",
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => (
        <Box
          sx={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            minWidth: 0,
          }}
        >
          {row.project?.title ? (
            <Chip
              label={row.project.title}
              variant="outlined"
              color="primary"
              size="small"
              sx={{
                maxWidth: "100%",
                fontWeight: 600,
                "& .MuiChip-label": {
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                },
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No project
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "assignedDeveloper",
      headerName: "Assigned To",
      minWidth: 180,
      renderCell: ({ row }) =>
        row.assignedDeveloper ? (
          <Box
            sx={{
              height: "100%",
              width: "100%",
              display: "flex",
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              justifyContent="flex-start"
              sx={{ minWidth: 0 }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {row.assignedDeveloper.name?.charAt(0)}
              </Avatar>
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.2,
                  display: "flex",
                  alignItems: "center",
                  minHeight: 30,
                }}
              >
                {row.assignedDeveloper.name}
              </Typography>
            </Stack>
          </Box>
        ) : (
          "Unassigned"
        ),
    },
    {
      field: "deadline",
      headerName: "Deadline",
      minWidth: 140,
      valueFormatter: (value) => (value ? new Date(value).toLocaleDateString() : "No deadline"),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 130,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          {canEdit(row) ? (
            <Tooltip title={user.role === "developer" ? "Update Status" : "Edit"}>
              <IconButton onClick={() => { setSelectedBug(row); setSubmitError(""); setDialog("bug"); }}>
                <EditRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          {canDelete(row) ? (
            <Tooltip title="Delete">
              <IconButton color="error" onClick={() => { setSelectedBug(row); setDialog("delete"); }}>
                <DeleteRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      ),
    },
  ];

  const handleBugSubmit = async (payload) => {
    try {
      setSubmitLoading(true);
      setSubmitError("");
      if (selectedBug) {
        await updateBug(selectedBug.id, payload);
        notify("Issue updated successfully.", "success");
      } else {
        await createBug(payload);
        notify("Issue created successfully.", "success");
      }
      setDialog("");
      setSelectedBug(null);
      await loadPage();
    } catch (error) {
      const message = error.response?.data?.message || "Unable to save issue.";
      setSubmitError(message);
      notify(message, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteBug(selectedBug.id);
      notify("Issue deleted successfully.", "success");
      setDialog("");
      setSelectedBug(null);
      await loadPage();
    } catch (error) {
      notify(error.response?.data?.message || "Unable to delete issue.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <PageSkeleton cards={3} rows={6} />;

  return (
    <Stack spacing={3} className="page-fade-in">
      {!embedded ? (
        <PageHeader
          eyebrow="Issue Desk"
          title="Bugs, features, and workflow execution"
          subtitle="Filter, search, and manage all visible issues from one grid."
          action={
            canCreate ? (
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => { setSelectedBug(null); setSubmitError(""); setDialog("bug"); }}
                sx={{
                  alignSelf: { xs: "stretch", md: "center" },
                  minHeight: 52,
                  px: 3,
                  borderRadius: 3,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  boxShadow: (theme) => theme.shadows[6],
                }}
              >
                Create Bug
              </Button>
            ) : null
          }
        />
      ) : null}

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems={{ xs: "stretch", lg: "center" }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {["all", "bug", "feature"].map((type) => (
                <Chip
                  key={type}
                  label={type === "all" ? "All" : type}
                  color={typeFilter === type ? "primary" : "default"}
                  onClick={() => setTypeFilter(type)}
                  sx={{ textTransform: "capitalize" }}
                />
              ))}
            </Stack>
            <TextField
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search issues"
              sx={{ minWidth: { xs: "100%", lg: 280 } }}
              InputProps={{
                startAdornment: <SearchRoundedIcon fontSize="small" sx={{ mr: 1 }} />,
              }}
            />
            <Select size="small" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} sx={{ minWidth: 160 }}>
              {["all", "new", "started", "resolved", "completed", "reopened"].map((status) => (
                <MenuItem key={status} value={status} sx={{ textTransform: "capitalize" }}>
                  {status === "all" ? "All Statuses" : status}
                </MenuItem>
              ))}
            </Select>
            <Select size="small" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="all">All Projects</MenuItem>
              {projects.map((project) => (
                <MenuItem key={project._id} value={project._id}>{project.title}</MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>
      </Paper>

      {!rows.length ? (
        <EmptyState icon={BugReportRoundedIcon} title="No issues found" subtitle="Try adjusting your filters or create a new issue if your role allows it." />
      ) : (
        <Paper sx={{ p: 2, overflow: "hidden" }}>
          <Box sx={{ width: "100%" }}>
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              pageSizeOptions={[5, 10, 25]}
              disableRowSelectionOnClick
              sx={{
                width: "100%",
                border: "none",
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "action.hover",
                },
                "& .MuiDataGrid-main": {
                  minWidth: 0,
                },
                "& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader": {
                  outline: "none",
                },
              }}
            />
          </Box>
        </Paper>
      )}

      <BugModal
        open={dialog === "bug"}
        loading={submitLoading}
        issue={selectedBug}
        projects={projects}
        developers={developers}
        role={user.role}
        submitError={submitError}
        onClose={() => setDialog("")}
        onSubmit={handleBugSubmit}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        loading={deleteLoading}
        title="Delete issue"
        description={`Delete ${selectedBug?.title || "this issue"}? The screenshot file will also be removed.`}
        confirmLabel="Delete"
        onClose={() => setDialog("")}
        onConfirm={handleDelete}
      />
    </Stack>
  );
}
