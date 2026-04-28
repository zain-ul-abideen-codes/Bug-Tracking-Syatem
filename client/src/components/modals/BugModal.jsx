import { useEffect, useMemo, useState } from "react";
import { Grid, TextField } from "@mui/material";
import Modal from "../common/Modal";
import InputField from "../common/InputField";
import SelectField from "../common/SelectField";
import Button from "../common/Button";

const statusByType = {
  bug: [
    { value: "new", label: "New" },
    { value: "started", label: "Started" },
    { value: "resolved", label: "Resolved" },
    { value: "reopened", label: "Reopened" },
  ],
  feature: [
    { value: "new", label: "New" },
    { value: "started", label: "Started" },
    { value: "completed", label: "Completed" },
    { value: "reopened", label: "Reopened" },
  ],
};

export default function BugModal({
  issue,
  projects,
  developers,
  role,
  submitError,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    title: issue?.title || "",
    type: issue?.type || "bug",
    status: issue?.status || "new",
    project: issue?.project?._id || "",
    description: issue?.description || "",
    deadline: issue?.deadline ? issue.deadline.slice(0, 10) : "",
    assignedDeveloper: issue?.assignedDeveloper?._id || "",
    screenshot: null,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedProject = projects.find((project) => project._id === form.project);
  const availableDevelopers =
    form.project && selectedProject
      ? developers.filter((developer) =>
          selectedProject.developers?.some((member) => member._id === developer._id)
        )
      : developers;
  const statusOptions =
    role === "developer"
      ? statusByType[form.type].filter((option) => option.value !== "reopened")
      : statusByType[form.type];

  const errors = useMemo(() => {
    const nextErrors = {};
    if (!form.title.trim() && role !== "developer") nextErrors.title = "Title is required.";
    if (!form.project && role !== "developer") nextErrors.project = "Project is required.";
    if (!form.status) nextErrors.status = "Status is required.";
    if (form.screenshot && !["image/png", "image/gif"].includes(form.screenshot.type)) {
      nextErrors.screenshot = "Only PNG and GIF files are allowed.";
    }
    return nextErrors;
  }, [form, role]);

  useEffect(() => {
    if (
      form.assignedDeveloper &&
      !availableDevelopers.some((developer) => developer._id === form.assignedDeveloper)
    ) {
      setForm((current) => ({ ...current, assignedDeveloper: "" }));
    }
  }, [form.assignedDeveloper, availableDevelopers]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: files ? files[0] : value,
      ...(name === "type" ? { status: "new" } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (Object.keys(errors).length) return;

    try {
      setSubmitting(true);

      if (role === "developer") {
        await onSubmit({ status: form.status });
        return;
      }

      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          payload.append(key, value);
        }
      });
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={role === "developer" ? "Update Issue Status" : issue ? "Edit Issue" : "Create Issue"}
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        {submitError ? <p className="server-error">{submitError}</p> : null}
        {role !== "developer" ? (
          <>
            <InputField label="Title" name="title" value={form.title} onChange={handleChange} error={errors.title} />
            <SelectField
              label="Type"
              name="type"
              value={form.type}
              onChange={handleChange}
              options={[
                { value: "bug", label: "Bug" },
                { value: "feature", label: "Feature" },
              ]}
            />
            <SelectField
              label="Project"
              name="project"
              value={form.project}
              onChange={handleChange}
              options={projects.map((project) => ({ value: project._id, label: project.title }))}
              error={errors.project}
            />
            {!projects.length ? (
              <p className="hint-text">No project available yet. Create a project first, then you can raise issues here.</p>
            ) : null}
            <TextField
              label="Description"
              name="description"
              multiline
              minRows={4}
              value={form.description}
              onChange={handleChange}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InputField label="Deadline" name="deadline" type="date" value={form.deadline} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={6}>
                <SelectField
                  label="Assigned Developer"
                  name="assignedDeveloper"
                  value={form.assignedDeveloper}
                  onChange={handleChange}
                  options={availableDevelopers.map((user) => ({ value: user._id, label: user.name }))}
                />
              </Grid>
            </Grid>
            {form.project && !availableDevelopers.length ? (
              <p className="hint-text">This project has no assigned developers yet. Add a developer in the project screen or leave assignee empty.</p>
            ) : null}
            <label className="field">
              <span>Screenshot (.png or .gif)</span>
              <input className="field-input" type="file" name="screenshot" accept=".png,.gif" onChange={handleChange} />
              {errors.screenshot ? <small className="field-error">{errors.screenshot}</small> : null}
            </label>
          </>
        ) : null}
        <SelectField
          label="Status"
          name="status"
          value={form.status}
          onChange={handleChange}
          options={statusOptions}
          error={errors.status}
        />
        {issue ? (
          <label className="field">
            <span>{role === "developer" ? "Developer Note" : "Comment / QA Feedback"}</span>
            <textarea
              className="field-input textarea"
              name="comment"
              value={form.comment}
              onChange={handleChange}
              placeholder="Write what changed, what still fails, or why this issue was reopened."
            />
          </label>
        ) : null}
        {issue ? (
          <div className="issue-detail-grid">
            <section className="issue-detail-panel">
              <h4>Comments</h4>
              {issue.comments?.length ? (
                <div className="thread-list">
                  {[...issue.comments]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((comment) => (
                      <article className="thread-card" key={comment._id}>
                        <div className="thread-meta">
                          <strong>{comment.author?.name || "Unknown user"}</strong>
                          <span>{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p>{comment.body}</p>
                      </article>
                    ))}
                </div>
              ) : (
                <p className="hint-text">No comments yet. Use comments to explain fixes, retest notes, or reopen reasons.</p>
              )}
            </section>
            <section className="issue-detail-panel">
              <h4>Activity Timeline</h4>
              {issue.activity?.length ? (
                <div className="timeline-list">
                  {[...issue.activity]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((entry) => (
                      <article className="timeline-item" key={entry._id}>
                        <div className="timeline-dot" />
                        <div>
                          <strong>{entry.actor?.name || "Unknown user"}</strong>
                          <p>{entry.message}</p>
                          <span>{new Date(entry.createdAt).toLocaleString()}</span>
                        </div>
                      </article>
                    ))}
                </div>
              ) : (
                <p className="hint-text">Activity will appear here as the issue moves through the workflow.</p>
              )}
            </section>
          </div>
        ) : null}
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || (!projects.length && role !== "developer")}>
            {submitting
              ? "Saving..."
              : role === "developer"
                ? "Update Status"
                : issue
                  ? "Save Changes"
                  : "Create Issue"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
