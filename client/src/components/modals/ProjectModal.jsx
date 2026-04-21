import { useMemo, useState } from "react";
import Modal from "../common/Modal";
import InputField from "../common/InputField";
import SelectField from "../common/SelectField";
import Button from "../common/Button";

const selectedValues = (options) =>
  Array.from(options).filter((option) => option.selected).map((option) => option.value);

export default function ProjectModal({ project, users, currentRole, onClose, onSubmit }) {
  const managers = users.filter((user) => user.role === "manager");
  const qaEngineers = users.filter((user) => user.role === "qa");
  const developers = users.filter((user) => user.role === "developer");

  const [form, setForm] = useState({
    title: project?.title || "",
    description: project?.description || "",
    manager: project?.manager?._id || "",
    qaEngineers: project?.qaEngineers?.map((item) => item._id) || [],
    developers: project?.developers?.map((item) => item._id) || [],
  });

  const errors = useMemo(() => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Project title is required.";
    return nextErrors;
  }, [form]);

  const handleChange = (event) => {
    const { name, value, options, multiple } = event.target;
    setForm((current) => ({
      ...current,
      [name]: multiple ? selectedValues(options) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (Object.keys(errors).length) return;
    await onSubmit(form);
  };

  return (
    <Modal title={project ? "Edit Project" : "Create Project"} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <InputField label="Project Title" name="title" value={form.title} onChange={handleChange} error={errors.title} />
        <label className="field">
          <span>Description</span>
          <textarea className="field-input textarea" name="description" value={form.description} onChange={handleChange} />
        </label>
        {currentRole === "administrator" ? (
          <SelectField
            label="Manager"
            name="manager"
            value={form.manager}
            onChange={handleChange}
            options={managers.map((user) => ({ value: user._id, label: user.name }))}
          />
        ) : null}
        <SelectField
          label="QA Engineers"
          name="qaEngineers"
          value={form.qaEngineers}
          onChange={handleChange}
          multiple
          options={qaEngineers.map((user) => ({ value: user._id, label: user.name }))}
        />
        <SelectField
          label="Developers"
          name="developers"
          value={form.developers}
          onChange={handleChange}
          multiple
          options={developers.map((user) => ({ value: user._id, label: user.name }))}
        />
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{project ? "Save Changes" : "Create Project"}</Button>
        </div>
      </form>
    </Modal>
  );
}
