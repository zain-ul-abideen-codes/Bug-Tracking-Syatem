import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Grid,
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
import BookmarkAddRoundedIcon from "@mui/icons-material/BookmarkAddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import KeyboardDoubleArrowRightRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowRightRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import ViewKanbanRoundedIcon from "@mui/icons-material/ViewKanbanRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
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

const SETTINGS_KEY = "bugtracker-pro-user-settings";
const SAVED_FILTERS_KEY = "bugtracker-pro-issue-filters";
const STATUS_BY_TYPE = {
  bug: ["new", "started", "resolved", "reopened"],
  feature: ["new", "started", "completed", "reopened"],
};

const laneDescriptions = {
  new: "Freshly reported work",
  started: "Work currently in progress",
  reopened: "Needs another pass",
  resolved: "Delivered and resolved",
  completed: "Feature work completed",
};

const laneAccentMap = {
  new: { color: "info.main", soft: "rgba(25, 118, 210, 0.14)" },
  started: { color: "warning.main", soft: "rgba(237, 108, 2, 0.14)" },
  reopened: { color: "error.main", soft: "rgba(211, 47, 47, 0.14)" },
  resolved: { color: "success.main", soft: "rgba(46, 125, 50, 0.14)" },
  completed: { color: "success.dark", soft: "rgba(27, 94, 32, 0.16)" },
};

const getBugId = (bug) => String(bug?.id || bug?._id || "");

