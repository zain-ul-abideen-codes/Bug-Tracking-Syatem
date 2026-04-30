import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";

export default function AuditPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [auditResponse, statsResponse] = await Promise.all([
          api.get("/agent/audit"),
          api.get("/agent/audit/stats"),
        ]);
        setRows(auditResponse.data.items || []);
        setStats(statsResponse.data);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (user?.role !== "administrator") {
    return <Navigate to="/" replace />;
  }

  const columns = [
    {
      field: "timestamp",
      headerName: "Timestamp",
      flex: 1.2,
      valueFormatter: (value) => new Date(value).toLocaleString(),
    },
    {
      field: "user",
      headerName: "User",
      flex: 1.1,
      valueGetter: (_value, row) => row.userId?.name || "Unknown",
    },
    {
      field: "role",
      headerName: "Role",
      flex: 0.8,
      valueGetter: (_value, row) => row.userId?.role || "unknown",
    },
    {
      field: "toolName",
      headerName: "Action",
      flex: 1,
    },
    {
      field: "details",
      headerName: "Details",
      flex: 1.6,
      valueGetter: (_value, row) => row.errorMessage || row.toolOutput || "-",
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          label={row.success ? "success" : "failed"}
          color={row.success ? "success" : "error"}
        />
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        {[{
          title: "Total actions",
          value: stats?.overview?.totalActions,
        }, {
          title: "Tokens used",
          value: stats?.overview?.totalTokens,
        }, {
          title: "Avg latency",
          value: `${Math.round(stats?.overview?.avgLatencyMs || 0)} ms`,
        }, {
          title: "Failures",
          value: stats?.overview?.failures,
        }].map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 3 }}>
            <Paper sx={{ p: 2.5 }}>
              <Typography color="text.secondary">{item.title}</Typography>
              {loading ? (
                <Skeleton width="60%" height={40} />
              ) : (
                <Typography variant="h4" fontWeight={800}>
                  {item.value ?? 0}
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          BugBot Audit Trail
        </Typography>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <div style={{ minWidth: 900, height: 640 }}>
            <DataGrid
              loading={loading}
              rows={rows.map((row) => ({ id: row._id, ...row }))}
              columns={columns}
              pageSizeOptions={[10, 20, 50]}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                    page: 0,
                  },
                },
              }}
            />
          </div>
        </div>
      </Paper>
    </Stack>
  );
}
