import { useEffect, useState } from "react";
import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { getUsers } from "../api/usersApi";
import { createProject, deleteProject, getProjects, updateProject } from "../api/projectsApi";
import useAuth from "../hooks/useAuth";
import useModal from "../hooks/useModal";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProjectModal from "../components/modals/ProjectModal";

export default function ProjectsPage() {
  const { user } = useAuth();
  const projectModal = useModal();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canManageProjects = ["administrator", "manager"].includes(user.role);

  const loadPage = async () => {
    try {
      setLoading(true);
      const [projectData, userData] = await Promise.all([
        getProjects(),
        canManageProjects ? getUsers() : Promise.resolve([]),
      ]);
      setProjects(projectData);
      setUsers(userData);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const openCreate = () => {
    setSelectedProject(null);
    projectModal.openModal();
  };

  const openEdit = (project) => {
    setSelectedProject(project);
    projectModal.openModal();
  };

  const submitProject = async (payload) => {
    if (selectedProject) {
      await updateProject(selectedProject._id, payload);
    } else {
      await createProject(payload);
    }
    projectModal.closeModal();
    await loadPage();
  };

  const handleDelete = async (id) => {
    await deleteProject(id);
    await loadPage();
  };

  if (loading) return <LoadingSpinner label="Loading projects..." />;

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
              <FolderSpecialRoundedIcon color="primary" />
              <Typography variant="h5">Projects</Typography>
            </Stack>
            <Typography color="text.secondary">Track assignments for managers, QA engineers, and developers.</Typography>
          </Box>
          {canManageProjects ? <Button onClick={openCreate}>Create Project</Button> : null}
        </Stack>
      </Paper>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box
        sx={{
          columnCount: { xs: 1, md: 2, xl: 3 },
          columnGap: 2.5,
        }}
      >
        {projects.map((project) => (
          <Box
            key={project._id}
            sx={{
              breakInside: "avoid",
              mb: 2.5,
            }}
          >
            <Paper
              sx={{
                p: 3,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(249,250,251,0.96))",
              }}
            >
              <Stack spacing={2} sx={{ height: "100%" }}>
                <Box>
                  <Typography variant="h6">{project.title}</Typography>
                  <Typography color="text.secondary">
                    {project.description || "No description provided."}
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  <Typography variant="body2"><strong>Manager:</strong> {project.manager?.name || "Unassigned"}</Typography>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                      <GroupsRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                      <Typography variant="body2"><strong>QA Engineers</strong></Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {project.qaEngineers.length
                        ? project.qaEngineers.map((member) => <Chip key={member._id} label={member.name} size="small" />)
                        : <Chip label="None" size="small" variant="outlined" />}
                    </Stack>
                  </Box>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                      <GroupsRoundedIcon sx={{ fontSize: 18, color: "secondary.main" }} />
                      <Typography variant="body2"><strong>Developers</strong></Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {project.developers.length
                        ? project.developers.map((member) => <Chip key={member._id} label={member.name} size="small" color="primary" variant="outlined" />)
                        : <Chip label="None" size="small" variant="outlined" />}
                    </Stack>
                  </Box>
                </Stack>
                {canManageProjects ? (
                  <Stack direction="row" spacing={1} sx={{ mt: "auto", pt: 1.5 }}>
                    <Button variant="secondary" onClick={() => openEdit(project)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(project._id)}>Delete</Button>
                  </Stack>
                ) : null}
              </Stack>
            </Paper>
          </Box>
        ))}
      </Box>
      {projectModal.isOpen ? (
        <ProjectModal
          project={selectedProject}
          users={users}
          currentRole={user.role}
          onClose={projectModal.closeModal}
          onSubmit={submitProject}
        />
      ) : null}
    </Stack>
  );
}
