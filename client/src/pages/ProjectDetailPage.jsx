import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import { useParams } from "react-router-dom";
import { getProjects } from "../api/projectsApi";
import { getBugs } from "../api/bugsApi";
import PageSkeleton from "../components/common/PageSkeleton";
import EmptyState from "../components/common/EmptyState";
import BugsPage from "./BugsPage";

function StatMiniCard({ label, value }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ mt: 1 }}>{value}</Typography>
    </Paper>
  );
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      const [projects, issues] = await Promise.all([getProjects(), getBugs()]);
      const matchedProject = projectId ? projects.find((record) => record._id === projectId) : projects[0] || null;
      setProject(matchedProject);
      setBugs(issues);
      setLoading(false);
    };

    loadPage();
  }, [projectId]);

  const projectBugs = useMemo(
    () => bugs.filter((bug) => bug.project?._id === project?._id),
    [bugs, project],
  );

  const openCount = projectBugs.filter((bug) => ["new", "started", "reopened"].includes(bug.status)).length;
  const doneCount = projectBugs.filter((bug) => ["resolved", "completed"].includes(bug.status)).length;

  if (loading) return <PageSkeleton cards={3} rows={5} />;

  if (!project) {
    return <EmptyState icon={FolderRoundedIcon} title="Project not found" subtitle="Select a project from the projects page to see details." />;
  }

  return (
    <Stack spacing={3} className="page-fade-in">
      <Paper sx={{ p: 3.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "primary.main", width: 60, height: 60 }}>
              <FolderRoundedIcon />
            </Avatar>
            <Box>
              <Typography variant="h4">{project.title}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                {project.description || "No project description provided."}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`Manager: ${project.manager?.name || "Unassigned"}`} color="primary" variant="outlined" />
            <Chip label={`${project.qaEngineers?.length || 0} QA engineers`} />
            <Chip label={`${project.developers?.length || 0} developers`} />
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 1 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="Overview" />
          <Tab label="Bugs" />
          <Tab label="Team Members" />
        </Tabs>
      </Paper>

      {tab === 0 ? (
        <Stack spacing={2.5}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <StatMiniCard label="Total Issues" value={projectBugs.length} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatMiniCard label="Open Issues" value={openCount} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatMiniCard label="Completed" value={doneCount} />
            </Grid>
          </Grid>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Mini overview</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              This project currently has {projectBugs.length} visible issues, with {openCount} still active and {doneCount} already completed or resolved.
            </Typography>
          </Paper>
        </Stack>
      ) : null}

      {tab === 1 ? <BugsPage projectId={project._id} embedded /> : null}

      {tab === 2 ? (
        <Paper sx={{ p: 2 }}>
          <List>
            {[project.manager, ...(project.qaEngineers || []), ...(project.developers || [])]
              .filter(Boolean)
              .map((member) => (
                <ListItem key={member._id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "secondary.main" }}>{member.name?.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.name}
                    secondary={member.email || member.role}
                  />
                  <Chip label={member.role || "manager"} color="primary" sx={{ textTransform: "capitalize" }} />
                </ListItem>
              ))}
          </List>
        </Paper>
      ) : null}
    </Stack>
  );
}
