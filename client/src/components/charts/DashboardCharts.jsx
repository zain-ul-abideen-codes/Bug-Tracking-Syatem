import { Grid, Paper, Stack, Typography } from "@mui/material";
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
  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} lg={6}>
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
      <Grid item xs={12} lg={6}>
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
      <Grid item xs={12} lg={6}>
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
      <Grid item xs={12} lg={6}>
        <ChartCard title="Issue Creation Trend">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.velocitySeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#9C27B0" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Grid>
    </Grid>
  );
}
