import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import ViewKanbanRoundedIcon from "@mui/icons-material/ViewKanbanRounded";
import PageHeader from "../components/common/PageHeader";
import { useThemeMode } from "../context/ThemeModeContext";
import { useNotification } from "../context/NotificationContext";

const SETTINGS_KEY = "bugtracker-pro-user-settings";

export default function SettingsPage() {
  const { mode, setColorMode } = useThemeMode();
  const { notify } = useNotification();
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored
        ? JSON.parse(stored)
        : {
            desktopNotifications: true,
            compactIssues: false,
            defaultIssuesView: "table",
          };
    } catch (_error) {
      return {
        desktopNotifications: true,
        compactIssues: false,
        defaultIssuesView: "table",
      };
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const savePreference = (key, value, message) => {
    setSettings((current) => ({ ...current, [key]: value }));
    notify(message, "success");
  };

  return (
    <Stack spacing={3} className="page-fade-in">
      <PageHeader
        eyebrow="Preferences"
        title="Workspace settings and defaults"
        subtitle="Adjust your theme, issue board defaults, and local experience preferences."
      />

      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h6">Appearance</Typography>
            <Typography color="text.secondary">Choose the color mode that feels best for your workflow.</Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant={mode === "light" ? "contained" : "outlined"}
              startIcon={<LightModeRoundedIcon />}
              onClick={() => setColorMode("light")}
            >
              Light Mode
            </Button>
            <Button
              variant={mode === "dark" ? "contained" : "outlined"}
              startIcon={<DarkModeRoundedIcon />}
              onClick={() => setColorMode("dark")}
            >
              Dark Mode
            </Button>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="h6">Notifications</Typography>
            <Typography color="text.secondary">Control how much activity detail is preserved and surfaced in the workspace.</Typography>
          </Stack>
          <FormControlLabel
            control={
              <Switch
                checked={settings.desktopNotifications}
                onChange={(event) =>
                  savePreference(
                    "desktopNotifications",
                    event.target.checked,
                    `Notification preference ${event.target.checked ? "enabled" : "disabled"}.`,
                  )
                }
              />
            }
            label="Keep local notification history active"
          />

          <Divider />

          <Stack spacing={1}>
            <Typography variant="h6">Issues Workspace</Typography>
            <Typography color="text.secondary">Set the default way you want issue data to open and feel.</Typography>
          </Stack>
          <FormControlLabel
            control={
              <Switch
                checked={settings.compactIssues}
                onChange={(event) =>
                  savePreference(
                    "compactIssues",
                    event.target.checked,
                    `Compact issues layout ${event.target.checked ? "enabled" : "disabled"}.`,
                  )
                }
              />
            }
            label="Use compact spacing in issue views"
          />

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              icon={<ViewKanbanRoundedIcon />}
              label="Default: Table"
              color={settings.defaultIssuesView === "table" ? "primary" : "default"}
              onClick={() => savePreference("defaultIssuesView", "table", "Issue default view set to table.")}
              clickable
            />
            <Chip
              icon={<ViewKanbanRoundedIcon />}
              label="Default: Kanban"
              color={settings.defaultIssuesView === "kanban" ? "primary" : "default"}
              onClick={() => savePreference("defaultIssuesView", "kanban", "Issue default view set to kanban.")}
              clickable
            />
            <Chip
              icon={<NotificationsActiveRoundedIcon />}
              label={settings.desktopNotifications ? "History on" : "History off"}
              variant="outlined"
            />
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
