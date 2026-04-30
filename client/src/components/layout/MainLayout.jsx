import { useMemo, useState } from "react";
import {
  alpha,
  AppBar,
  Avatar,
  Badge,
  Box,
  Breadcrumbs,
  Chip,
  Collapse,
  Divider,
  Drawer,
  Fade,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  AccountCircleRounded,
  BugReportRounded,
  ChevronRightRounded,
  DashboardRounded,
  DarkModeRounded,
  ExpandLessRounded,
  ExpandMoreRounded,
  FolderRounded,
  LightModeRounded,
  LogoutRounded,
  MenuRounded,
  NotificationsRounded,
  PeopleRounded,
  SearchRounded,
  SettingsRounded,
  SmartToyRounded,
  GavelRounded,
} from "@mui/icons-material";
import { Link as RouterLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { useThemeMode } from "../../context/ThemeModeContext";
import { useNotification } from "../../context/NotificationContext";

const drawerWidth = 260;

const navConfig = {
  administrator: [
    { label: "Dashboard", icon: <DashboardRounded />, to: "/" },
    {
      label: "Projects",
      icon: <FolderRounded />,
      children: [
        { label: "All Projects", to: "/projects" },
        { label: "Project Details", to: "/projects/overview" },
      ],
    },
    { label: "Issues", icon: <BugReportRounded />, to: "/bugs" },
    { label: "Users", icon: <PeopleRounded />, to: "/users" },
    { label: "AI Agent", icon: <SmartToyRounded />, to: "/agent" },
    { label: "AI Audit", icon: <GavelRounded />, to: "/agent/audit" },
  ],
  manager: [
    { label: "Dashboard", icon: <DashboardRounded />, to: "/" },
    {
      label: "Projects",
      icon: <FolderRounded />,
      children: [
        { label: "All Projects", to: "/projects" },
      ],
    },
    { label: "Issues", icon: <BugReportRounded />, to: "/bugs" },
    { label: "AI Agent", icon: <SmartToyRounded />, to: "/agent" },
  ],
  qa: [
    { label: "Dashboard", icon: <DashboardRounded />, to: "/" },
    { label: "Projects", icon: <FolderRounded />, to: "/projects" },
    { label: "Issues", icon: <BugReportRounded />, to: "/bugs" },
    { label: "AI Agent", icon: <SmartToyRounded />, to: "/agent" },
  ],
  developer: [
    { label: "Dashboard", icon: <DashboardRounded />, to: "/" },
    { label: "Assigned Issues", icon: <BugReportRounded />, to: "/bugs" },
    { label: "AI Agent", icon: <SmartToyRounded />, to: "/agent" },
  ],
};

const routeNameMap = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/projects/overview": "Project Details",
  "/bugs": "Issues",
  "/users": "User Management",
  "/agent": "AI Agent",
  "/agent/audit": "AI Audit",
};

