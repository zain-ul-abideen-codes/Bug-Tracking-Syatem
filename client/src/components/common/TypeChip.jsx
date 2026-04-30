import { Chip } from "@mui/material";

export default function TypeChip({ type }) {
  return (
    <Chip
      size="small"
      label={type}
      color={type === "bug" ? "error" : "info"}
      sx={{ textTransform: "capitalize", fontWeight: 600 }}
    />
  );
}
