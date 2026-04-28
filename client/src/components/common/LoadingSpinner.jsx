import { Box, CircularProgress, Typography } from "@mui/material";

export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <Box minHeight={260} display="grid" placeItems="center" gap={2}>
      <CircularProgress />
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  );
}
