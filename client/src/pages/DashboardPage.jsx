import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  BugReportRounded,
  CheckCircleRounded,
  FolderOpenRounded,
  FolderRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { Link as RouterLink } from "react-router-dom";
import { getDashboard } from "../api/dashboardApi";
import { getProjects } from "../api/projectsApi";
import DashboardCharts from "../components/charts/DashboardCharts";
import PageHeader from "../components/common/PageHeader";
import PageSkeleton from "../components/common/PageSkeleton";
import EmptyState from "../components/common/EmptyState";
import useAuth from "../hooks/useAuth";

function SummaryCard({ icon, label, value, chip, color }) {
  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
        <Stack spacing={1}>
          <Typography color="text.secondary">{label}</Typography>
          <Typography variant="h4">{value}</Typography>
          <Chip size="small" label={chip} color={color} sx={{ alignSelf: "flex-start" }} />
        </Stack>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Stack>
    </Paper>
  );
}

export default function DashboardPage() {
  const { accessToken, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) {
      return undefined;
    }

    if (!accessToken) {
      setLoading(false);
      setError("Authentication required.");
      return undefined;
    }

    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const [data, projectData] = await Promise.all([
          getDashboard(accessToken),
          getProjects(accessToken),
        ]);
        if (!active) {
          return;
        }
        setDashboard(data);
        setAssignedProjects(projectData);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError.response?.data?.message || "Unable to load dashboard.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [accessToken, authLoading]);
  

  const resolvedToday = useMemo(() => {
    if (!dashboard?.recentIssues) return 0;
    const today = new Date().toDateString();
    return dashboard.recentIssues.filter(
      (issue) =>
        ["resolved", "completed"].includes(issue.status) &&
        new Date(issue.updatedAt || issue.createdAt).toDateString() === today,
    ).length;
  }, [dashboard]);

  if (loading || authLoading) return <PageSkeleton />;

  if (error) {
    return <EmptyState title="Dashboard unavailable" subtitle={error} icon={WarningAmberRounded} />;
  }

  return (
    <Stack spacing={3} className="page-fade-in">
      <PageHeader
        eyebrow="Command Center"
        title="Delivery overview and active signals"
        subtitle="Monitor bugs, track project load, and see what changed most recently."
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard icon={<BugReportRounded />} label="Total Bugs" value={dashboard.metrics.issueCount} chip="+5 this week" color="error" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard icon={<FolderRounded />} label="Total Projects" value={dashboard.metrics.projectCount} chip="Scope under watch" color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard icon={<WarningAmberRounded />} label="Open Issues" value={dashboard.metrics.openCount} chip="Needs attention" color="warning" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard icon={<CheckCircleRounded />} label="Resolved Today" value={resolvedToday} chip="Healthy flow" color="success" />
        </Grid>
      </Grid>

      <DashboardCharts charts={dashboard.charts} />

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6">Assigned Projects</Typography>
            <Typography color="text.secondary">
              Projects currently visible to your workspace role.
            </Typography>
          </Box>

          {!assignedProjects.length ? (
            <EmptyState
              icon={FolderOpenRounded}
              title="No assigned projects"
              subtitle="Projects linked to your account will appear here once they are assigned."
            />
          ) : (
            <Grid container spacing={2.5}>
              {assignedProjects.slice(0, 6).map((project) => {
                const teamMembers = [project.manager, ...(project.qaEngineers || []), ...(project.developers || [])].filter(Boolean);

                return (
                  <Grid key={project._id} size={{ xs: 12, md: 6, xl: 4 }} sx={{ display: "flex" }}>
                    <Paper variant="outlined" sx={{ p: 2.5, width: "100%", display: "flex" }}>
                      <Stack spacing={2} sx={{ width: "100%" }}>
                        <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Avatar sx={{ bgcolor: "primary.main", width: 46, height: 46 }}>
                            <FolderRounded />
                          </Avatar>
                          <AvatarGroup max={4}>
                            {teamMembers.map((member) => (
                              <Avatar key={`${project._id}-${member._id}`} sx={{ width: 30, height: 30, bgcolor: "secondary.main" }}>
                                {member.name?.charAt(0)}
                              </Avatar>
                            ))}
                          </AvatarGroup>
                        </Stack>

                        <Box>
                          <Typography variant="h6">{project.title}</Typography>
                          <Typography
                            color="text.secondary"
                            sx={{
                              mt: 0.75,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              minHeight: 44,
                            }}
                          >
                            {project.description || "No description provided for this project yet."}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center", mt: "auto" }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Manager</Typography>
                            <Typography fontWeight={700}>{project.manager?.name || "Unassigned"}</Typography>
                          </Box>
                          <Button
                            component={RouterLink}
                            to={`/projects/${project._id}`}
                            variant="contained"
                            size="small"
                            startIcon={<VisibilityRoundedIcon />}
                          >
                            View
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6">Recent Activity</Typography>
            <Typography color="text.secondary">Latest issue movement across your visible workspace.</Typography>
          </Box>
          <Stack spacing={2}>
            {dashboard.recentIssues.slice(0, 10).map((issue) => (
              <Stack key={issue._id} direction="row" spacing={2}>
                <Stack sx={{ pt: 0.5, alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: ["resolved", "completed"].includes(issue.status) ? "success.main" : "primary.main", width: 38, height: 38 }}>
                    {issue.title?.charAt(0)}
                  </Avatar>
                  <Box sx={{ width: 2, flex: 1, bgcolor: "divider", mt: 1 }} />
                </Stack>
                <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                  <Typography fontWeight={700}>{issue.title}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {issue.project?.title || "Unknown project"} • {issue.status} • {issue.assignedDeveloper?.name || "Unassigned"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(issue.updatedAt || issue.createdAt).toLocaleString()}
                  </Typography>
                </Paper>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
