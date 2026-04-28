import Chip from "@mui/material/Chip";

const colorMap = {
  new: "warning",
  started: "info",
  resolved: "success",
  completed: "success",
  reopened: "error",
};

export default function StatusBadge({ value }) {
  return <Chip label={value} color={colorMap[value] || "default"} size="small" sx={{ textTransform: "capitalize", fontWeight: 700 }} />;
}
