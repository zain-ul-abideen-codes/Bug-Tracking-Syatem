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
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { getBugs } from "../api/bugsApi";
import { getProjects } from "../api/projectsApi";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import PageHeader from "../components/common/PageHeader";
import PageSkeleton from "../components/common/PageSkeleton";
import EmptyState from "../components/common/EmptyState";

const titleByRole = {
  manager: "Projects you manage and coordinate",
  qa: "Projects assigned to your QA workspace",
  developer: "Projects assigned to your delivery queue",
};

const subtitleByRole = {
  manager: "Review the projects under your ownership and track the team aligned to each one.",
  qa: "See every project where you are assigned for validation, testing, and issue reporting.",
  developer: "See every project currently assigned to you along with the linked team members.",
};

export default function AssignedProjectsPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { notify } = useNotification();
  const [projects, setProjects] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search")?.trim().toLowerCase() || "";

  useEffect(() => {
    const loadAssignedProjects = async () => {
      try {
        setLoading(true);
        setError("");
        const [projectData, bugData] = await Promise.all([
          getProjects(accessToken),
          getBugs(accessToken),
        ]);
        setProjects(projectData);
        setBugs(bugData);
      } catch (loadError) {
        const message = loadError.response?.data?.message || "Unable to load assigned projects.";
        setError(message);
        if (loadError.response?.status !== 401 && message !== "Authentication required.") {
          notify(message, "error");
        }
      } finally {
        setLoading(false);
      }
    };

    if (authLoading) {
      return undefined;
    }

    if (!accessToken) {
      setLoading(false);
      setError("Authentication required.");
      return undefined;
    }

    loadAssignedProjects();
    return undefined;
  }, [accessToken, authLoading, notify]);

  const bugCountByProject = useMemo(
    () =>
      bugs.reduce((accumulator, bug) => {
        const projectId = bug.project?._id;
        if (!projectId) {
          return accumulator;
        }
        accumulator[projectId] = (accumulator[projectId] || 0) + 1;
        return accumulator;
      }, {}),
    [bugs],
  );

  const filteredProjects = useMemo(() => {
    if (!searchQuery) {
      return projects;
    }

    return projects.filter((project) =>
      [project.title, project.description, project.manager?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchQuery),
    );
  }, [projects, searchQuery]);

  const pageTitle = titleByRole[user?.role] || "Projects assigned to your workspace";
  const pageSubtitle =
    subtitleByRole[user?.role] ||
    "Review the projects currently assigned to your role and open them directly from here.";

  if (loading || authLoading) {
    return <PageSkeleton cards={6} rows={0} />;
  }

  return (
    <Stack spacing={3} className="page-fade-in">
      <PageHeader
        eyebrow="Assigned Projects"
        title={pageTitle}
        subtitle={pageSubtitle}
      />

      {error ? (
        <EmptyState icon={FolderRoundedIcon} title="Assigned projects unavailable" subtitle={error} />
      ) : !filteredProjects.length ? (
        <EmptyState
          icon={FolderRoundedIcon}
          title={searchQuery ? "No matching assigned projects" : "No assigned projects"}
          subtitle={
            searchQuery
              ? "Try a different search term to find the assigned project you need."
              : "Projects assigned to your account will appear here once they are linked to your workspace role."
          }
        />
      ) : (
        <Grid container spacing={2.5} sx={{ alignItems: "stretch" }}>
          {filteredProjects.map((project) => {
            const teamMembers = [project.manager, ...(project.qaEngineers || []), ...(project.developers || [])].filter(Boolean);

            return (
              <Grid key={project._id} size={{ xs: 12, sm: 6, xl: 4 }} sx={{ display: "flex" }}>
                <Paper sx={{ p: 3, width: "100%", display: "flex", minHeight: 352 }}>
                  <Stack spacing={2.5} sx={{ height: "100%", width: "100%" }}>
                    <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Avatar sx={{ bgcolor: "primary.main", width: 54, height: 54 }}>
                        <FolderRoundedIcon />
                      </Avatar>
                      <Chip
                        label={`${bugCountByProject[project._id] || 0} issues`}
                        color="primary"
                        variant="outlined"
                      />
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

                    <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Manager
                        </Typography>
                        <Typography
                          fontWeight={700}
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

                    <Button
                      component={RouterLink}
                      to={`/projects/${project._id}`}
                      variant="contained"
                      startIcon={<VisibilityRoundedIcon />}
                      sx={{ mt: "auto", alignSelf: "flex-start" }}
                    >
                      View Details
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Stack>
  );
}
