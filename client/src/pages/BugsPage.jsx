import { useEffect, useState } from "react";
import { createBug, deleteBug, getBugs, updateBug } from "../api/bugsApi";
import { getProjects } from "../api/projectsApi";
import { getUsers } from "../api/usersApi";
import useAuth from "../hooks/useAuth";
import useModal from "../hooks/useModal";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBadge from "../components/common/StatusBadge";
import BugModal from "../components/modals/BugModal";

export default function BugsPage() {
  const { user } = useAuth();
  const bugModal = useModal();
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [selectedBug, setSelectedBug] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

  const canCreate = ["administrator", "qa"].includes(user.role);
  const canDelete = (bug) =>
    user.role === "administrator" || (user.role === "qa" && bug.createdBy?._id === user.userId);
  const canEdit = (bug) =>
    user.role === "administrator" ||
    (user.role === "qa" && bug.createdBy?._id === user.userId) ||
    (user.role === "developer" && bug.assignedDeveloper?._id === user.userId);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");
      const [bugData, projectData, userData] = await Promise.all([
        getBugs(),
        getProjects(),
        ["administrator", "qa"].includes(user.role) ? getUsers() : Promise.resolve([]),
      ]);
      setBugs(bugData);
      setProjects(projectData);
      setDevelopers(userData.filter((record) => record.role === "developer"));
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load issues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const openCreate = () => {
    setSelectedBug(null);
    setSubmitError("");
    bugModal.openModal();
  };

  const openEdit = (bug) => {
    setSelectedBug(bug);
    setSubmitError("");
    bugModal.openModal();
  };

  const submitBug = async (payload) => {
    try {
      setSubmitError("");
      if (selectedBug) {
        await updateBug(selectedBug._id, payload);
      } else {
        await createBug(payload);
      }
      bugModal.closeModal();
      await loadPage();
    } catch (submitBugError) {
      setSubmitError(submitBugError.response?.data?.message || "Unable to save issue.");
    }
  };

  const handleDelete = async (id) => {
    await deleteBug(id);
    await loadPage();
  };

  const filteredBugs = bugs.filter((bug) => {
    const matchesQuery =
      !query ||
      [bug.title, bug.project?.title, bug.assignedDeveloper?.name, bug.type, bug.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query.toLowerCase()));
    const matchesStatus = statusFilter === "all" || bug.status === statusFilter;
    const matchesType = typeFilter === "all" || bug.type === typeFilter;
    const matchesProject = projectFilter === "all" || bug.project?._id === projectFilter;
    return matchesQuery && matchesStatus && matchesType && matchesProject;
  });

  const summary = {
    total: filteredBugs.length,
    new: filteredBugs.filter((bug) => bug.status === "new").length,
    started: filteredBugs.filter((bug) => bug.status === "started").length,
    done: filteredBugs.filter((bug) => ["resolved", "completed"].includes(bug.status)).length,
    reopened: filteredBugs.filter((bug) => bug.status === "reopened").length,
  };

  if (loading) return <LoadingSpinner label="Loading issues..." />;

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Issues</h2>
          <p>Bugs and feature requests with project context and workflow status.</p>
        </div>
        {canCreate ? <Button onClick={openCreate}>Create Issue</Button> : null}
      </div>
      {error ? <p className="server-error">{error}</p> : null}
      <div className="toolbar-grid">
        <input
          className="field-input"
          placeholder="Search by title, project, assignee, type, or status"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select className="field-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="started">Started</option>
          <option value="resolved">Resolved</option>
          <option value="completed">Completed</option>
          <option value="reopened">Reopened</option>
        </select>
        <select className="field-input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="all">All Types</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
        </select>
        <select className="field-input" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
          <option value="all">All Projects</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.title}
            </option>
          ))}
        </select>
      </div>
      <div className="mini-stats-grid">
        <div className="mini-stat-card">
          <span>Total</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="mini-stat-card">
          <span>New</span>
          <strong>{summary.new}</strong>
        </div>
        <div className="mini-stat-card">
          <span>Started</span>
          <strong>{summary.started}</strong>
        </div>
        <div className="mini-stat-card">
          <span>Done</span>
          <strong>{summary.done}</strong>
        </div>
        <div className="mini-stat-card">
          <span>Reopened</span>
          <strong>{summary.reopened}</strong>
        </div>
      </div>
      {!projects.length && canCreate ? (
        <div className="empty-callout">
          <strong>Issue creation needs a project first.</strong>
          <p>Create a project in the Projects section, assign QA and developers, then come back here to log issues.</p>
        </div>
      ) : null}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Project</th>
              <th>Assigned Developer</th>
              <th>Deadline</th>
              <th>Screenshot</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBugs.map((bug) => (
              <tr key={bug._id}>
                <td>{bug.title}</td>
                <td>{bug.type}</td>
                <td>
                  <StatusBadge value={bug.status} />
                </td>
                <td>{bug.project?.title}</td>
                <td>{bug.assignedDeveloper?.name || "Unassigned"}</td>
                <td>{bug.deadline ? new Date(bug.deadline).toLocaleDateString() : "None"}</td>
                <td>
                  {bug.screenshot ? (
                    <a href={`${apiBase}${bug.screenshot}`} target="_blank" rel="noreferrer">
                      View
                    </a>
                  ) : (
                    "None"
                  )}
                </td>
                <td className="actions-cell">
                  {canEdit(bug) ? (
                    <Button variant="secondary" onClick={() => openEdit(bug)}>
                      {user.role === "developer" ? "Update Status" : "Edit"}
                    </Button>
                  ) : null}
                  {canDelete(bug) ? (
                    <Button variant="danger" onClick={() => handleDelete(bug._id)}>
                      Delete
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bugModal.isOpen ? (
        <BugModal
          issue={selectedBug}
          projects={projects}
          developers={developers}
          role={user.role}
          submitError={submitError}
          onClose={bugModal.closeModal}
          onSubmit={submitBug}
        />
      ) : null}
    </section>
  );
}
