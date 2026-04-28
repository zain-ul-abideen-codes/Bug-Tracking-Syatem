import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import { AppBar, Avatar, Box, Chip, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import useAuth from "../../hooks/useAuth";
import Button from "../common/Button";

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AppBar position="sticky" elevation={0} sx={{ borderRadius: 6 }}>
      <Toolbar sx={{ minHeight: 92, gap: 2 }}>
        <IconButton onClick={onMenuClick} sx={{ display: { md: "none" } }}>
          <MenuRoundedIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">Welcome back, {user.name}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textTransform: "capitalize" }}>
            {user.role}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={<CalendarMonthRoundedIcon />}
            label={today}
            variant="outlined"
            sx={{ display: { xs: "none", sm: "inline-flex" } }}
          />
          <IconButton sx={{ bgcolor: "rgba(31,111,120,0.08)" }}>
            <NotificationsNoneRoundedIcon />
          </IconButton>
          <Avatar sx={{ bgcolor: "primary.main", fontWeight: 800 }}>
            {user.name?.[0]?.toUpperCase() || "U"}
          </Avatar>
          <Button variant="secondary" onClick={logout}>
            Sign out
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
