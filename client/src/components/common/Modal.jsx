import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Dialog, DialogContent, DialogTitle, IconButton, Stack } from "@mui/material";

export default function Modal({ title, children, onClose }) {
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <span>{title}</span>
          <IconButton onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}
