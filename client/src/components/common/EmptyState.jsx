import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import { Paper, Stack, Typography } from "@mui/material";

export default function EmptyState({
  icon: Icon = InboxRoundedIcon,
  title = "Nothing here yet",
  subtitle = "When data becomes available, it will appear here.",
}) {
  return (
    <Paper
      sx={{
        p: 5,
        minHeight: 240,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        border: (theme) => `1px dashed ${theme.palette.divider}`,
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <Icon color="primary" sx={{ fontSize: 52 }} />
        <Typography variant="h6">{title}</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
          {subtitle}
        </Typography>
      </Stack>
    </Paper>
  );
}
