import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Fab,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  Chip,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { Link as RouterLink } from "react-router-dom";
import { getUsers } from "../api/usersApi";
import { createProject, deleteProject, getProjects, updateProject } from "../api/projectsApi";
import { getBugs } from "../api/bugsApi";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import PageHeader from "../components/common/PageHeader";
import PageSkeleton from "../components/common/PageSkeleton";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ProjectModal from "../components/modals/ProjectModal";
import EmptyState from "../components/common/EmptyState";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [projects, setProjects] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dialog, setDialog] = useState("");

  const canManageProjects = ["administrator", "manager"].includes(user.role);

  const loadPage = async () => {
    try {
      setLoading(true);
      const [projectData, bugData, userData] = await Promise.all([
        getProjects(),
        getBugs(),
        canManageProjects ? getUsers() : Promise.resolve([]),
      ]);
      setProjects(projectData);
      setBugs(bugData);
      setUsers(userData);
    } catch (error) {
      notify(error.response?.data?.message || "Unable to load projects.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const bugCountByProject = useMemo(() => {
    return bugs.reduce((accumulator, bug) => {
      const projectId = bug.project?._id;
      if (!projectId) return accumulator;
      accumulator[projectId] = (accumulator[projectId] || 0) + 1;
      return accumulator;
    }, {});
  }, [bugs]);

  const handleProjectSubmit = async (payload) => {
    try {
      setSubmitLoading(true);
      if (selectedProject) {
        await updateProject(selectedProject._id, payload);
        notify("Project updated successfully.", "success");
      } else {
        await createProject(payload);
        notify("Project created successfully.", "success");
      }
      setDialog("");
      setSelectedProject(null);
      await loadPage();
    } catch (error) {
      notify(error.response?.data?.message || "Unable to save project.", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteProject(selectedProject._id);
      notify("Project deleted successfully.", "success");
      setDialog("");
      setSelectedProject(null);
      await loadPage();
    } catch (error) {
      notify(error.response?.data?.message || "Unable to delete project.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <PageSkeleton cards={6} rows={0} />;

  return (
    <Stack spacing={3} className="page-fade-in">
      <PageHeader
        eyebrow="Workspace"
        title="Projects, ownership, and team alignment"
        subtitle="Browse every delivery stream, see team assignments, and jump into detailed project views."
      />

      {!projects.length ? (
        <EmptyState icon={FolderRoundedIcon} title="No projects yet" subtitle="Create the first project to start assigning QA engineers, developers, and issues." />
      ) : (
        <Grid container spacing={2.5} alignItems="stretch">
          {projects.map((project) => {
            const teamMembers = [project.manager, ...(project.qaEngineers || []), ...(project.developers || [])].filter(Boolean);
            return (
              <Grid key={project._id} item xs={12} sm={6} lg={4} sx={{ display: "flex" }}>
                <Paper
                  sx={{
                    p: 3,
                    width: "100%",
                    minHeight: 360,
                    height: "100%",
                    display: "flex",
                  }}
                >
                  <Stack spacing={2.5} sx={{ height: "100%" }}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Avatar sx={{ bgcolor: "primary.main", width: 54, height: 54 }}>
                        <FolderRoundedIcon />
                      </Avatar>
                      <Chip label={`${bugCountByProject[project._id] || 0} bugs`} color="primary" variant="outlined" />
                    </Stack>

                    <Box sx={{ minHeight: 108 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          minHeight: 64,
                        }}
                      >
                        {project.title}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{
                          mt: 1,
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

                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="flex-start"
                      justifyContent="space-between"
                      sx={{ minHeight: 74 }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">Manager</Typography>
                        <Typography
                          fontWeight={600}
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {project.manager?.name || "Unassigned"}
                        </Typography>
                      </Box>
                      <AvatarGroup max={4} sx={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                        {teamMembers.map((member) => (
                          <Avatar key={`${project._id}-${member._id}`} sx={{ bgcolor: "secondary.main" }}>
                            {member.name?.charAt(0)}
                          </Avatar>
                        ))}
                      </AvatarGroup>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ mt: "auto", pt: 1 }}>
                      <Button
                        component={RouterLink}
                        to={`/projects/${project._id}`}
                        variant="contained"
                        startIcon={<VisibilityRoundedIcon />}
                      >
                        View Details
                      </Button>
                      {canManageProjects ? (
                        <>
                          <Tooltip title="Edit project">
                            <IconButton onClick={() => { setSelectedProject(project); setDialog("project"); }}>
                              <EditRoundedIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete project">
                            <IconButton color="error" onClick={() => { setSelectedProject(project); setDialog("delete"); }}>
                              <DeleteRoundedIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : null}
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {canManageProjects ? (
        <Fab color="primary" sx={{ position: "fixed", right: 28, bottom: 28 }} onClick={() => { setSelectedProject(null); setDialog("project"); }}>
          <AddRoundedIcon />
        </Fab>
      ) : null}

      <ProjectModal
        open={dialog === "project"}
        loading={submitLoading}
        project={selectedProject}
        users={users}
        currentRole={user.role}
        onClose={() => setDialog("")}
        onSubmit={handleProjectSubmit}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        loading={deleteLoading}
        title="Delete project"
        description={`Delete ${selectedProject?.title || "this project"}? This will remove the project record from the system.`}
        confirmLabel="Delete"
        onClose={() => setDialog("")}
        onConfirm={handleDelete}
      />
    </Stack>
  );
}
