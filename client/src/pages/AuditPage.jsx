import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import TokenRoundedIcon from "@mui/icons-material/TokenRounded";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";

const roles = ["all", "administrator", "manager", "qa", "developer"];
const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "true", label: "Success" },
  { value: "false", label: "Failed" },
];

const DEFAULT_FILTERS = {
  tool: "all",
  role: "all",
  success: "all",
};

const toolIcons = {
  agent_response: "AI",
  agent_failure: "ERR",
  get_bugs: "BUG",
  get_my_projects: "PRJ",
  get_dashboard_stats: "DASH",
  create_bug: "NEW",
  update_bug_status: "UPD",
  assign_bug: "ASN",
  get_bug_detail: "VIEW",
};

const roleColor = (role) =>
  ({
    administrator: "error",
    manager: "primary",
    qa: "success",
    developer: "secondary",
  })[role] || "default";

const formatNumber = (value) => Number(value || 0).toLocaleString();

const formatTimeAgo = (value) => {
  if (!value) return "Unknown";
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return new Date(value).toLocaleString();
};

const summarizeInput = (input) => {
  if (!input) return "No input recorded.";
  if (typeof input === "string") return input.slice(0, 180);
  const important = ["message", "bugId", "projectId", "status", "newStatus", "title", "assignedTo", "developerUserId"]
    .map((key) => (input[key] ? `${key}: ${input[key]}` : ""))
    .filter(Boolean);
  if (important.length) return important.join(" | ");
  return Object.entries(input)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value).slice(0, 60)}`)
    .join(" | ") || "No input recorded.";
};

function StatCard({ title, value, icon, color }) {
  return (
    <Paper
      sx={{
        p: 2.5,
        height: "100%",
        bgcolor: "#1e293b",
        color: "#e2e8f0",
        border: "1px solid #334155",
        borderRadius: 4,
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography sx={{ color: "#64748b", fontWeight: 800 }}>{title}</Typography>
          <Typography variant="h4" sx={{ mt: 1, fontWeight: 950 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ color }}>{icon}</Box>
      </Stack>
    </Paper>
  );
}

export default function AuditPage() {
  const { user } = useAuth();
  const requestIdRef = useRef(0);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [availableTools, setAvailableTools] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const toolOptions = useMemo(() => {
    const names = new Set([...availableTools, ...logs.map((log) => log.toolName)].filter(Boolean));
    return ["all", ...Array.from(names).sort()];
  }, [availableTools, logs]);

  const loadLogs = async (page = 1, activeFilters = filters) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const params = {
      page,
      limit: 20,
      ...Object.fromEntries(Object.entries(activeFilters).filter(([, value]) => value && value !== "all")),
    };
    const { data } = await api.get("/agent/audit-logs", { params });

    // Ignore stale responses so an older filtered request cannot overwrite Reset results.
    if (requestId !== requestIdRef.current) return;

    setLogs(data.logs || data.items || []);
    setStats(data.stats || data.summary || {});
    setAvailableTools(data.filters?.tools || []);
    setPagination({
      page: data.pagination?.page || page,
      totalPages: data.pagination?.totalPages || data.pagination?.pages || 1,
      total: data.pagination?.total || 0,
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        await loadLogs(1);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load audit logs.");
      } finally {
        setLoading(false);
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  if (user?.role !== "administrator") {
    return <Navigate to="/" replace />;
  }

  const resetFilters = async () => {
    const resetValues = { ...DEFAULT_FILTERS };
    setFilters(resetValues);
    setSelectedLog(null);
    setError("");
    setLoading(true);

    try {
      await loadLogs(1, resetValues);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to reset audit filters.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          color: "#e2e8f0",
          border: "1px solid #334155",
          borderRadius: 5,
          background: "radial-gradient(circle at top right, rgba(124,58,237,0.28), transparent 36%), #0a0f1e",
        }}
      >
        <Typography sx={{ color: "#7c3aed", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 900 }}>
          AI Agent Audit Log
        </Typography>
        <Typography variant="h4" sx={{ mt: 1, fontWeight: 950 }}>
          Monitor all BugBot activity
        </Typography>
        <Typography sx={{ mt: 1, color: "#64748b" }}>
          Simple admin view for BugBot calls, tool usage, success/failure status, and token usage.
        </Typography>
      </Paper>

      {error ? (
        <Paper sx={{ p: 2, bgcolor: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.35)" }}>
          <Typography sx={{ color: "#f87171", fontWeight: 900 }}>{error}</Typography>
        </Paper>
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard title="Total Calls Today" value={formatNumber(stats?.totalCalls)} icon={<QueryStatsRoundedIcon />} color="#2563eb" />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard title="Success Rate" value={`${stats?.successRate || 0}%`} icon={<SpeedRoundedIcon />} color="#4ade80" />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard title="Tokens Used" value={formatNumber(stats?.totalTokens)} icon={<TokenRoundedIcon />} color="#7c3aed" />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard title="Failed Calls" value={formatNumber(stats?.failedCalls)} icon={<ErrorOutlineRoundedIcon />} color="#f87171" />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, bgcolor: "#1e293b", border: "1px solid #334155", borderRadius: 4 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <Select size="small" value={filters.tool} onChange={(event) => setFilters((current) => ({ ...current, tool: event.target.value }))} sx={{ minWidth: 180, bgcolor: "#0f172a", color: "#e2e8f0" }}>
            {toolOptions.map((tool) => (
              <MenuItem key={tool} value={tool}>{tool === "all" ? "All Tools" : tool.replace(/_/g, " ")}</MenuItem>
            ))}
          </Select>
          <Select size="small" value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))} sx={{ minWidth: 170, bgcolor: "#0f172a", color: "#e2e8f0" }}>
            {roles.map((role) => (
              <MenuItem key={role} value={role}>{role === "all" ? "All Roles" : role}</MenuItem>
            ))}
          </Select>
          <Select size="small" value={filters.success} onChange={(event) => setFilters((current) => ({ ...current, success: event.target.value }))} sx={{ minWidth: 160, bgcolor: "#0f172a", color: "#e2e8f0" }}>
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
          <Button
            variant="outlined"
            startIcon={<RestartAltRoundedIcon />}
            onClick={resetFilters}
            disabled={loading}
            sx={{ color: "#c4b5fd", borderColor: "#7c3aed", fontWeight: 900 }}
          >
            {loading ? "Resetting..." : "Reset"}
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ overflow: "hidden", bgcolor: "#1e293b", border: "1px solid #334155", borderRadius: 4 }}>
        <Box sx={{ overflowX: "auto" }}>
          <Box component="table" sx={{ width: "100%", minWidth: 880, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Time", "User", "Tool", "Status", "Tokens"].map((header) => (
                  <Box component="th" key={header} sx={{ p: 2, color: "#e2e8f0", textAlign: "left", bgcolor: "#0f172a" }}>
                    {header}
                  </Box>
                ))}
              </tr>
            </thead>
            <tbody>
              {!logs.length && !loading ? (
                <tr>
                  <Box component="td" colSpan={5} sx={{ p: 4, textAlign: "center", color: "#64748b" }}>
                    No audit logs found. Use BugBot once, then refresh.
                  </Box>
                </tr>
              ) : null}
              {logs.map((log) => {
                const failed = log.success !== true;
                const toolLabel = String(log.toolName || "unknown_action").replace(/_/g, " ");
                return (
                  <Box
                    component="tr"
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    sx={{
                      cursor: "pointer",
                      bgcolor: failed ? "rgba(248,113,113,0.08)" : "transparent",
                      borderTop: "1px solid #334155",
                      "&:hover": { bgcolor: "rgba(124,58,237,0.12)" },
                    }}
                  >
                    <Box component="td" sx={{ p: 2, color: "#e2e8f0" }}>{formatTimeAgo(log.timestamp)}</Box>
                    <Box component="td" sx={{ p: 2 }}>
                      <Typography sx={{ color: "#e2e8f0", fontWeight: 900 }}>{log.userId?.name || "Unknown"}</Typography>
                      <Chip size="small" label={log.userId?.role || "unknown"} color={roleColor(log.userId?.role)} sx={{ mt: 0.5, textTransform: "capitalize" }} />
                    </Box>
                    <Box component="td" sx={{ p: 2, color: "#e2e8f0" }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Chip size="small" label={toolIcons[log.toolName] || "TOOL"} sx={{ bgcolor: "#0f172a", color: "#c4b5fd", fontWeight: 900 }} />
                        <span>{toolLabel}</span>
                      </Stack>
                    </Box>
                    <Box component="td" sx={{ p: 2 }}>
                      <Chip size="small" label={failed ? "Failed" : "Success"} color={failed ? "error" : "success"} />
                    </Box>
                    <Box component="td" sx={{ p: 2, color: "#e2e8f0" }}>{formatNumber(log.tokensUsed)}</Box>
                  </Box>
                );
              })}
            </tbody>
          </Box>
        </Box>
        <Divider sx={{ borderColor: "#334155" }} />
        <Stack direction="row" spacing={1.5} sx={{ p: 2, justifyContent: "flex-end", alignItems: "center" }}>
          <Button disabled={pagination.page <= 1 || loading} onClick={() => loadLogs(pagination.page - 1)} sx={{ color: "#c4b5fd" }}>
            Previous
          </Button>
          <Typography sx={{ color: "#e2e8f0" }}>Page {pagination.page} of {pagination.totalPages || 1}</Typography>
          <Button disabled={pagination.page >= pagination.totalPages || loading} onClick={() => loadLogs(pagination.page + 1)} sx={{ color: "#c4b5fd" }}>
            Next
          </Button>
        </Stack>
      </Paper>

      <Dialog open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "#0f172a", color: "#e2e8f0" }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            Audit Detail
            <Button startIcon={<CloseRoundedIcon />} onClick={() => setSelectedLog(null)} sx={{ color: "#c4b5fd" }}>
              Close
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#1e293b", borderColor: "#334155" }}>
          <Stack spacing={1.5}>
            <Typography sx={{ color: "#e2e8f0" }}><strong>Tool:</strong> {String(selectedLog?.toolName || "").replace(/_/g, " ")}</Typography>
            <Typography sx={{ color: "#e2e8f0" }}><strong>User:</strong> {selectedLog?.userId?.name || "Unknown"} ({selectedLog?.userId?.role || "unknown"})</Typography>
            <Typography sx={{ color: "#e2e8f0" }}><strong>Time:</strong> {selectedLog?.timestamp ? new Date(selectedLog.timestamp).toLocaleString() : "Unknown"}</Typography>
            <Typography sx={{ color: selectedLog?.success ? "#4ade80" : "#f87171" }}><strong>Status:</strong> {selectedLog?.success ? "Success" : "Failed"}</Typography>
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#0f172a", color: "#e2e8f0" }}>
              <Typography sx={{ mb: 0.5, color: "#64748b", fontWeight: 900 }}>Input Summary</Typography>
              <Typography>{summarizeInput(selectedLog?.toolInput)}</Typography>
            </Box>
            {selectedLog?.errorMessage ? (
              <Box sx={{ p: 2, borderRadius: 3, bgcolor: "rgba(248,113,113,0.12)", color: "#f87171" }}>
                <Typography sx={{ fontWeight: 900 }}>Error</Typography>
                <Typography>{selectedLog.errorMessage}</Typography>
              </Box>
            ) : null}
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
