import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  loading = false,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pr: 7 }}>
        {title}
        <IconButton
          onClick={onClose}
          disabled={loading}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <Typography color="text.secondary">{description}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
