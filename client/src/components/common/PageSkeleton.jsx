import { Grid, Paper, Skeleton, Stack } from "@mui/material";

export default function PageSkeleton({ cards = 4, rows = 5 }) {
  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Skeleton variant="text" width={220} height={42} />
        <Skeleton variant="text" width="42%" />
      </Paper>
      <Grid container spacing={2.5}>
        {Array.from({ length: cards }).map((_, index) => (
          <Grid key={index} item xs={12} sm={6} lg={3}>
            <Paper sx={{ p: 3 }}>
              <Skeleton variant="rounded" height={110} />
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={52} />
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
