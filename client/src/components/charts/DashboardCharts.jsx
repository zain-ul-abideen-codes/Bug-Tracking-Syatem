import { useMemo, useState } from "react";
import { Button, ButtonGroup, Grid, Paper, Stack, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartPalette = ["#1976D2", "#42A5F5", "#9C27B0", "#EF5350", "#FFB300", "#2E7D32"];

function ChartCard({ title, children }) {
  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Typography variant="h6">{title}</Typography>
        <div style={{ flex: 1, minHeight: 300 }}>{children}</div>
      </Stack>
    </Paper>
  );
}

export default function DashboardCharts({ charts }) {
  const [trendRange, setTrendRange] = useState("30");
  const issueTrendData = trendRange === "7" ? charts.velocitySeries || [] : charts.velocitySeries30 || charts.velocitySeries || [];
  const trendHasData = useMemo(
    () => issueTrendData.some((item) => Number(item.value) > 0),
    [issueTrendData],
  );

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <ChartCard title="Bug Status Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={charts.statusDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={95}
                paddingAngle={3}
              >
                {charts.statusDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <ChartCard title="Bugs Per Project">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.countPerProject}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#1976D2" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <ChartCard title="Bug vs Feature Ratio">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={charts.typeDistribution} dataKey="value" nameKey="name" outerRadius={95}>
                {charts.typeDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <ChartCard title="Issue Creation Trend">
          <Stack spacing={2} sx={{ height: "100%" }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Newly created issues in your visible scope
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  variant={trendRange === "7" ? "contained" : "outlined"}
                  onClick={() => setTrendRange("7")}
                >
                  7 Days
                </Button>
                <Button
                  variant={trendRange === "30" ? "contained" : "outlined"}
                  onClick={() => setTrendRange("30")}
                >
                  30 Days
                </Button>
              </ButtonGroup>
            </Stack>
            {trendHasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={issueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#9C27B0" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Stack
                spacing={1}
                sx={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 3,
                  color: "text.secondary",
                }}
              >
                <Typography variant="h6">No recent issue creation</Typography>
                <Typography variant="body2">
                  Create a new bug or feature to populate this trend chart.
                </Typography>
              </Stack>
            )}
          </Stack>
        </ChartCard>
      </Grid>
    </Grid>
  );
}
