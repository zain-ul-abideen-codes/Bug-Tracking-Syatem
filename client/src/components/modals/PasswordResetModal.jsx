import { useMemo, useState } from "react";
import { Alert, Stack } from "@mui/material";
import Modal from "../common/Modal";
import InputField from "../common/InputField";
import Button from "../common/Button";

export default function PasswordResetModal({ onClose, onSubmit }) {
  const [newPassword, setNewPassword] = useState("");

  const error = useMemo(() => {
    if (!newPassword.trim()) return "Password is required.";
    if (newPassword.length < 8) return "Minimum 8 characters.";
    return "";
  }, [newPassword]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (error) return;
    await onSubmit(newPassword);
  };

  return (
    <Modal title="Reset Password" onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <Alert severity="warning">This will immediately replace the user’s current password and force a fresh login.</Alert>
        <InputField
          label="New Password"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          error={error}
        />
        <Stack className="modal-actions" direction="row">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Reset Password</Button>
        </Stack>
      </form>
    </Modal>
  );
}
