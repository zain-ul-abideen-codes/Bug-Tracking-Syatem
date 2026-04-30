import { Box, Stack, Typography } from "@mui/material";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", md: "center" }}
      spacing={2}
    >
      <Box>
        {eyebrow ? (
          <Typography
            variant="caption"
            sx={{ textTransform: "uppercase", letterSpacing: "0.18em", color: "primary.main", fontWeight: 700 }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h4" sx={{ mt: 0.75 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action || null}
    </Stack>
  );
}
