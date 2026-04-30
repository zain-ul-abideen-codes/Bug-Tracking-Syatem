import { Chip } from "@mui/material";

const statusColorMap = {
  new: "default",
  started: "warning",
  resolved: "success",
  completed: "success",
  reopened: "error",
};

export default function StatusChip({ status }) {
  return (
    <Chip
      size="small"
      label={status}
      color={statusColorMap[status] || "default"}
      sx={{ textTransform: "capitalize", fontWeight: 600 }}
    />
  );
}