function SearchField({ mobile = false, open = true, onToggle }) {
  if (mobile && !open) {
    return (
      <Tooltip title="Search">
        <IconButton onClick={onToggle} color="inherit">
          <SearchRounded />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <TextField
      placeholder="Search issues, projects, or people"
      size="small"
      sx={{
        width: { xs: "100%", md: 360 },
        "& .MuiOutlinedInput-root": {
          bgcolor: (theme) => alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.12 : 0.88),
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchRounded fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useThemeMode();
  const { notify } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [openSections, setOpenSections] = useState({ Projects: true });

  const navItems = navConfig[user?.role] || [];
  const currentTitle = routeNameMap[location.pathname] || "Workspace";

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);

    if (!segments.length) {
      return [{ label: "Dashboard", to: "/" }];
    }

    return segments.map((segment, index) => {
      const to = `/${segments.slice(0, index + 1).join("/")}`;
      return {
        label: routeNameMap[to] || segment.replace(/-/g, " "),
        to,
      };
    });
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
            <BugReportRounded />
          </Avatar>
          <Box>
            <Typography variant="h6">BugTracker Pro</Typography>
            <Typography variant="body2" color="text.secondary">
              Delivery workspace
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: "secondary.main", width: 46, height: 46 }}>
            {user?.name?.charAt(0) || "U"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} noWrap>
              {user?.name}
            </Typography>
            <Chip
              size="small"
              label={user?.role}
              color="primary"
              sx={{ mt: 0.75, textTransform: "capitalize" }}
            />
          </Box>
        </Stack>
      </Box>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {navItems.map((item) => {
          const hasChildren = Boolean(item.children?.length);
          const active = item.to ? location.pathname === item.to : item.children?.some((child) => location.pathname.startsWith(child.to));

          if (hasChildren) {
            const open = openSections[item.label];
            return (
              <Box key={item.label}>
                <ListItemButton
                  onClick={() => setOpenSections((current) => ({ ...current, [item.label]: !current[item.label] }))}
                  sx={{
                    borderRadius: 2.5,
                    mb: 0.5,
                    bgcolor: active ? alpha(theme.palette.primary.main, 0.12) : "transparent",
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: active ? 700 : 500 }}
                  />
                  {open ? <ExpandLessRounded /> : <ExpandMoreRounded />}
                </ListItemButton>
                <Collapse in={open} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 2 }}>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.to}
                        component={RouterLink}
                        to={child.to}
                        selected={location.pathname === child.to}
                        onClick={() => setDrawerOpen(false)}
                        sx={{ borderRadius: 2, mb: 0.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <ChevronRightRounded fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={child.label} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          }

          return (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={location.pathname === item.to}
              onClick={() => setDrawerOpen(false)}
              sx={{
                borderRadius: 2.5,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.primary.main, 0.14),
                  color: "primary.main",
                  "& .MuiListItemIcon-root": {
                    color: "primary.main",
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: location.pathname === item.to ? 700 : 500 }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ p: 2.5 }}>
        <Typography variant="caption" color="text.secondary">
          Version 1.0.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={3}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ gap: 2, minHeight: "78px !important" }}>
          <IconButton color="inherit" onClick={() => setDrawerOpen(true)} sx={{ display: { md: "none" } }}>
            <MenuRounded />
          </IconButton>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ display: { xs: "none", sm: "flex", md: "none" } }}>
            <BugReportRounded color="primary" />
            <Typography variant="h6">BugTracker Pro</Typography>
          </Stack>
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
            {isMobile ? (
              <SearchField mobile open={searchOpen} onToggle={() => setSearchOpen((current) => !current)} />
            ) : (
              <SearchField />
            )}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={mode === "light" ? "Dark mode" : "Light mode"}>
              <IconButton color="inherit" onClick={toggleColorMode}>
                {mode === "light" ? <DarkModeRounded /> : <LightModeRounded />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={() => notify("Notifications center is coming soon.", "info")}>
                <Badge color="error" variant="dot">
                  <NotificationsRounded />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Account">
              <IconButton color="inherit" onClick={(event) => setMenuAnchor(event.currentTarget)}>
                <Avatar sx={{ bgcolor: "primary.main", width: 38, height: 38 }}>
                  {user?.name?.charAt(0) || "U"}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem onClick={() => { setMenuAnchor(null); notify("Profile page is coming soon.", "info"); }}>
                <ListItemIcon><AccountCircleRounded fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => { setMenuAnchor(null); notify("Settings panel is coming soon.", "info"); }}>
                <ListItemIcon><SettingsRounded fontSize="small" /></ListItemIcon>
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
        <Toolbar sx={{ minHeight: "78px !important" }} />
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
          <Stack spacing={1.2} sx={{ mb: 3 }}>
            <Breadcrumbs separator="›" aria-label="breadcrumb">
              <Typography
                component={RouterLink}
                to="/"
                sx={{ textDecoration: "none", color: "text.secondary" }}
              >
                Home
              </Typography>
              {breadcrumbs.map((item, index) => (
                index === breadcrumbs.length - 1 ? (
                  <Typography key={item.to} color="text.primary" fontWeight={600}>
                    {item.label}
                  </Typography>
                ) : (
                  <Typography
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    sx={{ textDecoration: "none", color: "text.secondary" }}
                  >
                    {item.label}
                  </Typography>
                )
              ))}
            </Breadcrumbs>
            <Typography variant="h5" fontWeight={700}>
              {currentTitle}
            </Typography>
          </Stack>
          <Fade in timeout={350}>
            <Box>
              <Outlet />
            </Box>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
}
