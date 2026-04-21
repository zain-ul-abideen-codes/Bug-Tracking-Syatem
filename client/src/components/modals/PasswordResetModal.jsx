import { useMemo, useState } from "react";
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
        <InputField
          label="New Password"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          error={error}
        />
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Reset Password</Button>
        </div>
      </form>
    </Modal>
  );
}
