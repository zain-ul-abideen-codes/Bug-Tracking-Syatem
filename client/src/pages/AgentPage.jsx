import {
  Chip,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CachedRoundedIcon from "@mui/icons-material/CachedRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import AgentChat from "../components/AgentChat";
import useAgentChat from "../hooks/useAgentChat";

export default function AgentPage() {
  const chat = useAgentChat();
  const { sessions, health, sessionId } = chat;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <SmartToyRoundedIcon color="primary" />
                <Typography variant="h6">Agent Control</Typography>
              </Stack>
              <Typography color="text.secondary">
                Streaming AI workspace with fast intent routing, cache layer, and audit-backed tool execution.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip icon={<SpeedRoundedIcon />} label={health?.streamEnabled ? "Streaming on" : "Streaming off"} color="primary" />
                <Chip icon={<CachedRoundedIcon />} label={`Cache keys ${health?.cache?.keys || 0}`} />
                <Chip icon={<AccessTimeRoundedIcon />} label={health?.openAiConfigured ? health.model : "Local mode"} />
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Recent Sessions
            </Typography>
            <List disablePadding>
              {sessions.length === 0 ? (
                <Typography color="text.secondary">
                  No saved chat sessions yet.
                </Typography>
              ) : (
                sessions.slice(0, 8).map((item) => (
                  <ListItemButton
                    key={item.sessionId}
                    selected={item.sessionId === sessionId}
                    sx={{ borderRadius: 2, mb: 0.5 }}
                  >
                    <ListItemText
                      primary={item.summary || `Session ${item.sessionId.slice(-6)}`}
                      secondary={`${item.messageCount || 0} messages`}
                    />
                  </ListItemButton>
                ))
              )}
            </List>
          </Paper>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <AgentChat chat={chat} />
      </Grid>
    </Grid>
  );
}
