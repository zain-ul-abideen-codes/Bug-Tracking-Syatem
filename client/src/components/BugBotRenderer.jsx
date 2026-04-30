import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Avatar,
  Box,
  Chip,
  Drawer,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const parseTaggedBlocks = (content) => {
  const regex = /<bugbot-data type=['"]([^'"]+)['"]>([\s\S]*?)<\/bugbot-data>/g;
  const blocks = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const textBefore = content.slice(lastIndex, match.index).trim();
    if (textBefore) {
      blocks.push({ type: "text", value: textBefore });
    }

    try {
      blocks.push({
        type: match[1],
        value: JSON.parse(match[2]),
      });
    } catch (_error) {
      blocks.push({ type: "text", value: match[0] });
    }

    lastIndex = regex.lastIndex;
  }

  const rest = content.slice(lastIndex).trim();
  if (rest) {
    blocks.push({ type: "text", value: rest });
  }

  return blocks.length ? blocks : [{ type: "text", value: content }];
};

export default function BugBotRenderer({ content }) {
  const [selectedBug, setSelectedBug] = useState(null);
  const blocks = useMemo(() => parseTaggedBlocks(content), [content]);

  return (
    <Stack spacing={1.5}>
      {blocks.map((block, index) => {
        if (block.type === "bug_list" && Array.isArray(block.value)) {
          return (
            <Paper key={index} variant="outlined" sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assignee</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {block.value.map((bug) => (
                    <TableRow
                      key={bug.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => setSelectedBug(bug)}
                    >
                      <TableCell>{bug.id?.slice(-6)}</TableCell>
                      <TableCell>{bug.title}</TableCell>
                      <TableCell>
                        <Chip size="small" label={bug.status} color={["resolved", "completed"].includes(bug.status) ? "success" : bug.status === "started" ? "warning" : "default"} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 24, height: 24 }}>
                            {String(bug.assignee || "U").charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{bug.assignee}</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          );
        }

        if (block.type === "project_list" && Array.isArray(block.value)) {
          return (
            <Grid key={index} container spacing={1.5}>
              {block.value.map((project) => (
                <Grid size={{ xs: 12, md: 6 }} key={project.id}>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Typography fontWeight={700}>{project.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manager: {project.manager}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      <Chip size="small" label={`QA ${project.qaCount}`} />
                      <Chip size="small" label={`Developers ${project.developerCount}`} />
                      <Chip size="small" color="primary" label={`Bugs ${project.bugCount}`} />
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          );
        }

        if (block.type === "stats" && block.value) {
          const chartData = block.value.statusDist || block.value.bugsPerProject || [];
          return (
            <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Dashboard Snapshot
              </Typography>
              <Box sx={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1976d2" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          );
        }

        return (
          <Box
            key={index}
            sx={{
              "& p": { m: 0 },
              "& ul, & ol": { pl: 2.5, my: 0.5 },
            }}
          >
            <ReactMarkdown>{block.value}</ReactMarkdown>
          </Box>
        );
      })}

      <Drawer
        anchor="right"
        open={Boolean(selectedBug)}
        onClose={() => setSelectedBug(null)}
      >
        <Box sx={{ width: 340, p: 3 }}>
          <Typography variant="h6">Bug Detail</Typography>
          {selectedBug && (
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <Typography><strong>ID:</strong> {selectedBug.id}</Typography>
              <Typography><strong>Title:</strong> {selectedBug.title}</Typography>
              <Typography><strong>Status:</strong> {selectedBug.status}</Typography>
              <Typography><strong>Assignee:</strong> {selectedBug.assignee}</Typography>
              <Typography><strong>Type:</strong> {selectedBug.type || "Issue"}</Typography>
            </Stack>
          )}
        </Box>
      </Drawer>
    </Stack>
  );
}
