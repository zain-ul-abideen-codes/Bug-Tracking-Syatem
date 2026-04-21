import { useMemo, useState } from "react";
import Modal from "../common/Modal";
import InputField from "../common/InputField";
import SelectField from "../common/SelectField";
import Button from "../common/Button";

const roleOptions = [
  { value: "administrator", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "qa", label: "QA Engineer" },
  { value: "developer", label: "Developer" },
];

export default function UserModal({ user, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "",
  });

  const errors = useMemo(() => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    if (!user && form.password.length < 8) nextErrors.password = "Minimum 8 characters.";
    if (!form.role) nextErrors.role = "Role is required.";
    return nextErrors;
  }, [form, user]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (Object.keys(errors).length) return;
    await onSubmit(form);
  };

  return (
    <Modal title={user ? "Edit User" : "Create User"} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <InputField label="Full Name" name="name" value={form.name} onChange={handleChange} error={errors.name} />
        <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
        {!user ? (
          <InputField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
        ) : null}
        <SelectField label="Role" name="role" value={form.role} onChange={handleChange} options={roleOptions} error={errors.role} />
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{user ? "Save Changes" : "Create User"}</Button>
        </div>
      </form>
    </Modal>
  );
}
