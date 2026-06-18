import { useEffect, useMemo, useState } from "react";
import {
  alpha,
  AppBar,
  Avatar,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Divider,
  Drawer,
  Fade,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
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
  DashboardRounded,
  DarkModeRounded,
  DeleteSweepRounded,
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
    { label: "Projects", icon: <FolderRounded />, to: "/projects" },
    { label: "Issues", icon: <BugReportRounded />, to: "/bugs" },
    { label: "Users", icon: <PeopleRounded />, to: "/users" },
    { label: "BugBot", icon: <SmartToyRounded />, to: "/agent" },
    { label: "Audit Logs", icon: <GavelRounded />, to: "/audit-logs" },
    { label: "Profile", icon: <AccountCircleRounded />, to: "/profile" },
    { label: "Settings", icon: <SettingsRounded />, to: "/settings" },
  ],
  manager: [
    { label: "Dashboard", icon: <DashboardRounded />, to: "/" },
    { label: "Assigned Projects", icon: <FolderRounded />, to: "/assigned-projects" },
    { label: "Projects", icon: <FolderRounded />, to: "/projects" },
    { label: "Issues", icon: <BugReportRounded />, to: "/bugs" },
    { label: "BugBot", icon: <SmartToyRounded />, to: "/agent" },
    { label: "Profile", icon: <AccountCircleRounded />, to: "/profile" },
    { label: "Settings", icon: <SettingsRounded />, to: "/settings" },
  ],
  qa: [
    { label: "Dashboard", icon: <DashboardRounded />, to: "/" },
    { label: "Assigned Projects", icon: <FolderRounded />, to: "/assigned-projects" },
    { label: "Issues", icon: <BugReportRounded />, to: "/bugs" },
    { label: "BugBot", icon: <SmartToyRounded />, to: "/agent" },
    { label: "Profile", icon: <AccountCircleRounded />, to: "/profile" },
    { label: "Settings", icon: <SettingsRounded />, to: "/settings" },
  ],
  developer: [
    { label: "Dashboard", icon: <DashboardRounded />, to: "/" },
    { label: "Assigned Projects", icon: <FolderRounded />, to: "/assigned-projects" },
    { label: "Assigned Issues", icon: <BugReportRounded />, to: "/bugs" },
    { label: "BugBot", icon: <SmartToyRounded />, to: "/agent" },
    { label: "Profile", icon: <AccountCircleRounded />, to: "/profile" },
    { label: "Settings", icon: <SettingsRounded />, to: "/settings" },
  ],
};

const routeNameMap = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/assigned-projects": "Assigned Projects",
  "/projects/overview": "Project Details",
  "/bugs": "Issues",
  "/users": "User Management",
  "/agent": "BugBot",
  "/agent/audit": "Audit Logs",
  "/audit-logs": "Audit Logs",
  "/profile": "Profile",
  "/settings": "Settings",
};