const getBugPriority = (bug) => {
  if (!bug?.deadline || ["resolved", "completed"].includes(bug.status)) {
    return { label: "Normal", color: "default" };
  }

  const now = new Date();
  const deadline = new Date(bug.deadline);
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0 || bug.status === "reopened") {
    return { label: "High", color: "error" };
  }

  if (daysRemaining <= 3 || bug.status === "started") {
    return { label: "Medium", color: "warning" };
  }

  return { label: "Normal", color: "default" };
};

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function IssueCard({
  bug,
  canEdit,
  canDelete,
  canDrag,
  role,
  onEdit,
  onDelete,
  onPreview,
  onDragStart,
  onDragEnd,
  isDragging,
}) {
  const priority = getBugPriority(bug);

  return (
    <Paper
      variant="outlined"
      draggable={canDrag}
      onDragStart={(event) => onDragStart?.(event, bug)}
      onDragEnd={onDragEnd}
      onClick={() => onPreview?.(bug)}
      sx={{
        p: 2,
        borderRadius: 3.5,
        cursor: canDrag ? "grab" : "pointer",
        opacity: isDragging ? 0.48 : 1,
        transform: isDragging ? "scale(0.96) rotate(-2deg)" : "none",
        transition: "opacity 180ms ease, transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, filter 180ms ease",
        borderColor: isDragging ? "primary.main" : "divider",
        boxShadow: isDragging ? 8 : 0,
        bgcolor: "background.paper",
        backgroundImage: (theme) =>
          `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 180%)`,
        filter: isDragging ? "saturate(1.08)" : "none",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "0 auto 0 0",
          width: 4,
          backgroundColor: priority.color === "error"
            ? "error.main"
            : priority.color === "warning"
              ? "warning.main"
              : "primary.main",
        },
        "&:active": {
          cursor: canDrag ? "grabbing" : "pointer",
        },
        "&:hover": {
          boxShadow: canEdit ? 4 : 2,
          borderColor: canEdit ? "primary.light" : "divider",
        },
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Stack spacing={0.75} sx={{ minWidth: 0 }}>
            <Typography fontWeight={700}>{bug.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {bug.project?.title || "No project"}
            </Typography>
          </Stack>
          <Stack spacing={0.75} sx={{ alignItems: "flex-end" }}>
            <TypeChip type={bug.type} />
            <Chip
              size="small"
              label={priority.label}
              color={priority.color}
              variant={priority.color === "default" ? "outlined" : "filled"}
            />
          </Stack>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 40,
          }}
        >
          {bug.description || "No description added for this issue yet."}
        </Typography>
        {canDrag ? (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <DragIndicatorRoundedIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Drag across lanes to change status
            </Typography>
          </Stack>
        ) : null}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <StatusChip status={bug.status} />
            {bug.deadline ? (
              <Chip
                size="small"
                label={`Due ${new Date(bug.deadline).toLocaleDateString()}`}
              color={new Date(bug.deadline) < new Date() && !["resolved", "completed"].includes(bug.status) ? "warning" : "default"}
            />
          ) : null}
        </Stack>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Avatar sx={{ width: 30, height: 30 }}>
            {bug.assignedDeveloper?.name?.charAt(0) || "U"}
          </Avatar>
          <Stack spacing={0.15} sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              Assignee
            </Typography>
            <Typography variant="body2" color="text.primary" noWrap>
              {bug.assignedDeveloper?.name || "Unassigned"}
            </Typography>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View details">
            <IconButton onClick={(event) => { event.stopPropagation(); onPreview?.(bug); }}>
              <VisibilityRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canEdit ? (
            <Tooltip title={role === "developer" ? "Update Status" : "Edit Issue"}>
              <IconButton onClick={(event) => { event.stopPropagation(); onEdit(bug); }}>
                <EditRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          {canDelete ? (
            <Tooltip title="Delete">
              <IconButton color="error" onClick={(event) => { event.stopPropagation(); onDelete(bug); }}>
                <DeleteRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function BugsPage({ projectId = null, embedded = false }) {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { notify } = useNotification();
  const currentUserId = String(user?.userId || user?._id || "");
  const userStorageKey = `${SAVED_FILTERS_KEY}:${currentUserId || user?.role || "guest"}`;
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [selectedBug, setSelectedBug] = useState(null);
  const [dialog, setDialog] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pageError, setPageError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState(projectId || "all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadline");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [savedFilters, setSavedFilters] = useState(() => {
    try {
      const stored = localStorage.getItem(userStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (_error) {
      return [];
    }
  });
  const [savedFilterName, setSavedFilterName] = useState("");
  const [draggedBugId, setDraggedBugId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState("");
  const [collapsedLanes, setCollapsedLanes] = useState({});
  const [kanbanGroupBy, setKanbanGroupBy] = useState("status");
  const [detailBug, setDetailBug] = useState(null);
  const [pulseLaneKey, setPulseLaneKey] = useState("");
  const [viewMode, setViewMode] = useState(() => {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return settings.defaultIssuesView || "table";
    } catch (_error) {
      return "table";
    }
  });

  const debouncedQuery = useDebouncedValue(query);
  const canCreate = ["administrator", "qa"].includes(user.role);

  useEffect(() => {
    localStorage.setItem(userStorageKey, JSON.stringify(savedFilters));
  }, [savedFilters, userStorageKey]);

  const loadPage = async () => {
    try {
      setLoading(true);
      setPageError("");
      const [bugData, projectData, userData] = await Promise.all([
        getBugs(accessToken),
        getProjects(accessToken),
        canCreate ? getUsers(accessToken) : Promise.resolve([]),
      ]);
      setBugs(bugData);
      setProjects(projectData);
      setDevelopers(userData.filter((record) => record.role === "developer"));
    } catch (error) {
      const message = error.response?.data?.message || "Unable to load issues.";
      setPageError(message);
      if (error.response?.status !== 401 && message !== "Authentication required.") {
        notify(message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return undefined;
    }

    if (!accessToken) {
      setLoading(false);
      setPageError("Authentication required.");
      return undefined;
    }

    loadPage();
    return undefined;
  }, [accessToken, authLoading]);

  const filteredBugs = useMemo(() => {
    const now = new Date();

    const result = bugs.filter((bug) => {
      const blob = [
        bug.title,
        bug.description,
        bug.project?.title,
        bug.assignedDeveloper?.name,
        bug.createdBy?.name,
        bug.status,
        bug.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !debouncedQuery || blob.includes(debouncedQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || bug.status === statusFilter;
      const matchesType = typeFilter === "all" || bug.type === typeFilter;
      const matchesProject = projectFilter === "all" || bug.project?._id === projectFilter;
      const matchesAssignee = assigneeFilter === "all" || bug.assignedDeveloper?._id === assigneeFilter;
      const matchesMine =
        !showMineOnly ||
        String(bug.assignedDeveloper?._id || bug.createdBy?._id || "") === currentUserId;
      const isOverdue =
        bug.deadline &&
        new Date(bug.deadline) < now &&
        !["resolved", "completed"].includes(bug.status);
      const matchesOverdue = !showOverdueOnly || isOverdue;

      return (
        matchesQuery &&
        matchesStatus &&
        matchesType &&
        matchesProject &&
        matchesAssignee &&
        matchesMine &&
        matchesOverdue
      );
    });

    return result.sort((left, right) => {
      if (sortBy === "title") {
        return left.title.localeCompare(right.title);
      }
      if (sortBy === "status") {
        return left.status.localeCompare(right.status);
      }

      const leftDeadline = left.deadline ? new Date(left.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      const rightDeadline = right.deadline ? new Date(right.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      return leftDeadline - rightDeadline;
    });
  }, [
    assigneeFilter,
    bugs,
    currentUserId,
    debouncedQuery,
    projectFilter,
    showMineOnly,
    showOverdueOnly,
    sortBy,
    statusFilter,
    typeFilter,
  ]);

  const groupedBugs = useMemo(() => {
    const statuses = ["new", "started", "reopened", "resolved", "completed"];
    return statuses.map((status) => ({
      status,
      items: filteredBugs.filter((bug) => bug.status === status),
    }));
  }, [filteredBugs]);

  const kanbanLaneData = useMemo(
    () =>
      groupedBugs.map((column) => {
        const bugCount = column.items.filter((item) => item.type === "bug").length;
        const featureCount = column.items.filter((item) => item.type === "feature").length;
        const overdueCount = column.items.filter(
          (item) =>
            item.deadline &&
            new Date(item.deadline) < new Date() &&
            !["resolved", "completed"].includes(item.status),
        ).length;
        const uniqueAssignees = column.items.reduce((accumulator, item) => {
          const assigneeId = item.assignedDeveloper?._id;
          if (!assigneeId || accumulator.some((entry) => entry._id === assigneeId)) {
            return accumulator;
          }
          accumulator.push(item.assignedDeveloper);
          return accumulator;
        }, []);

        return {
          ...column,
          bugCount,
          featureCount,
          overdueCount,
          uniqueAssignees,
          exceedsWip: ["started", "reopened"].includes(column.status) && column.items.length > 3,
        };
      }),
    [groupedBugs],
  );

  const kanbanAssigneeData = useMemo(() => {
    const groups = new Map();

    filteredBugs.forEach((bug) => {
      const key = bug.assignedDeveloper?._id || "unassigned";
      const name = bug.assignedDeveloper?.name || "Unassigned";
      const current = groups.get(key) || {
        status: key,
        name,
        items: [],
        uniqueAssignees: bug.assignedDeveloper ? [bug.assignedDeveloper] : [],
      };
      current.items.push(bug);
      groups.set(key, current);
    });

    return Array.from(groups.values()).map((group) => ({
      ...group,
      bugCount: group.items.filter((item) => item.type === "bug").length,
      featureCount: group.items.filter((item) => item.type === "feature").length,
      overdueCount: group.items.filter(
        (item) =>
          item.deadline &&
          new Date(item.deadline) < new Date() &&
          !["resolved", "completed"].includes(item.status),
      ).length,
      exceedsWip: false,
      label: group.name,
      description: group.name === "Unassigned" ? "Issues waiting for ownership" : "Grouped by current assignee",
      accent: group.name === "Unassigned" ? "warning.main" : "secondary.main",
    }));
  }, [filteredBugs]);

  const kanbanColumns = kanbanGroupBy === "assignee" ? kanbanAssigneeData : kanbanLaneData;

  const rows = filteredBugs.map((bug) => ({ id: bug._id, ...bug }));
  const matchesCurrentUser = (value) => String(value || "") === currentUserId;
  const canDelete = (bug) =>
    user.role === "administrator" || (user.role === "qa" && matchesCurrentUser(bug.createdBy?._id));
  const canEdit = (bug) =>
    user.role === "administrator" ||
    (user.role === "qa" && matchesCurrentUser(bug.createdBy?._id)) ||
    (user.role === "developer" && matchesCurrentUser(bug.assignedDeveloper?._id));

  const canMoveToStatus = (bug, nextStatus) => {
    if (!bug || bug.status === nextStatus) {
      return false;
    }

    const allowedStatuses = STATUS_BY_TYPE[bug.type] || [];
    if (!allowedStatuses.includes(nextStatus)) {
      return false;
    }

    if (!canEdit(bug)) {
      return false;
    }

    if (user.role === "developer" && nextStatus === "reopened") {
      return false;
    }

    return true;
  };

  const saveCurrentFilter = () => {
    const trimmedName = savedFilterName.trim();
    if (!trimmedName) {
      notify("Enter a name before saving the filter.", "warning");
      return;
    }

    const nextFilter = {
      id: `${Date.now()}`,
      name: trimmedName,
      query,
      statusFilter,
      typeFilter,
      projectFilter,
      assigneeFilter,
      sortBy,
      showOverdueOnly,
      showMineOnly,
      viewMode,
    };

    setSavedFilters((current) => [nextFilter, ...current.filter((item) => item.name !== trimmedName)].slice(0, 8));
    setSavedFilterName("");
    notify("Issue filter saved.", "success");
  };

  const applySavedFilter = (filter) => {
    setQuery(filter.query || "");
    setStatusFilter(filter.statusFilter || "all");
    setTypeFilter(filter.typeFilter || "all");
    setProjectFilter(filter.projectFilter || "all");
    setAssigneeFilter(filter.assigneeFilter || "all");
    setSortBy(filter.sortBy || "deadline");
    setShowOverdueOnly(Boolean(filter.showOverdueOnly));
    setShowMineOnly(Boolean(filter.showMineOnly));
    setViewMode(filter.viewMode || "table");
    notify(`Applied filter: ${filter.name}`, "info");
  };

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setProjectFilter(projectId || "all");
    setAssigneeFilter("all");
    setSortBy("deadline");
    setShowOverdueOnly(false);
    setShowMineOnly(false);
  };

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
        <Box sx={{ height: "100%", width: "100%", display: "flex", alignItems: "center", minWidth: 0 }}>
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
          <Box sx={{ height: "100%", width: "100%", display: "flex", alignItems: "center", minWidth: 0 }}>
            <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, alignItems: "center", justifyContent: "flex-start" }}>
              <Avatar sx={{ width: 30, height: 30, flexShrink: 0 }}>
                {row.assignedDeveloper.name?.charAt(0)}
              </Avatar>
              <Typography variant="body2" sx={{ lineHeight: 1.2, minHeight: 30, display: "flex", alignItems: "center" }}>
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
      const bugId = getBugId(selectedBug);
      if (selectedBug) {
        const response = await updateBug(bugId, payload);
        if (response?.bug) {
          setBugs((current) =>
            current.map((entry) => (getBugId(entry) === getBugId(response.bug) ? response.bug : entry)),
          );
        }
        notify("Issue updated successfully.", "success");
      } else {
        const response = await createBug(payload);
        if (response?.bug) {
          setBugs((current) => [response.bug, ...current]);
        }
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
      await deleteBug(getBugId(selectedBug));
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

  const handleCardDragStart = (event, bug) => {
    if (!canEdit(bug)) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    const bugId = getBugId(bug);
    event.dataTransfer.setData("text/plain", bugId);
    setDraggedBugId(bugId);
  };

  const handleCardDragEnd = () => {
    setDraggedBugId(null);
    setDragOverStatus("");
  };

  const toggleLane = (laneKey) => {
    setCollapsedLanes((current) => ({
      ...current,
      [laneKey]: !current[laneKey],
    }));
  };

  const handleLaneDragOver = (event, status) => {
    const draggedBug = bugs.find((bug) => getBugId(bug) === draggedBugId);
    if (!canMoveToStatus(draggedBug, status)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  };

  const handleLaneDrop = async (event, status) => {
    event.preventDefault();
    const droppedBugId = event.dataTransfer.getData("text/plain") || draggedBugId;
    const bug = bugs.find((entry) => getBugId(entry) === droppedBugId);

    setDragOverStatus("");
    setDraggedBugId(null);

    if (!canMoveToStatus(bug, status)) {
      return;
    }

    const previousStatus = bug.status;
    setBugs((current) =>
      current.map((entry) =>
        getBugId(entry) === droppedBugId ? { ...entry, status } : entry,
      ),
    );

    try {
      const response = await updateBug(droppedBugId, { status });
      const nextBug = response?.bug;
      if (nextBug) {
        setBugs((current) =>
          current.map((entry) => (getBugId(entry) === droppedBugId ? nextBug : entry)),
        );
      }
      setPulseLaneKey(status);
      setTimeout(() => setPulseLaneKey(""), 900);
      notify(`Issue moved to ${status}.`, "success");
    } catch (error) {
      setBugs((current) =>
        current.map((entry) =>
          getBugId(entry) === droppedBugId ? { ...entry, status: previousStatus } : entry,
        ),
      );
      notify(error.response?.data?.message || "Unable to move issue.", "error");
    }
  };

  if (loading || authLoading) return <PageSkeleton cards={3} rows={6} />;

  return (
    <Stack spacing={3} className="page-fade-in">
      {!embedded ? (
        <PageHeader
          eyebrow="Issue Desk"
          title="Bugs, features, and workflow execution"
          subtitle="Search deeper, save filter views, and switch between table and Kanban workflows."
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
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ alignItems: { xs: "stretch", lg: "center" } }}>
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
              placeholder="Search title, description, project, assignee..."
              sx={{ minWidth: { xs: "100%", lg: 320 } }}
              slotProps={{
                input: {
                  startAdornment: <SearchRoundedIcon fontSize="small" sx={{ mr: 1 }} />,
                },
              }}
            />

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<ViewListRoundedIcon />}
                label="Table"
                color={viewMode === "table" ? "primary" : "default"}
                onClick={() => setViewMode("table")}
              />
              <Chip
                icon={<ViewKanbanRoundedIcon />}
                label="Kanban"
                color={viewMode === "kanban" ? "primary" : "default"}
                onClick={() => setViewMode("kanban")}
              />
              <Chip
                icon={<FilterAltRoundedIcon />}
                label="Overdue"
                color={showOverdueOnly ? "warning" : "default"}
                onClick={() => setShowOverdueOnly((current) => !current)}
              />
              <Chip
                icon={<FilterAltRoundedIcon />}
                label="Only mine"
                color={showMineOnly ? "primary" : "default"}
                onClick={() => setShowMineOnly((current) => !current)}
              />
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
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
            <Select size="small" value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} sx={{ minWidth: 190 }}>
              <MenuItem value="all">All Assignees</MenuItem>
              {developers.map((developer) => (
                <MenuItem key={developer._id} value={developer._id}>{developer.name}</MenuItem>
              ))}
            </Select>
            <Select size="small" value={sortBy} onChange={(event) => setSortBy(event.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="deadline">Sort by Deadline</MenuItem>
              <MenuItem value="title">Sort by Title</MenuItem>
              <MenuItem value="status">Sort by Status</MenuItem>
            </Select>
            <Button variant="outlined" onClick={resetFilters}>Reset</Button>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              size="small"
              value={savedFilterName}
              onChange={(event) => setSavedFilterName(event.target.value)}
              placeholder="Name this filter view"
              sx={{ minWidth: { xs: "100%", md: 220 } }}
            />
            <Button variant="outlined" startIcon={<BookmarkAddRoundedIcon />} onClick={saveCurrentFilter}>
              Save Filter
            </Button>
          </Stack>

          {savedFilters.length > 0 ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {savedFilters.map((filter) => (
                <Chip
                  key={filter.id}
                  label={filter.name}
                  onClick={() => applySavedFilter(filter)}
                  onDelete={() => {
                    setSavedFilters((current) => current.filter((entry) => entry.id !== filter.id));
                    notify(`Removed filter: ${filter.name}`, "info");
                  }}
                />
              ))}
            </Stack>
          ) : null}
        </Stack>
      </Paper>

      {pageError ? (
        <EmptyState icon={BugReportRoundedIcon} title="Issues unavailable" subtitle={pageError} />
      ) : !rows.length ? (
        <EmptyState icon={BugReportRoundedIcon} title="No issues found" subtitle="Try adjusting your filters, switch views, or create a new issue if your role allows it." />
      ) : viewMode === "table" ? (
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
      ) : (
        <Stack spacing={2}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 4,
              borderColor: "divider",
              bgcolor: "background.paper",
              backgroundImage: (theme) =>
                `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}
            >
              <Stack spacing={0.75}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <ViewKanbanRoundedIcon color="primary" />
                  <Typography fontWeight={800}>Kanban Workflow</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Move work through each stage with a cleaner lane-based workflow board.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<KeyboardDoubleArrowRightRoundedIcon fontSize="small" />}
                  label="Drag cards between lanes"
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  label={kanbanGroupBy === "status" ? "Grouped by status" : "Grouped by assignee"}
                  variant="outlined"
                  color="info"
                  onClick={() => setKanbanGroupBy((current) => (current === "status" ? "assignee" : "status"))}
                />
                <Chip
                  label={`${user.role} workflow`}
                  variant="outlined"
                  color="secondary"
                  sx={{ textTransform: "capitalize" }}
                />
                <Chip
                  label={`${filteredBugs.length} visible issues`}
                  variant="outlined"
                  color="default"
                />
              </Stack>
            </Stack>
          </Paper>

          <Box sx={{ width: "100%" }}>
          <Stack spacing={2}>
            {kanbanColumns.map((column) => {
              const laneKey = kanbanGroupBy === "status" ? column.status : column.status;
              const isCollapsed = Boolean(collapsedLanes[laneKey]);
              const accentColor =
                kanbanGroupBy === "status"
                  ? laneAccentMap[column.status]?.color || "primary.main"
                  : column.accent || "secondary.main";

              return (
              <Box key={laneKey}>
                {/** Accent values keep lanes distinct without changing workflow logic */}
                <Paper
                  onDragOver={kanbanGroupBy === "status" ? (event) => handleLaneDragOver(event, column.status) : undefined}
                  onDragLeave={() => {
                    if (dragOverStatus === column.status) {
                      setDragOverStatus("");
                    }
                  }}
                  onDrop={(event) => {
                    if (kanbanGroupBy === "status") {
                      void handleLaneDrop(event, column.status);
                    }
                  }}
                  sx={{
                    p: 2,
                    width: "100%",
                    display: "block",
                    border: dragOverStatus === column.status ? "2px solid" : "1px solid",
                    borderColor: dragOverStatus === column.status ? accentColor : "divider",
                    bgcolor: dragOverStatus === column.status ? "action.hover" : "background.paper",
                    backgroundImage: (theme) =>
                      dragOverStatus === column.status
                        ? `linear-gradient(180deg, ${theme.palette.action.hover} 0%, ${theme.palette.background.paper} 100%)`
                        : `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                    boxShadow: pulseLaneKey === column.status ? 10 : dragOverStatus === column.status ? 8 : 1,
                    borderRadius: 4,
                    transition: "border-color 160ms ease, background-color 160ms ease, box-shadow 220ms ease, transform 160ms ease",
                    transform: dragOverStatus === column.status ? "translateY(-2px)" : "none",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 0,
                      right: 0,
                      height: 5,
                      backgroundColor: accentColor,
                    },
                  }}
                >
                  <Stack spacing={2}>
                    <Stack
                      spacing={1.25}
                      sx={{
                        pb: 1.5,
                        pt: 0.5,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        backgroundColor: "background.paper",
                        backgroundImage: (theme) =>
                          `linear-gradient(180deg, ${theme.palette.background.paper} 0%, rgba(255,255,255,0) 100%)`,
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        {kanbanGroupBy === "status" ? (
                          <StatusChip status={column.status} />
                        ) : (
                          <Chip
                            avatar={<Avatar sx={{ width: 24, height: 24 }}>{column.label?.charAt(0) || "U"}</Avatar>}
                            label={column.label}
                            variant="outlined"
                            color="secondary"
                          />
                        )}
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                          <Chip
                            size="small"
                            label={`${column.items.length} ${column.items.length === 1 ? "card" : "cards"}`}
                            color={dragOverStatus === column.status ? "primary" : "default"}
                            variant={dragOverStatus === column.status ? "filled" : "outlined"}
                          />
                          <Tooltip title={isCollapsed ? "Expand lane" : "Collapse lane"}>
                            <IconButton size="small" onClick={() => toggleLane(laneKey)}>
                              {isCollapsed ? <ExpandMoreRoundedIcon fontSize="small" /> : <ExpandLessRoundedIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {kanbanGroupBy === "status" ? laneDescriptions[column.status] || "Workflow lane" : column.description}
                      </Typography>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        <Chip size="small" variant="outlined" label={`${column.bugCount} bugs`} />
                        <Chip size="small" variant="outlined" label={`${column.featureCount} features`} />
                        {column.overdueCount ? (
                          <Chip size="small" color="warning" variant="filled" label={`${column.overdueCount} overdue`} />
                        ) : null}
                        {column.exceedsWip ? (
                          <Chip size="small" color="error" variant="outlined" label={`WIP ${column.items.length}/3`} />
                        ) : null}
                        {dragOverStatus === column.status ? (
                          <Chip size="small" color="primary" variant="filled" label="Release to move" />
                        ) : null}
                      </Stack>
                      {column.uniqueAssignees.length ? (
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                          <Typography variant="caption" color="text.secondary">
                            Active assignees
                          </Typography>
                          <AvatarGroup max={4} sx={{ "& .MuiAvatar-root": { width: 26, height: 26, fontSize: 12 } }}>
                            {column.uniqueAssignees.map((assignee) => (
                              <Avatar key={assignee._id} alt={assignee.name}>
                                {assignee.name?.charAt(0) || "U"}
                              </Avatar>
                            ))}
                          </AvatarGroup>
                        </Stack>
                      ) : null}
                    </Stack>
                    {isCollapsed ? (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          textAlign: "center",
                          borderStyle: "dashed",
                          borderRadius: 3,
                          bgcolor: "background.default",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Lane collapsed
                        </Typography>
                      </Paper>
                    ) : column.items.length === 0 ? (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          textAlign: "center",
                          borderStyle: "dashed",
                          borderRadius: 3,
                          bgcolor: "background.default",
                          minHeight: 180,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Stack spacing={0.75} sx={{ alignItems: "center" }}>
                          <ViewKanbanRoundedIcon color="disabled" />
                          <Typography variant="body2" color="text.secondary">
                            No issues in this lane
                          </Typography>
                        </Stack>
                      </Paper>
                    ) : (
                      <Stack spacing={1.5}>
                        {column.items.map((bug) => (
                          <IssueCard
                            key={bug._id}
                            bug={bug}
                            role={user.role}
                            canEdit={canEdit(bug)}
                            canDelete={canDelete(bug)}
                            canDrag={kanbanGroupBy === "status" && canEdit(bug)}
                            isDragging={draggedBugId === getBugId(bug)}
                            onDragStart={handleCardDragStart}
                            onDragEnd={handleCardDragEnd}
                            onPreview={(nextBug) => setDetailBug(nextBug)}
                            onEdit={(nextBug) => { setSelectedBug(nextBug); setSubmitError(""); setDialog("bug"); }}
                            onDelete={(nextBug) => { setSelectedBug(nextBug); setDialog("delete"); }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              </Box>
            )})}
          </Stack>
          </Box>
        </Stack>
      )}

      <Drawer
        anchor="right"
        open={Boolean(detailBug)}
        onClose={() => setDetailBug(null)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 420 },
            p: 3,
          },
        }}
      >
        {detailBug ? (
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <Stack spacing={1}>
                <Typography variant="overline" color="primary.main">
                  Issue Detail
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {detailBug.title}
                </Typography>
              </Stack>
              <IconButton onClick={() => setDetailBug(null)}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <TypeChip type={detailBug.type} />
              <StatusChip status={detailBug.status} />
              <Chip
                size="small"
                label={getBugPriority(detailBug).label}
                color={getBugPriority(detailBug).color}
                variant={getBugPriority(detailBug).color === "default" ? "outlined" : "filled"}
              />
            </Stack>
            <Divider />
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">Project</Typography>
              <Typography>{detailBug.project?.title || "No project linked"}</Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">Description</Typography>
              <Typography color="text.secondary">
                {detailBug.description || "No description has been added for this issue."}
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="subtitle2" color="text.secondary">Assignee</Typography>
                <Typography>{detailBug.assignedDeveloper?.name || "Unassigned"}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="subtitle2" color="text.secondary">Deadline</Typography>
                <Typography>{detailBug.deadline ? new Date(detailBug.deadline).toLocaleDateString() : "No deadline"}</Typography>
              </Grid>
            </Grid>
            {detailBug.activity?.length ? (
              <>
                <Divider />
                <Stack spacing={1.25}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Recent Activity
                  </Typography>
                  {detailBug.activity.slice(-4).reverse().map((entry, index) => (
                    <Paper key={`${entry.createdAt || index}-${entry.action}`} variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                      <Typography variant="body2">{entry.message}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Recent update"}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </>
            ) : null}
          </Stack>
        ) : null}
      </Drawer>

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
