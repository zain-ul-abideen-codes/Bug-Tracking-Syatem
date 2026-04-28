import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Paper, Stack, Typography } from "@mui/material";

const colors = ["#d4693f", "#1e5f74", "#37966f", "#bb3e03", "#7b2cbf", "#264653"];

export default function DashboardCharts({ charts }) {
  const sections = [
    {
      title: "Bug Status Distribution",
      type: "pie",
      data: charts.statusDistribution,
    },
    {
      title: "Issue Type Distribution",
      type: "pie",
      data: charts.typeDistribution,
    },
    {
      title: "Issue Count Per Project",
      type: "bar",
      data: charts.countPerProject,
    },
    {
      title: "Issue Creation Velocity",
      type: "line",
      data: charts.velocitySeries,
    },
  ];

  return (
    <div className="chart-grid">
      {sections.map((section) => (
        <Paper key={section.title} sx={{ p: 3 }}>
          <Stack spacing={2}>
            <div>
              <Typography variant="h6">{section.title}</Typography>
            </div>
            <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              {section.type === "pie" ? (
                <PieChart>
                  <Pie
                    data={section.data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {section.data.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : section.type === "bar" ? (
                <BarChart data={section.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(31,41,51,0.08)" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1e5f74" radius={[10, 10, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={section.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(31,41,51,0.08)" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#d4693f"
                    strokeWidth={3}
                    dot={{ fill: "#bb3e03", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
            </div>
          </Stack>
        </Paper>
      ))}
    </div>
  );
}