function SearchField({
  mobile = false,
  open = true,
  onToggle,
  value,
  onChange,
  onKeyDown,
  onSubmit,
}) {
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
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      sx={{
        width: { xs: "100%", md: 360 },
        "& .MuiOutlinedInput-root": {
          bgcolor: (theme) => alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.12 : 0.88),
        },
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <Button size="small" onClick={onSubmit}>
                Search
              </Button>
            </InputAdornment>
          ) : null,
        },
      }}
    />
  );
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useThemeMode();
  const { history, unreadCount, markAllAsRead, removeNotification, clearHistory } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  const navItems = navConfig[user?.role] || [];
  const currentTitle = routeNameMap[location.pathname] || "Workspace";
  const searchTarget = useMemo(() => {
    if (location.pathname.startsWith("/users")) {
      return "/users";
    }

    if (location.pathname.startsWith("/assigned-projects")) {
      return "/assigned-projects";
    }

    if (location.pathname.startsWith("/projects")) {
      return "/projects";
    }

    return "/bugs";
  }, [location.pathname]);

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchValue(params.get("search") || "");
  }, [location.pathname, location.search]);

  const handleSearchSubmit = () => {
    const trimmedQuery = searchValue.trim();
    navigate({
      pathname: searchTarget,
      search: trimmedQuery ? `?search=${encodeURIComponent(trimmedQuery)}` : "",
    });
    if (isMobile) {
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
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
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Avatar sx={{ bgcolor: "secondary.main", width: 46, height: 46 }}>
            {user?.name?.charAt(0) || "U"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} noWrap>
              {user?.name}
            </Typography>
            <Chip size="small" label={user?.role} color="primary" sx={{ mt: 0.75, textTransform: "capitalize" }} />
          </Box>
        </Stack>
      </Box>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {navItems.map((item) => {
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
              <ListItemText primary={item.label} slotProps={{ primary: { fontWeight: location.pathname === item.to ? 700 : 500 } }} />
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
          <Stack direction="row" spacing={1.25} sx={{ display: { xs: "none", sm: "flex", md: "none" }, alignItems: "center" }}>
            <BugReportRounded color="primary" />
            <Typography variant="h6">BugTracker Pro</Typography>
          </Stack>
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
            {isMobile ? (
              <SearchField
                mobile
                open={searchOpen}
                onToggle={() => setSearchOpen((current) => !current)}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                onSubmit={handleSearchSubmit}
              />
            ) : (
              <SearchField
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                onSubmit={handleSearchSubmit}
              />
            )}
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Tooltip title={mode === "light" ? "Dark mode" : "Light mode"}>
              <IconButton color="inherit" onClick={toggleColorMode}>
                {mode === "light" ? <DarkModeRounded /> : <LightModeRounded />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={() => setNotificationsOpen(true)}>
                <Badge color="error" badgeContent={unreadCount || null}>
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
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
              <MenuItem onClick={() => { setMenuAnchor(null); navigate("/profile"); }}>
                <ListItemIcon><AccountCircleRounded fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => { setMenuAnchor(null); navigate("/settings"); }}>
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
            <Breadcrumbs separator=">" aria-label="breadcrumb">
              <Typography component={RouterLink} to="/" sx={{ textDecoration: "none", color: "text.secondary" }}>
                Home
              </Typography>
              {breadcrumbs.map((item, index) => (
                index === breadcrumbs.length - 1 ? (
                  <Typography key={item.to} color="text.primary" fontWeight={600}>
                    {item.label}
                  </Typography>
                ) : (
                  <Typography key={item.to} component={RouterLink} to={item.to} sx={{ textDecoration: "none", color: "text.secondary" }}>
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

      <Drawer
        anchor="right"
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 380 } } }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h6">Notifications</Typography>
                <Typography variant="body2" color="text.secondary">
                  Activity history and recent workspace messages.
                </Typography>
              </Box>
              <Chip label={`${history.length} total`} color="primary" variant="outlined" />
            </Stack>
          </Box>
          <Divider />
          <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: "space-between" }}>
            <Button size="small" onClick={markAllAsRead}>Mark all read</Button>
            <Button size="small" color="error" startIcon={<DeleteSweepRounded />} onClick={clearHistory}>
              Clear
            </Button>
          </Stack>
          <Divider />
          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {history.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="h6">No notifications yet</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Success, error, and info activity will be stored here as you use the app.
                </Typography>
              </Paper>
            ) : (
              <List sx={{ p: 0 }}>
                {history.map((entry) => (
                  <ListItem
                    key={entry.id}
                    disablePadding
                    sx={{ mb: 1.25 }}
                    secondaryAction={(
                      <IconButton edge="end" onClick={() => removeNotification(entry.id)}>
                        <DeleteSweepRounded fontSize="small" />
                      </IconButton>
                    )}
                  >
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        width: "100%",
                        borderColor: entry.read ? "divider" : "primary.main",
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Chip size="small" label={entry.severity} color={entry.severity} sx={{ textTransform: "capitalize" }} />
                          {!entry.read ? <Chip size="small" label="New" color="primary" /> : null}
                        </Stack>
                        <Typography>{entry.message}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(entry.createdAt).toLocaleString()}
                        </Typography>
                      </Stack>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
