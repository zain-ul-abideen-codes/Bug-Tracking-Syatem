import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarGroup, Button, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { Link as RouterLink } from "react-router-dom";
import { getProjects } from "../api/projectsApi";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import PageHeader from "../components/common/PageHeader";
import PageSkeleton from "../components/common/PageSkeleton";
import EmptyState from "../components/common/EmptyState";

export default function ProfilePage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { notify } = useNotification();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        const projectData = await getProjects(accessToken);
        setProjects(projectData);
      } catch (error) {
        const message = error.response?.data?.message || "Unable to load assigned projects.";
        if (error.response?.status !== 401 && message !== "Authentication required.") {
          notify(message, "error");
        }
      } finally {
        setLoadingProjects(false);
      }
    };

    if (authLoading) {
      return;
    }

    if (!accessToken) {
      setLoadingProjects(false);
      return;
    }

    loadProjects();
  }, [accessToken, authLoading, notify]);

  const profileSubtitle = useMemo(() => {
    if (user?.role === "administrator") {
      return "You can review your account details and the full delivery workspace from here.";
    }

    return "Review your account details and the projects currently assigned to your workspace role.";
  }, [user?.role]);

  if (authLoading) {
    return <PageSkeleton cards={3} rows={2} />;
  }

  return (
    <Stack spacing={3} className="page-fade-in">
      <PageHeader
        eyebrow="Account"
        title="Profile and workspace identity"
        subtitle={profileSubtitle}
      />

      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}>
            <Avatar sx={{ width: 84, height: 84, bgcolor: "primary.main", fontSize: 34 }}>
              {user?.name?.charAt(0) || "U"}
            </Avatar>
            <Stack spacing={1}>
              <Typography variant="h4">{user?.name || "Unknown User"}</Typography>
              <Chip label={user?.role || "role"} color="primary" sx={{ textTransform: "capitalize", width: "fit-content" }} />
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Paper variant="outlined" sx={{ p: 2.5, flex: 1 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <MailOutlineRoundedIcon color="primary" />
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">Email Address</Typography>
                  <Typography fontWeight={700}>{user?.email || "Not available"}</Typography>
                </Stack>
              </Stack>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2.5, flex: 1 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <BadgeRoundedIcon color="primary" />
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">Role Scope</Typography>
                  <Typography fontWeight={700} sx={{ textTransform: "capitalize" }}>{user?.role || "Not assigned"}</Typography>
                </Stack>
              </Stack>
            </Paper>
          </Stack>

          <Typography color="text.secondary">
            Your current permissions are enforced by both frontend navigation and backend RBAC checks. This page is intended as a quick overview of who you are logged in as and what workspace context you are operating in.
          </Typography>
        </Stack>
      </Paper>

      {loadingProjects ? (
        <PageSkeleton cards={3} rows={0} />
      ) : !projects.length ? (
        <EmptyState
          icon={FolderRoundedIcon}
          title="No assigned projects"
          subtitle="Projects assigned to your role will appear here once they are linked to your account."
        />
      ) : (
        <Stack spacing={2.25}>
          <Stack spacing={0.5}>
            <Typography variant="h5">Assigned Projects</Typography>
            <Typography color="text.secondary">
              These are the projects currently associated with your account.
            </Typography>
          </Stack>

          <Grid container spacing={2.5} sx={{ alignItems: "stretch" }}>
            {projects.map((project) => {
              const teamMembers = [project.manager, ...(project.qaEngineers || []), ...(project.developers || [])].filter(Boolean);

              return (
                <Grid key={project._id} size={{ xs: 12, md: 6, xl: 4 }} sx={{ display: "flex" }}>
                  <Paper sx={{ p: 3, width: "100%", display: "flex" }}>
                    <Stack spacing={2.25} sx={{ height: "100%", width: "100%" }}>
                      <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Avatar sx={{ bgcolor: "primary.main", width: 52, height: 52 }}>
                          <FolderRoundedIcon />
                        </Avatar>
                        <Chip
                          label={project.manager?._id === user?.userId || project.manager?._id === user?._id ? "Owned by you" : "Assigned"}
                          color="primary"
                          variant="outlined"
                        />
                      </Stack>

                      <Stack spacing={1}>
                        <Typography variant="h6">{project.title}</Typography>
                        <Typography
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minHeight: 44,
                          }}
                        >
                          {project.description || "No description provided for this project yet."}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "center", mt: "auto" }}>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">Manager</Typography>
                          <Typography fontWeight={700}>{project.manager?.name || "Unassigned"}</Typography>
                        </Stack>
                        <AvatarGroup max={4}>
                          {teamMembers.map((member) => (
                            <Avatar key={`${project._id}-${member._id}`} sx={{ bgcolor: "secondary.main", width: 34, height: 34 }}>
                              {member.name?.charAt(0)}
                            </Avatar>
                          ))}
                        </AvatarGroup>
                      </Stack>

                      <Button
                        component={RouterLink}
                        to={`/projects/${project._id}`}
                        variant="contained"
                        startIcon={<VisibilityRoundedIcon />}
                        sx={{ alignSelf: "flex-start" }}
                      >
                        View Details
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      )}
    </Stack>
  );
}
