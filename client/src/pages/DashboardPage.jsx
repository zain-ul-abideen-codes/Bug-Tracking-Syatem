import { useEffect, useState } from "react";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import { Alert, Box, Chip, Grid, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { getDashboard } from "../api/dashboardApi";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatCard from "../components/common/StatCard";
import DashboardCharts from "../components/charts/DashboardCharts";
import useAuth from "../hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await getDashboard();
        setDashboard(data);
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Stack spacing={3}>
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          overflow: "hidden",
          position: "relative",
          background:
            "radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 24%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(31,111,120,0.95) 56%, rgba(14,116,144,0.88))",
          color: "white",
        }}
      >
        <Stack spacing={2}>
          <Typography sx={{ textTransform: "uppercase", letterSpacing: "0.16em", opacity: 0.8 }}>
            Delivery Command Center
          </Typography>
          <Typography variant="h4">Track delivery health, unblock teams, and keep every release visible.</Typography>
          <Typography sx={{ maxWidth: 920, color: "rgba(255,255,255,0.78)" }}>
            Personalized analytics for {user.role} with issue movement, completion pressure, and project distribution.
          </Typography>
          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
            <Chip icon={<InsightsRoundedIcon />} label="Executive visibility" sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "white" }} />
            <Chip icon={<TrackChangesRoundedIcon />} label="Workflow monitoring" sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "white" }} />
            <Chip icon={<AutoGraphRoundedIcon />} label="Trend-first insights" sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "white" }} />
          </Stack>
        </Stack>
      </Paper>
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} lg={2}>
          <StatCard label="Projects" value={dashboard.metrics.projectCount} tone="default" helper="Active delivery spaces" />
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <StatCard label="All Issues" value={dashboard.metrics.issueCount} tone="accent" helper="Total visible issues" />
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <StatCard label="Open Work" value={dashboard.metrics.openCount} tone="warning" helper="New and in progress" />
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <StatCard label="Done" value={dashboard.metrics.completedCount} tone="success" helper="Resolved and completed" />
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <StatCard label="Overdue" value={dashboard.metrics.overdueCount} tone="danger" helper="Need attention now" />
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <StatCard label="Assigned To Me" value={dashboard.metrics.assignedToMeCount} tone="teal" helper="Personal ownership" />
        </Grid>
      </Grid>
      <DashboardCharts charts={dashboard.charts} />
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5">Recent Issues</Typography>
            <Typography color="text.secondary">Latest work items visible to your role.</Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>Deadline</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboard.recentIssues.map((issue) => (
                <TableRow key={issue._id}>
                  <TableCell>{issue.title}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{issue.type}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={issue.status}
                      sx={{ textTransform: "capitalize" }}
                      color={
                        ["resolved", "completed"].includes(issue.status)
                          ? "success"
                          : issue.status === "reopened"
                            ? "error"
                            : issue.status === "started"
                              ? "info"
                              : "warning"
                      }
                    />
                  </TableCell>
                  <TableCell>{issue.project?.title || "Unknown"}</TableCell>
                  <TableCell>{issue.assignedDeveloper?.name || "Unassigned"}</TableCell>
                  <TableCell>{issue.deadline ? new Date(issue.deadline).toLocaleDateString() : "No deadline"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </Paper>
    </Stack>
  );
}
