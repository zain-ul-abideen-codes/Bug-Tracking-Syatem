import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import { alpha, Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const roleLinks = {
  administrator: [
    { to: "/", label: "Dashboard" },
    { to: "/users", label: "Users" },
    { to: "/projects", label: "Projects" },
    { to: "/bugs", label: "Issues" },
  ],
  manager: [
    { to: "/", label: "Dashboard" },
    { to: "/projects", label: "Projects" },
    { to: "/bugs", label: "Issues" },
  ],
  qa: [
    { to: "/", label: "Dashboard" },
    { to: "/projects", label: "Projects" },
    { to: "/bugs", label: "Issues" },
  ],
  developer: [
    { to: "/", label: "Dashboard" },
    { to: "/bugs", label: "Assigned Issues" },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const links = roleLinks[user.role] || [];
  const iconMap = {
    Dashboard: <DashboardRoundedIcon />,
    Users: <GroupRoundedIcon />,
    Projects: <FolderRoundedIcon />,
    Issues: <TaskAltRoundedIcon />,
    "Assigned Issues": <TaskAltRoundedIcon />,
  };

  return (
    <Box sx={{ p: 2.5, height: "100%", display: "grid", alignContent: "start", gap: 2 }}>
      <Box
        sx={{
          p: 2.2,
          borderRadius: 5,
          color: "white",
          background:
            "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(31,111,120,0.94) 58%, rgba(14,116,144,0.88))",
          boxShadow: "0 20px 40px rgba(15,23,42,0.18)",
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h5">Issue Pilot</Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.76)" }}>
            Bug Tracking System
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, color: "rgba(255,255,255,0.7)" }}>
            Premium delivery workspace
          </Typography>
        </Stack>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <List disablePadding>
        {links.map((link) => (
          <ListItemButton
            key={link.to}
            component={NavLink}
            to={link.to}
            end={link.to === "/"}
            sx={{
              mb: 0.75,
              borderRadius: 3,
              px: 1.25,
              py: 1,
              "&.active": {
                bgcolor: alpha("#1f6f78", 0.12),
                color: "primary.main",
                boxShadow: "inset 0 0 0 1px rgba(31,111,120,0.08)",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{iconMap[link.label]}</ListItemIcon>
            <ListItemText primary={link.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
